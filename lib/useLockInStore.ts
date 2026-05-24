import { create } from 'zustand'
import { supabase } from './supabase'
import { Session, User } from '@supabase/supabase-js'
import * as Sentry from '@sentry/react-native'

export interface UserProfile {
    id: string
    fullName: string
    email: string
    initials: string
    xp: number
    level: number
    streak: number
    longestStreak: number
    focusScore: number
    todayFocusMinutes: number
    dailyTargetMins: number
    distractionReduction: number
    planType: 'free' | 'premium'
}

export interface BehavioralStats {
    bestFocusHour: number
    yesterdayTotalMins: number
    weeklyAverageMins: number
    consistencyScore: number // 0-100
    topCategory: string
}

export interface ActiveSession {
    id: string
    state: 'idle' | 'selecting' | 'active' | 'paused' | 'completed'
    startedAt: number
    durationMs: number
    elapsedMs: number
    blockedApps: string[]
    distractions: number
    isStrict: boolean
}

export interface DailyGoal {
    id: string
    user_id: string
    text: string
    completed: boolean
    created_at: string
}

interface LockInState {
    // Auth
    session: Session | null
    user: User | null
    profile: UserProfile | null
    behavioralStats: BehavioralStats | null
    goals: DailyGoal[]
    isLoading: boolean

    // Getters
    getLevelInfo: () => { name: string, nextLevelXp: number, progress: number }

    // Session
    activeSession: ActiveSession | null
    
    // Actions
    setSession: (session: Session | null) => void
    fetchProfile: (userId: string) => Promise<void>
    fetchBehavioralStats: (userId: string) => Promise<void>
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>
    getMotivationMessage: () => string
    
    // Analytics
    fetchWeeklyTrends: () => Promise<{data: number[], total: number, average: number}>
    fetchDailyLogs: (days?: number) => Promise<any[]>
    fetchBestHour: (userId: string) => Promise<number>
    
    // Goal Actions
    fetchGoals: () => Promise<void>
    addGoal: (text: string) => Promise<void>
    toggleGoal: (id: string) => Promise<void>
    deleteGoal: (id: string) => Promise<void>
    
    // Session Actions
    startSession: (durationMs: number, blockedApps: string[], isStrict: boolean) => void
    updateSession: (updates: Partial<ActiveSession>) => void
    completeSession: () => Promise<void>
    cancelSession: () => void
}

export const useLockInStore = create<LockInState>((set, get) => ({
    session: null,
    user: null,
    profile: null,
    behavioralStats: null,
    goals: [],
    isLoading: true,
    activeSession: null,

    getLevelInfo: () => {
        const xp = get().profile?.xp || 0
        const level = Math.floor(Math.sqrt(xp / 100)) + 1
        const currentLevelXp = Math.pow(level - 1, 2) * 100
        const nextLevelXp = Math.pow(level, 2) * 100
        const progress = (xp - currentLevelXp) / (nextLevelXp - currentLevelXp)
        
        const ranks = ['Beginner', 'Novice', 'Focused', 'Elite', 'Master', 'Monk Mode']
        const rankIndex = Math.min(Math.floor((level - 1) / 5), ranks.length - 1)
        
        return {
            name: ranks[rankIndex],
            nextLevelXp,
            progress: Math.max(0, Math.min(1, progress))
        }
    },

    setSession: (session) => {
        set({ session, user: session?.user ?? null, isLoading: false })
        if (session?.user) {
            get().fetchProfile(session.user.id)
            get().fetchBehavioralStats(session.user.id)
            get().fetchGoals()
        } else {
            set({ profile: null, behavioralStats: null })
        }
    },

    fetchProfile: async (userId) => {
        try {
            Sentry.addBreadcrumb({ category: 'auth', message: `Fetching profile for ${userId}`, level: 'info' })
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error) throw error
            if (data) {
                set({
                    profile: {
                        id: data.id,
                        fullName: data.full_name || 'Explorer',
                        email: data.email || '',
                        initials: (data.full_name || 'E').split(' ').map((n: string) => n[0]).join('').toUpperCase(),
                        xp: data.xp || 0,
                        level: data.level || 1,
                        streak: data.streak || 0,
                        longestStreak: data.longest_streak || 0,
                        focusScore: data.focus_score || 0,
                        todayFocusMinutes: 0, 
                        dailyTargetMins: data.daily_target_mins || 60,
                        distractionReduction: data.distraction_reduction || 0,
                        planType: data.plan_type || 'free',
                    }
                })
            }
        } catch (error) {
            Sentry.captureException(error)
        }
    },

    fetchBehavioralStats: async (userId) => {
        // Fetch last 7 days of sessions
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { data: sessions } = await supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', userId)
            .gte('started_at', sevenDaysAgo.toISOString())
            .eq('completed', true)

        if (!sessions) return

        // Compute Yesterday's total
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0,0,0,0)
        const dayBeforeYesterday = new Date(yesterday)
        dayBeforeYesterday.setDate(yesterday.getDate() - 1)

        const yesterdaySessions = sessions.filter(s => {
            const date = new Date(s.started_at)
            return date >= yesterday && date < new Date()
        })
        const yesterdayTotal = yesterdaySessions.reduce((acc, s) => acc + (s.duration_ms || 0), 0) / 60000

        // Compute Best Hour
        const hourCounts: Record<number, number> = {}
        sessions.forEach(s => {
            const hour = new Date(s.started_at).getHours()
            hourCounts[hour] = (hourCounts[hour] || 0) + 1
        })
        const bestHour = Object.entries(hourCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 9

        set({
            behavioralStats: {
                bestFocusHour: Number(bestHour),
                yesterdayTotalMins: Math.round(yesterdayTotal),
                weeklyAverageMins: Math.round((sessions.reduce((acc, s) => acc + (s.duration_ms || 0), 0) / 60000) / 7),
                consistencyScore: 85,
                topCategory: 'Deep Work'
            }
        })
    },

    fetchWeeklyTrends: async () => {
        const user = get().user
        if (!user) return { data: [], total: 0, average: 0 }
        
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { data: sessions } = await supabase
            .from('focus_sessions')
            .select('duration_ms, started_at')
            .eq('user_id', user.id)
            .gte('started_at', sevenDaysAgo.toISOString())
            .eq('completed', true)
        
        const dailyMins: Record<string, number> = {}
        for (let i = 0; i < 7; i++) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            dailyMins[d.toISOString().split('T')[0]] = 0
        }

        sessions?.forEach(s => {
            const day = new Date(s.started_at).toISOString().split('T')[0]
            if (dailyMins[day] !== undefined) {
                dailyMins[day] += (s.duration_ms / 60000)
            }
        })

        const sorted = Object.entries(dailyMins)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(e => Math.round(e[1]))
        
        return {
            data: sorted,
            total: sorted.reduce((a, b) => a + b, 0),
            average: Math.round(sorted.reduce((a, b) => a + b, 0) / 7)
        }
    },

    fetchDailyLogs: async (days = 7) => {
        const user = get().user
        if (!user) return []
        
        const { data } = await supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('started_at', { ascending: false })
            .limit(days * 10) // Approx
        
        return data || []
    },

    fetchBestHour: async (userId) => {
        const { data } = await supabase
            .from('focus_sessions')
            .select('started_at')
            .eq('user_id', userId)
            .limit(100)
        
        if (!data || data.length === 0) return 9
        
        const hourCounts: Record<number, number> = {}
        data.forEach(s => {
            const hour = new Date(s.started_at).getHours()
            hourCounts[hour] = (hourCounts[hour] || 0) + 1
        })
        
        return Number(Object.entries(hourCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 9)
    },

    getMotivationMessage: () => {
        const { profile, behavioralStats } = get()
        if (!profile || !behavioralStats) return "Ready for a deep dive?"

        const diff = profile.todayFocusMinutes - behavioralStats.yesterdayTotalMins
        if (diff < 0) return `${Math.abs(diff)} mins away from beating yesterday.`
        if (diff > 0) return `You've already beaten yesterday by ${diff} mins! 🔥`
        return "You're matching yesterday's pace. Push further!"
    },

    fetchGoals: async () => {
        const user = get().user
        if (!user) return
        const { data, error } = await supabase
            .from('daily_goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        
        if (data) set({ goals: data })
    },

    addGoal: async (text) => {
        const user = get().user
        if (!user) return
        const { data, error } = await supabase
            .from('daily_goals')
            .insert({ user_id: user.id, text, completed: false })
            .select()
            .single()
        
        if (data) set({ goals: [data, ...get().goals] })
    },

    toggleGoal: async (id) => {
        const goal = get().goals.find(g => g.id === id)
        if (!goal) return
        const { error } = await supabase
            .from('daily_goals')
            .update({ completed: !goal.completed })
            .eq('id', id)
        
        if (!error) {
            set({ goals: get().goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g) })
        }
    },

    deleteGoal: async (id) => {
        const { error } = await supabase.from('daily_goals').delete().eq('id', id)
        if (!error) {
            set({ goals: get().goals.filter(g => g.id !== id) })
        }
    },

    updateProfile: async (updates) => {
        const { user, profile } = get()
        if (!user || !profile) return

        const newProfile = { ...profile, ...updates }
        set({ profile: newProfile })

        // Sync to Supabase in background
        const supabaseUpdates: any = {}
        if (updates.xp !== undefined) supabaseUpdates.xp = updates.xp
        if (updates.level !== undefined) supabaseUpdates.level = updates.level
        if (updates.streak !== undefined) supabaseUpdates.streak = updates.streak
        
        await supabase
            .from('profiles')
            .update(supabaseUpdates)
            .eq('id', user.id)
    },

    startSession: (durationMs, blockedApps, isStrict) => {
        Sentry.addBreadcrumb({ category: 'session', message: 'Starting focus session', data: { durationMs, isStrict } })
        set({
            activeSession: {
                id: Math.random().toString(36).substring(7),
                state: 'active',
                startedAt: Date.now(),
                durationMs,
                elapsedMs: 0,
                blockedApps,
                distractions: 0,
                isStrict
            }
        })
    },

    updateSession: (updates) => {
        const current = get().activeSession
        if (current) {
            set({ activeSession: { ...current, ...updates } })
        }
    },

    completeSession: async () => {
        const session = get().activeSession
        const user = get().user
        if (!session || !user) return

        try {
            Sentry.addBreadcrumb({ category: 'session', message: 'Completing session', data: { distractions: session.distractions } })
            const durationMins = Math.floor(session.durationMs / 60000)
            const xpGained = durationMins * 2

            // 1. Log Session to Supabase
            const { error: sessionErr } = await supabase.from('focus_sessions').insert({
                user_id: user.id,
                duration_ms: session.durationMs,
                distractions: session.distractions,
                xp_gained: xpGained,
                completed: true,
                category: 'Deep Work'
            })
            if (sessionErr) throw sessionErr

            // 2. Update Profile XP & Streak
            const currentXP = get().profile?.xp || 0
            const currentStreak = get().profile?.streak || 0
            
            await get().updateProfile({
                xp: currentXP + xpGained,
                streak: currentStreak + 1,
            })

            set({ activeSession: null })
        } catch (error) {
            Sentry.captureException(error)
        }
    },

    cancelSession: () => {
        set({ activeSession: null })
    }
}))
