/**
 * focusStore.ts
 * AsyncStorage-backed state layer for the Focus/Streak/Reward system.
 * All functions are async and safe to call from any component.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { ACHIEVEMENT_DEFS } from './achievementDefs'
import { isRCPremium, fetchCustomerInfo } from './purchases'
import { demoUser } from './mockData'
import { supabase, isSupabaseEnabled } from './supabase'
import type { UserPersonalization } from '@/hooks/usePersonalization'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FocusProfile {
  xp: number
  level: number
  totalSessions: number
  totalFocusMinutes: number
  longestStreak: number
}

export interface StreakData {
  currentStreak: number
  lastSessionDate: string | null // ISO date string YYYY-MM-DD
  freezeAvailable: boolean
  lastFreezeDate: string | null  // last time a freeze was granted
  freezeUsed: boolean            // was freeze consumed for a missed day?
}

export interface AchievementState {
  [id: string]: { unlocked: boolean; unlockedAt: string | null }
}

export type SessionState = 'idle' | 'selecting' | 'active' | 'paused' | 'completed' | 'rewarded'

export interface ActiveSession {
  id: string
  state: SessionState
  startedAt: number   // epoch ms
  durationMs: number  // total planned duration
  elapsedMs: number   // elapsed at last save
  isPaused: boolean
  blockedApps: string[] // Apps selected for this session
  distractionWarnings: number // Times the user left the app
  xpEarned?: number
  focusScore?: number
}

export interface DailyLog {
  date: string               // YYYY-MM-DD
  focusMinutes: number
  distractionMinutes: number
  sessionsCompleted: number
  score: number              // 0-100 (Deep Work Score)
  avoidanceRate: number      // 0-1 (Success in staying in app)
}

export interface DailyGoal {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  profile: 'focus:profile',
  streak: 'focus:streak',
  achievements: 'focus:achievements',
  activeSession: 'focus:activeSession',
  dailyLogs: 'focus:dailyLogs',
  dailyGoals: 'focus:dailyGoals',
} as const

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultProfile: FocusProfile = {
  xp: 0,
  level: 1,
  totalSessions: 0,
  totalFocusMinutes: 0,
  longestStreak: 0,
}

const defaultStreak: StreakData = {
  currentStreak: 0,
  lastSessionDate: null,
  freezeAvailable: true,
  lastFreezeDate: null,
  freezeUsed: false,
}

// ─── Level Math ───────────────────────────────────────────────────────────────

/** XP threshold to reach a given level (level starts at 1) */
export function xpForLevel(level: number): number {
  // Level 1→2: 100 XP, each subsequent level costs 50 XP more
  // Total XP to reach level N = sum of 100 + 150 + 200 ... for (N-1) steps
  if (level <= 1) return 0
  let total = 0
  for (let i = 1; i < level; i++) {
    total += 100 + (i - 1) * 50
  }
  return total
}

/** XP needed to go from current level to next */
export function xpForNextLevel(level: number): number {
  return 100 + (level - 1) * 50
}

/** Compute level from total XP */
export function computeLevel(xp: number): number {
  let level = 1
  while (xp >= xpForLevel(level + 1)) {
    level++
  }
  return level
}

/** Progress fraction (0–1) within current level */
export function levelProgress(xp: number): number {
  const lvl = computeLevel(xp)
  const start = xpForLevel(lvl)
  const end = xpForLevel(lvl + 1)
  return (xp - start) / (end - start)
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime()
  const msB = new Date(b).getTime()
  return Math.round(Math.abs(msB - msA) / 86_400_000)
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<FocusProfile> {
  const raw = await AsyncStorage.getItem(KEYS.profile)
  const local = raw ? { ...defaultProfile, ...JSON.parse(raw) } : { ...defaultProfile }
  
  if (isSupabaseEnabled) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: cloud } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (cloud) {
        // Simple conflict resolution: deeper progress wins (higher XP)
        const merged = (cloud.xp || 0) > local.xp ? {
          xp: cloud.xp || 0,
          level: computeLevel(cloud.xp || 0),
          totalSessions: cloud.total_sessions || 0,
          totalFocusMinutes: cloud.total_focus_minutes || 0,
          longestStreak: cloud.longest_streak || 0
        } : local
        return merged
      }
    }
  }
  return local
}

export async function saveProfile(profile: FocusProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile))
  
  if (isSupabaseEnabled) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        xp: profile.xp,
        total_sessions: profile.totalSessions,
        total_focus_minutes: profile.totalFocusMinutes,
        longest_streak: profile.longestStreak
      })
    }
  }
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export async function getStreak(): Promise<StreakData> {
  const raw = await AsyncStorage.getItem(KEYS.streak)
  return raw ? { ...defaultStreak, ...JSON.parse(raw) } : { ...defaultStreak }
}

/**
 * Called after each completed focus session.
 * Handles streak increment, freeze, and break detection.
 * Returns the updated streak + whether the streak just broke.
 */
export async function updateStreak(): Promise<{ streak: StreakData; broke: boolean; recovered: boolean }> {
  const streak = await getStreak()
  const today = todayStr()
  let broke = false
  let recovered = false

  if (streak.lastSessionDate === null) {
    // First ever session
    streak.currentStreak = 1
  } else if (streak.lastSessionDate === today) {
    // Already done a session today — no change
  } else {
    const diff = daysBetween(streak.lastSessionDate, today)
    if (diff === 1) {
      // Consecutive day
      streak.currentStreak += 1
      // Grant a freeze token every 7 days
      if (streak.currentStreak % 7 === 0) {
        streak.freezeAvailable = true
        streak.lastFreezeDate = today
      }
    } else {
      // Missed day(s)
      if (streak.freezeAvailable && !streak.freezeUsed && diff === 2) {
        // Auto-apply freeze for exactly one missed day
        streak.freezeAvailable = false
        streak.freezeUsed = true
        streak.currentStreak += 1
        recovered = true
      } else {
        // Streak broken
        broke = true
        streak.currentStreak = 1
        streak.freezeUsed = false
      }
    }
  }

  streak.lastSessionDate = today
  if (streak.currentStreak > (streak.currentStreak)) {
    // will be checked against profile longestStreak at profile save
  }

  await AsyncStorage.setItem(KEYS.streak, JSON.stringify(streak))
  return { streak, broke, recovered }
}

export async function useStreakFreeze(): Promise<boolean> {
  const streak = await getStreak()
  if (!streak.freezeAvailable) return false
  streak.freezeAvailable = false
  streak.freezeUsed = true
  await AsyncStorage.setItem(KEYS.streak, JSON.stringify(streak))
  return true
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export async function getAchievements(): Promise<AchievementState> {
  const raw = await AsyncStorage.getItem(KEYS.achievements)
  const base: AchievementState = {}
  ACHIEVEMENT_DEFS.forEach((a) => {
    base[a.id] = { unlocked: false, unlockedAt: null }
  })
  return raw ? { ...base, ...JSON.parse(raw) } : base
}

/** Returns list of newly-unlocked achievement IDs */
export async function checkAndUnlockAchievements(
  profile: FocusProfile,
  streak: StreakData
): Promise<string[]> {
  const achievements = await getAchievements()
  const newlyUnlocked: string[] = []

  for (const def of ACHIEVEMENT_DEFS) {
    if (achievements[def.id]?.unlocked) continue
    let should = false

    switch (def.conditionKey) {
      case 'firstSession':        should = profile.totalSessions >= 1; break
      case 'sessions5':           should = profile.totalSessions >= 5; break
      case 'sessions25':          should = profile.totalSessions >= 25; break
      case 'sessions100':         should = profile.totalSessions >= 100; break
      case 'streak3':             should = streak.currentStreak >= 3; break
      case 'streak7':             should = streak.currentStreak >= 7; break
      case 'streak30':            should = streak.currentStreak >= 30; break
      case 'level5':              should = profile.level >= 5; break
      case 'level10':             should = profile.level >= 10; break
      case 'focus60min':          should = profile.totalFocusMinutes >= 60; break
      case 'focus500min':         should = profile.totalFocusMinutes >= 500; break
      case 'freezeUsed':          should = streak.freezeUsed; break
    }

    if (should) {
      achievements[def.id] = { unlocked: true, unlockedAt: new Date().toISOString() }
      newlyUnlocked.push(def.id)
    }
  }

  await AsyncStorage.setItem(KEYS.achievements, JSON.stringify(achievements))
  
  if (isSupabaseEnabled && newlyUnlocked.length > 0) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const inserts = newlyUnlocked.map(id => ({
        user_id: user.id,
        achievement_id: id,
        unlocked_at: achievements[id].unlockedAt
      }))
      await supabase.from('achievements').insert(inserts)
    }
  }

  return newlyUnlocked
}

// ─── Daily Log ────────────────────────────────────────────────────────────────

const DEFAULT_DAILY_TARGET_MINUTES = 60 // user's daily focus goal

function emptyLog(date: string): DailyLog {
  return { date, focusMinutes: 0, distractionMinutes: 0, sessionsCompleted: 0, score: 0, avoidanceRate: 1 }
}

async function getAllLogs(): Promise<Record<string, DailyLog>> {
  const raw = await AsyncStorage.getItem(KEYS.dailyLogs)
  return raw ? JSON.parse(raw) : {}
}

async function saveAllLogs(logs: Record<string, DailyLog>): Promise<void> {
  await AsyncStorage.setItem(KEYS.dailyLogs, JSON.stringify(logs))
}

export async function getTodayLog(): Promise<DailyLog> {
  const logs = await getAllLogs()
  return logs[todayStr()] ?? emptyLog(todayStr())
}

/**
 * Returns the last `days` daily logs (oldest first), filling gaps with empty logs.
 */
export async function getDailyLogs(days = 7): Promise<DailyLog[]> {
  const logs = await getAllLogs()
  const result: DailyLog[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push(logs[key] ?? emptyLog(key))
  }
  return result
}

export async function logDistractionMinutes(mins: number): Promise<void> {
  const logs = await getAllLogs()
  const today = todayStr()
  const entry = logs[today] ?? emptyLog(today)
  entry.distractionMinutes += mins
  // Since we don't have a specific session here, we use a generic completion ratio of 1 for daily tracking
  entry.score = computeFocusScore(1, entry.distractionMinutes, 0) 
  logs[today] = entry
  await saveAllLogs(logs)
}

/**
 * Focus Score = 0.5 * (Session Completion) + 0.3 * (Distraction Resistance) + 0.2 * (Consistency)
 * Distraction Resistance = 1 - (warnings / expected_max)
 * Consistency = min(streak / 10, 1)
 */
export function computeFocusScore(
  completionRatio: number, // 0-1
  distractionWarnings: number,
  streak: number,
  intensity: UserPersonalization['intensity'] = 'sharp'
): number {
  const completionScore = completionRatio * 100
  
  // Stricter resistance penalty for elite intensity
  const divisor = intensity === 'elite' ? 5 : intensity === 'soft' ? 15 : 10
  const resistanceScore = Math.max(0, (1 - distractionWarnings / divisor) * 100)
  
  const consistencyScore = Math.min(streak / 10, 1) * 100

  const raw = (completionScore * 0.5) + (resistanceScore * 0.3) + (consistencyScore * 0.2)
  return Math.round(Math.min(100, Math.max(0, raw)))
}

/**
 * XP = (Minutes Focused * 10) + (Apps Avoided * 15) + (Streak Bonus)
 * Streak Bonus = min(streak * 5, 100)
 */
export function computeSessionXP(
  minutesFocused: number,
  appsAvoided: number,
  streak: number,
  intensity: UserPersonalization['intensity'] = 'sharp'
): number {
  // Simple formula as requested: XP = minutes * 2
  // We can add a small bonus for intensity or avoidance if desired, 
  // but let's stick to the core request first.
  const multiplier = intensity === 'elite' ? 1.5 : intensity === 'soft' ? 0.8 : 1.0
  const bonus = appsAvoided * 1 // small bonus for blocking apps
  
  return Math.round((minutesFocused * 2 + bonus) * multiplier)
}

export function scoreTier(score: number): { label: string; emoji: string; color: string } {
  if (score >= 80) return { label: 'Elite', emoji: '🏆', color: '#F59E0B' }
  if (score >= 60) return { label: 'Focused', emoji: '💎', color: '#FCD34D' }
  if (score >= 40) return { label: 'Building', emoji: '⚡', color: '#B45309' }
  return { label: 'Scattered', emoji: '🌫️', color: '#78350F' }
}

// ─── Session Completion (main entry point) ────────────────────────────────────

export const XP_PER_SESSION = 25

/**
 * Call this when a focus session finishes.
 * Returns updated profile, streak result, and newly unlocked achievement IDs.
 */
export async function completeSession(
    session: ActiveSession
): Promise<{
  profile: FocusProfile
  xpGained: number
  leveled: boolean
  streakResult: { streak: StreakData; broke: boolean; recovered: boolean }
  newAchievements: string[]
  focusScore: number
}> {
  const profile = await getProfile()
  const streakData = await getStreak()
  const oldLevel = profile.level

  const durationMinutes = Math.floor(session.durationMs / 60000)
  const appsAvoided = session.blockedApps.length
  
  const xpGained = computeSessionXP(durationMinutes, appsAvoided, streakData.currentStreak, 'sharp')
  const focusScore = computeFocusScore(1, session.distractionWarnings, streakData.currentStreak, 'sharp')

  profile.totalSessions += 1
  profile.totalFocusMinutes += durationMinutes
  profile.xp += xpGained
  profile.level = computeLevel(profile.xp)

  const streakResult = await updateStreak()
  if (streakResult.streak.currentStreak > profile.longestStreak) {
    profile.longestStreak = streakResult.streak.currentStreak
  }

  // Update Profiles (Local & Cloud)
  await saveProfile(profile)

  // Sync to Cloud specifically for focus_sessions
  if (isSupabaseEnabled) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          // 1. Insert session record
          await supabase.from('focus_sessions').insert({
              user_id: user.id,
              duration_ms: session.durationMs,
              completed: true,
              mode: 'focus', // Default category
              distractions: session.distractionWarnings,
              xp_gained: xpGained,
              started_at: new Date(session.startedAt).toISOString(),
              ended_at: new Date().toISOString()
          })
          
          // 2. Update Profile with streak and focus_score
          await supabase.from('profiles').update({
              streak: streakResult.streak.currentStreak,
              focus_score: focusScore,
              xp: profile.xp
          }).eq('id', user.id)
      }
  }

  // Update today's daily log (Local)
  const allLogs = await getAllLogs()
  const today = todayStr()
  const todayEntry = allLogs[today] ?? emptyLog(today)
  todayEntry.focusMinutes += durationMinutes
  todayEntry.sessionsCompleted += 1
  todayEntry.score = focusScore
  allLogs[today] = todayEntry
  await saveAllLogs(allLogs)

  const newAchievements = await checkAndUnlockAchievements(profile, streakResult.streak)

  return {
    profile,
    xpGained,
    leveled: profile.level > oldLevel,
    streakResult,
    newAchievements,
    focusScore,
  }
}

// ─── Premium & Social Mock Helpers ──────────────────────────────────────────

/** Returns true if the user has an active RevenueCat entitlement */
export async function isPremiumUser(): Promise<boolean> {
  // In development/Expo Go, we can mock this or check RC
  const info = await fetchCustomerInfo()
  return isRCPremium(info)
}

export interface LeaderboardEntry {
  rank: number
  name: string
  xp: number
  userId: string
  isMe?: boolean
  isFriend?: boolean
  avatar?: string
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (isSupabaseEnabled) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: leaders } = await supabase
        .from('profiles')
        .select('id, display_name, name, xp, avatar_url')
        .order('xp', { ascending: false })
        .limit(20)

      if (leaders && leaders.length > 0) {
          return leaders.map((l, i) => ({
          rank: i + 1,
          name: l.name || 'Anonymous User',
          xp: l.xp ?? 0,
          userId: l.id,
          isMe: l.id === user.id,
          avatar: l.avatar_url ?? `https://api.dicebear.com/7.x/initials/svg?seed=${l.name || 'AN'}`,
        }))
      }
    }
  }

  // Fallback mock leaderboard
  return [
    { rank: 1, name: 'Satoshi F.', xp: 2840, userId: '1', avatar: 'https://i.pravatar.cc/100?u=1' },
    { rank: 2, name: 'Alex River', xp: 2420, userId: '2', isFriend: true, avatar: 'https://i.pravatar.cc/100?u=2' },
    { rank: 3, name: 'Maya P.', xp: 2150, userId: '3', isFriend: true, avatar: 'https://i.pravatar.cc/100?u=3' },
    { rank: 4, name: 'Leon S.', xp: 1980, userId: '4', avatar: 'https://i.pravatar.cc/100?u=4' },
    { rank: 5, name: demoUser.fullName, xp: 1850, userId: 'me', isMe: true },
    { rank: 6, name: 'Jordan D.', xp: 1720, userId: '6', isFriend: true, avatar: 'https://i.pravatar.cc/100?u=6' },
    { rank: 7, name: 'Sarah L.', xp: 1540, userId: '7', avatar: 'https://i.pravatar.cc/100?u=7' },
    { rank: 8, name: 'Chris W.', xp: 1200, userId: '8', avatar: 'https://i.pravatar.cc/100?u=8' },
  ]
}

export interface FriendFocusing {
  id: string
  name: string
  avatar: string
  minsLeft: number
}

export async function getFriendsFocusing(): Promise<FriendFocusing[]> {
  // Mock friends currently "in the room"
  return [
    { id: '2', name: 'Alex', avatar: 'https://i.pravatar.cc/100?u=2', minsLeft: 12 },
    { id: '3', name: 'Maya', avatar: 'https://i.pravatar.cc/100?u=3', minsLeft: 5 },
    { id: '6', name: 'Jordan', avatar: 'https://i.pravatar.cc/100?u=6', minsLeft: 22 },
  ]
}

// ─── Daily Goals ─────────────────────────────────────────────────────────────

export async function getDailyGoals(): Promise<DailyGoal[]> {
  const raw = await AsyncStorage.getItem(KEYS.dailyGoals)
  return raw ? JSON.parse(raw) : []
}

export async function saveDailyGoals(goals: DailyGoal[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.dailyGoals, JSON.stringify(goals))
  
  if (isSupabaseEnabled) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // In a real app, we'd sync individual rows. 
      // For this MVP, we'll upsert the whole set or just the new ones.
      // We'll perform a bulk upsert for all current goals.
      await supabase.from('daily_goals').upsert(
        goals.map(g => ({
          id: g.id,
          user_id: user.id,
          text: g.text,
          completed: g.completed,
          created_at: new Date(g.createdAt).toISOString()
        }))
      )
    }
  }
}

export async function addDailyGoal(text: string): Promise<DailyGoal[]> {
  const goals = await getDailyGoals()
  const newGoal: DailyGoal = {
    id: Math.random().toString(36).substr(2, 9),
    text,
    completed: false,
    createdAt: Date.now(),
  }
  const updated = [...goals, newGoal]
  await saveDailyGoals(updated)
  return updated
}

export async function toggleDailyGoal(id: string): Promise<DailyGoal[]> {
  const goals = await getDailyGoals()
  const updated = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
  await saveDailyGoals(updated)
  return updated
}

export async function deleteDailyGoal(id: string): Promise<DailyGoal[]> {
  const goals = await getDailyGoals()
  const updated = goals.filter(g => g.id !== id)
  await saveDailyGoals(updated)
  return updated
}

// ─── Active Session Persistence ───────────────────────────────────────────────

export async function saveActiveSession(session: ActiveSession | null): Promise<void> {
  if (session === null) {
    await AsyncStorage.removeItem(KEYS.activeSession)
  } else {
    await AsyncStorage.setItem(KEYS.activeSession, JSON.stringify(session))
  }
}

export async function getActiveSession(): Promise<ActiveSession | null> {
  const raw = await AsyncStorage.getItem(KEYS.activeSession)
  return raw ? JSON.parse(raw) : null
}

// ─── Analytics Helpers (Phase 5) ─────────────────────────────────────────────

export async function getBestFocusHour(): Promise<number> {
  if (isSupabaseEnabled) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          const { data: sessions } = await supabase
              .from('focus_sessions')
              .select('started_at')
              .eq('user_id', user.id)
          
          if (sessions && sessions.length > 0) {
              const hourCounts: Record<number, number> = {}
              sessions.forEach(s => {
                  if (s.started_at) {
                      const hour = new Date(s.started_at).getHours()
                      hourCounts[hour] = (hourCounts[hour] || 0) + 1
                  }
              })
              let bestHour = 9
              let maxCount = 0
              for (const [hourStr, count] of Object.entries(hourCounts)) {
                  if (count > maxCount) {
                      maxCount = count
                      bestHour = parseInt(hourStr)
                  }
              }
              return bestHour
          }
      }
  }
  return 9 // 9 AM fallback
}

export async function getWeeklyTrends() {
  const logs = await getDailyLogs(14)
  const thisWeek = logs.slice(7)
  const lastWeek = logs.slice(0, 7)
  
  const thisWeekMins = thisWeek.reduce((a, l) => a + l.focusMinutes, 0)
  const lastWeekMins = lastWeek.reduce((a, l) => a + l.focusMinutes, 0)
  
  const improvement = lastWeekMins === 0 
    ? (thisWeekMins > 0 ? 100 : 0)
    : Math.round(((thisWeekMins - lastWeekMins) / lastWeekMins) * 100)

  return {
    improvement,
    thisWeekMins,
    lastWeekMins,
  }
}

// ─── Demo Seeding (Phase 6) ──────────────────────────────────────────────────

export async function seedDemoData(): Promise<void> {
  const today = todayStr()
  const logs: Record<string, DailyLog> = {}
  
  // Create 14 days of realistic focus history
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    
    logs[ds] = {
      date: ds,
      focusMinutes: Math.floor(Math.random() * 120) + 60,
      sessionsCompleted: Math.floor(Math.random() * 4) + 1,
      distractionMinutes: Math.floor(Math.random() * 20) + 5,
      score: Math.floor(Math.random() * 20) + 75,
      avoidanceRate: 0.8 + Math.random() * 0.2,
    }
  }
  
  await saveAllLogs(logs)
  
  const profile: FocusProfile = {
      xp: 2450,
      level: 12,
      totalSessions: 42,
      totalFocusMinutes: 1840,
      longestStreak: 7
  }
  await saveProfile(profile)
  
  const streak: StreakData = {
      currentStreak: 7,
      lastSessionDate: today,
      freezeAvailable: true,
      lastFreezeDate: null,
      freezeUsed: false,
  }
  await AsyncStorage.setItem(KEYS.streak, JSON.stringify(streak))
}
