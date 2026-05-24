import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  AppState,
  Dimensions
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  useSharedValue,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated'

import { Text } from '@/components/ui/Text'
import XPRewardPopup, { XPRewardPopupRef } from '@/components/focus/XPRewardPopup'
import FocusOverlay from '@/components/focus/FocusOverlay'
import CircularTimer from '@/components/focus/CircularTimer'
import { track } from '@/lib/analytics'
import {
  ACCENT,
  BG,
  SURFACE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  SPACING_MD,
  SPACING_LG,
} from '@/lib/theme'
import { useLockInStore } from '@/lib/useLockInStore'

const { width: SW } = Dimensions.get('window')
const AnimatedView = Animated.createAnimatedComponent(View)

// ─── Constants ───────────────────────────────────────────────────────────────

const DURATIONS = [
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '60m', seconds: 60 * 60 },
]

const DISTRACTING_APPS = [
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { id: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
  { id: 'x', label: 'X (Twitter)', icon: 'logo-twitter' },
  { id: 'reddit', label: 'Reddit', icon: 'logo-reddit' },
]

export default function FocusScreen() {
  const insets = useSafeAreaInsets()
  const xpPopupRef = useRef<XPRewardPopupRef>(null)
  
  // Store
  const { 
    profile, 
    activeSession, 
    startSession, 
    updateSession, 
    completeSession, 
    cancelSession 
  } = useLockInStore()

  // Local Selection State
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(0)
  const [blockedApps, setBlockedApps] = useState<string[]>([])
  const [strictMode, setStrictMode] = useState(false)
  const [tasks, setTasks] = useState<string[]>([])
  
  // Internal Timer State
  const [timeLeft, setTimeLeft] = useState(DURATIONS[0].seconds)
  const isSessionActive = activeSession?.state === 'active'

  // -- Animations --
  const breathingScale = useSharedValue(1)
  useEffect(() => {
    if (isSessionActive) {
      breathingScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 3000 }),
          withTiming(1, { duration: 3000 })
        ),
        -1,
        true
      )
    } else {
      breathingScale.value = withTiming(1)
    }
  }, [isSessionActive])

  const animatedBreathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value }]
  }))

  const [quote, setQuote] = useState("Focus is the art of saying no to everything else.")
  useEffect(() => {
    const QUOTES = [
      "Focus is the art of saying no to everything else.",
      "Concentrate all thoughts upon the work at hand.",
      "The successful warrior is the average man, with laser-like focus.",
      "Strive for progress, not perfection.",
      "Focus is a matter of deciding what you’re NOT going to do."
    ]
    if (!isSessionActive) {
      setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
    }
  }, [isSessionActive])

  // -- App State Monitoring --
  useEffect(() => {
    if (!activeSession || activeSession.state !== 'active') return

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background') {
        updateSession({ distractions: activeSession.distractions + 1 })
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      }
      if (nextAppState === 'active') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        if (activeSession.isStrict) {
          Alert.alert("LOCKIN ALERT", "You left the app during a strict session. XP penalty applied.")
        }
      }
    })
    return () => subscription.remove()
  }, [activeSession?.state, activeSession?.isStrict])

  // -- Timer sync --
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
      if (isSessionActive && activeSession) {
          const total = activeSession.durationMs / 1000
          const elapsed = (Date.now() - activeSession.startedAt) / 1000
          const remaining = Math.max(0, total - elapsed)
          setTimeLeft(Math.floor(remaining))
          
          if (intervalRef.current) clearInterval(intervalRef.current)
          const start = Date.now() - (elapsed * 1000)

          intervalRef.current = setInterval(() => {
            const nowElapsed = Date.now() - start
            const nowRemaining = Math.max(0, (total * 1000) - nowElapsed)
            setTimeLeft(Math.floor(nowRemaining / 1000))

            if (nowRemaining <= 0) {
              clearInterval(intervalRef.current!)
              handleComplete()
            }
          }, 250)
      } else {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setTimeLeft(DURATIONS[selectedDurationIndex].seconds)
      }
  }, [isSessionActive])

  const handleStart = () => {
    const durMs = DURATIONS[selectedDurationIndex].seconds * 1000
    startSession(durMs, blockedApps, strictMode)
    track('focus_session_started', { duration_sec: durMs / 1000, strict: strictMode })
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const handleComplete = async () => {
    const durSec = activeSession?.durationMs ? activeSession.durationMs / 1000 : 0
    await completeSession()
    track('focus_session_completed', { duration_sec: durSec, strict: strictMode })
    xpPopupRef.current?.show(Math.floor(durSec / 60 * 2))
  }

  const handleStop = () => {
    if (strictMode) {
        Alert.alert("Abandon Session?", "Strict Mode is active. Abandoning now will cost you 10 XP.", [
            { text: "Stay", style: "cancel" },
            { text: "Abandon", style: "destructive", onPress: cancelSession }
        ])
    } else {
        cancelSession()
    }
  }

  const progress = isSessionActive ? timeLeft / (activeSession!.durationMs / 1000) : 1

  // -- Setup View --
  if (!isSessionActive) {
    return (
      <View style={[styles.root, { backgroundColor: BG }]}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACING_MD }]} showsVerticalScrollIndicator={false}>
          <AnimatedView entering={FadeInDown.delay(100)} style={styles.headerRow}>
            <View>
                <Text style={styles.title}>Depth Flow</Text>
                <Text style={styles.subtitle}>Select your defense layers.</Text>
            </View>
            <View style={styles.streakBadge}>
                <Ionicons name="flame" size={16} color={ACCENT} />
                <Text style={styles.streakValue}>{profile?.streak ?? 0}</Text>
            </View>
          </AnimatedView>

          <SectionLabel label="FOCUS DURATION" />
          <View style={styles.durationGrid}>
            {DURATIONS.map((d, i) => (
              <Pressable 
                key={i} 
                style={[styles.durationCard, selectedDurationIndex === i && styles.cardActive]} 
                onPress={() => setSelectedDurationIndex(i)}
              >
                <Text style={[styles.durationLabel, selectedDurationIndex === i && styles.textActive]}>{d.label}</Text>
              </Pressable>
            ))}
          </View>

          <SectionLabel label="DISTRACTION DEFENSE" />
          <View style={styles.appGrid}>
            {DISTRACTING_APPS.map(app => (
              <Pressable 
                key={app.id} 
                style={[styles.appItem, blockedApps.includes(app.id) && styles.cardActive]} 
                onPress={() => setBlockedApps(prev => prev.includes(app.id) ? prev.filter(x => x !== app.id) : [...prev, app.id])}
              >
                <Ionicons name={app.icon as any} size={22} color={blockedApps.includes(app.id) ? ACCENT : TEXT_TERTIARY} />
                <Text style={[styles.appLabel, blockedApps.includes(app.id) && styles.textActive]}>{app.label}</Text>
              </Pressable>
            ))}
          </View>

          <SectionLabel label="ENFORCEMENT" />
          <Pressable 
            style={[styles.strictToggle, strictMode && styles.strictActive]} 
            onPress={() => setStrictMode(!strictMode)}
          >
            <View style={styles.strictInfo}>
                <Ionicons name={strictMode ? "lock-closed" : "lock-open-outline"} size={20} color={strictMode ? "#fff" : TEXT_SECONDARY} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.strictTitle, strictMode && { color: '#fff' }]}>STRICT LOCKIN {strictMode ? 'ACTIVE' : 'OFF'}</Text>
                    <Text style={[styles.strictSub, strictMode && { color: 'rgba(255,255,255,0.7)' }]}>
                        {strictMode ? "Abandonment costs 10 XP. App-leave is penalized." : "No penalties for stopping early."}
                    </Text>
                </View>
            </View>
          </Pressable>

          <SectionLabel label="TODAY'S INTENTION" />
          <View style={styles.tasksBox}>
            <View style={styles.addTaskRow}>
                <Ionicons name="list" size={18} color={TEXT_TERTIARY} />
                <Text style={styles.taskQuote}>"{quote}"</Text>
            </View>
            <Pressable 
                style={styles.addTaskBtn} 
                onPress={() => {
                   Alert.prompt("Focus Goal", "What is your primary intention?", (t) => t && setTasks([t]))
                }}
            >
                <Ionicons name="add" size={18} color={ACCENT} />
                <Text style={styles.addTaskText}>{tasks.length > 0 ? tasks[0] : "Add a specific goal"}</Text>
            </Pressable>
          </View>

          <AnimatedView entering={FadeInUp.delay(400)} style={styles.footer}>
            <Pressable onPress={handleStart} style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.9 }]}>
                <LinearGradient colors={[ACCENT, '#B45309']} style={styles.startGradient}>
                    <Text style={styles.startText}>ENTER FLOW STATE</Text>
                    <Ionicons name="sparkles" size={16} color="#fff" style={{ marginLeft: 8 }} />
                </LinearGradient>
            </Pressable>
          </AnimatedView>
        </ScrollView>
      </View>
    )
  }

  // -- Immersive Active View --
  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <FocusOverlay visible={isSessionActive} isStrict={activeSession?.isStrict} />
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={[styles.timerContainer, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        <XPRewardPopup ref={xpPopupRef} />
        
        <AnimatedView entering={FadeInDown} style={styles.immersiveContent}>
            <Animated.View style={[styles.timerWrapper, animatedBreathingStyle]}>
                <View style={styles.timerGlow} />
                <CircularTimer 
                    progress={progress} 
                    timeLeft={timeLeft} 
                    totalSeconds={activeSession?.durationMs / 1000} 
                    isRunning={true} 
                    size={Math.min(SW * 0.85, 340)}
                />
            </Animated.View>

            <View style={styles.activeInfoMinimal}>
                <Text style={styles.lockinTitleMinimal}>DEPTH FLOW</Text>
                <Text style={styles.lockinSubMinimal}>{tasks.length > 0 ? tasks[0] : "You're in the zone. Keep the shield up."}</Text>
            </View>

            <Pressable style={styles.stopBtnMinimal} onPress={handleStop}>
                <Text style={styles.stopBtnTextMinimal}>ABANDON SESSION</Text>
            </Pressable>
        </AnimatedView>
      </View>
    </View>
  )
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: SPACING_LG, paddingBottom: 60, gap: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: -1 },
  subtitle: { fontSize: 14, color: TEXT_SECONDARY, marginTop: 4 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: SURFACE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  streakValue: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 1.2, marginTop: 4, textTransform: 'uppercase' },
  durationGrid: { flexDirection: 'row', gap: 12 },
  durationCard: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: SURFACE, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  durationLabel: { fontSize: 15, fontWeight: '700', color: TEXT_SECONDARY },
  appGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING_MD },
  appItem: { width: (SW - (SPACING_LG * 2) - SPACING_MD) / 2, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: SURFACE, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  appLabel: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY },
  cardActive: { borderColor: ACCENT, backgroundColor: 'rgba(245,158,11,0.05)' },
  textActive: { color: ACCENT },
  strictToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 24, backgroundColor: SURFACE, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  strictActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  strictInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  strictTitle: { fontSize: 13, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: 1 },
  strictSub: { fontSize: 11, fontWeight: '600', color: TEXT_TERTIARY, marginTop: 2 },
  tasksBox: { backgroundColor: SURFACE, borderRadius: 24, padding: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  addTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  taskQuote: { fontSize: 13, color: TEXT_TERTIARY, fontStyle: 'italic', flex: 1 },
  addTaskBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  addTaskText: { fontSize: 14, color: ACCENT, fontWeight: '700' },
  footer: { marginTop: 20, alignItems: 'center' },
  startBtn: { width: '100%', borderRadius: 24, overflow: 'hidden' },
  startGradient: { paddingVertical: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  startText: { fontSize: 16, fontWeight: '900', color: '#000', letterSpacing: 1 },
  timerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  immersiveContent: { alignItems: 'center', gap: 40 },
  timerWrapper: { justifyContent: 'center', alignItems: 'center' },
  timerGlow: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: ACCENT, opacity: 0.1, shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 50 },
  activeInfoMinimal: { alignItems: 'center', gap: 12 },
  lockinTitleMinimal: { fontSize: 24, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: 6 },
  lockinSubMinimal: { fontSize: 14, color: TEXT_SECONDARY, opacity: 0.7, textAlign: 'center', maxWidth: '80%', lineHeight: 22 },
  stopBtnMinimal: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  stopBtnTextMinimal: { color: TEXT_TERTIARY, fontWeight: '800', fontSize: 11, letterSpacing: 2 },
})
