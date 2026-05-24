import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { safePlaySound, stopAndUnload } from '@/lib/audioManager'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
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
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { useLockInStore } from '@/lib/useLockInStore'
import {
} from '@/lib/focusStore'
import AnalyticsBoard from '@/components/analytics/AnalyticsBoard'
import GoalEditor from '@/components/settings/GoalEditor'
import { FOCUS_TRACKS, FocusTrack } from '@/lib/audio'
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, G, Path } from 'react-native-svg'

const AnimatedView = Animated.createAnimatedComponent(View)
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { 
    profile, 
    behavioralStats, 
    goals,
    getMotivationMessage, 
    getLevelInfo,
    addGoal,
    toggleGoal,
    deleteGoal,
    fetchDailyLogs,
    fetchWeeklyTrends
  } = useLockInStore()
  const [refreshing, setRefreshing] = useState(false)
  const [dailyLogs, setDailyLogs] = useState<any[]>([])
  const [weeklyTrends, setWeeklyTrends] = useState<{data: number[], total: number, average: number} | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<FocusTrack | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const soundRef = useRef<any>(null)

  const load = useCallback(async () => {
    const [logs, trends] = await Promise.all([
      fetchDailyLogs(7),
      fetchWeeklyTrends(),
    ])
    setDailyLogs(logs)
    setWeeklyTrends(trends)
  }, [])

  // Audio Logic
  const togglePlayback = async (track: FocusTrack) => {
    try {
      if (selectedTrack?.id === track.id) {
        if (isPlaying) {
          await soundRef.current?.pauseAsync()
          setIsPlaying(false)
        } else {
          await soundRef.current?.playAsync()
          setIsPlaying(true)
        }
        return
      }

      // New track
      setIsLoadingAudio(true)
      if (soundRef.current) {
        await stopAndUnload(soundRef.current)
      }

      const sound = await safePlaySound(track.url, (loading) => setIsLoadingAudio(loading))
      if (sound) {
          soundRef.current = sound
          setSelectedTrack(track)
          setIsPlaying(true)
      }
    } catch (error) {
      console.warn('Audio playback toggle failed', error)
      setIsLoadingAudio(false)
    }
  }

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync()
      }
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['profile'] })
    await load()
    setRefreshing(false)
  }

  const handleStart = () => {
    router.push('/(tabs)/focus')
  }

  const greeting = (() => {
    const h = new Date().getHours()
    const name = profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''
    if (h < 5) return `Eyes on the Prize${name}`
    if (h < 12) return `Good Morning${name}`
    if (h < 17) return `Good Afternoon${name}`
    return `Good Evening${name}`
  })()

  const motivation = getMotivationMessage()
  const levelInfo = getLevelInfo()

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + SPACING_LG, paddingBottom: TAB_BAR_CLEARANCE + SPACING_LG },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
        showsVerticalScrollIndicator={false}
      >
        {!profile && (
          <AnimatedView entering={FadeInDown.delay(50)}>
            <LinearGradient
              colors={[ACCENT, '#B45309']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.guestBanner}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.guestTitle}>Elite Synchronicity</Text>
                <Text style={styles.guestSub}>Sync your focus sessions across all devices.</Text>
              </View>
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                style={styles.guestBtn}
              >
                <Text style={styles.guestBtnText}>UPGRADE</Text>
              </Pressable>
            </LinearGradient>
          </AnimatedView>
        )}

        {/* Header */}
        <AnimatedView entering={FadeInDown.delay(100)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, {(profile?.fullName ?? 'Legend').split(' ')[0]}</Text>
            <Text style={styles.subhead}>Ready for high-fidelity focus?</Text>
          </View>
          <Pressable onPress={() => router.push('/profile')} style={styles.profileIcon}>
            <Ionicons name="person-circle-outline" size={36} color={TEXT_SECONDARY} />
          </Pressable>
        </AnimatedView>

        {/* Level Progression */}
        <AnimatedView entering={FadeInDown.delay(150)} style={styles.levelCard}>
            <View style={styles.levelHeader}>
                <Text style={styles.rankText}>{levelInfo.name}</Text>
                <Text style={styles.levelText}>Lv. {profile?.level ?? 1}</Text>
            </View>
            <View style={styles.progressBarBg}>
                <AnimatedView 
                    style={[styles.progressBarFill, { width: `${levelInfo.progress * 100}%` }]} 
                />
            </View>
            <Text style={styles.xpNext}>Next level at {levelInfo.nextLevelXp} XP</Text>
        </AnimatedView>

        {/* Hero Momentum */}
        <AnimatedView entering={FadeInDown.delay(200)}>
          <Pressable onPress={handleStart} style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.9 }]}>
            <LinearGradient
              colors={['#171717', '#080808']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              <View style={styles.momentumLabel}>
                <Ionicons name="flame" size={16} color={ACCENT} />
                <Text style={styles.momentumText}>COMMAND CENTER</Text>
              </View>
              <Text style={styles.heroTitle}>START LOCKIN SESSION</Text>
              <Text style={styles.heroSub}>{profile?.todayFocusMinutes ?? 0}m Focused · {profile?.streak ?? 0} Day Streak</Text>
              
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroMiniBadge}>
                    <Ionicons name="sparkles" size={12} color={ACCENT} />
                    <Text style={styles.heroMiniBadgeText}>{motivation}</Text>
                </View>
              </View>
            </View>
            <View style={styles.heroGlow} />
          </Pressable>
        </AnimatedView>

        {/* Daily Goals */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Goals</Text>
        </View>

        <AnimatedView entering={FadeInUp.delay(300)} style={styles.goalBox}>
            {goals.map((g) => (
                <AnimatedPressable 
                    key={g.id} 
                    layout={Layout.springify()}
                    entering={FadeInDown}
                    style={[styles.goalItem, g.completed && styles.goalCompleted]}
                    onPress={async () => {
                        await toggleGoal(g.id)
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }}
                >
                    <Ionicons 
                        name={g.completed ? "checkmark-circle" : "ellipse-outline"} 
                        size={20} 
                        color={g.completed ? "#10b981" : ACCENT} 
                    />
                    <Text style={[styles.goalText, g.completed && styles.goalTextDone]}>{g.text}</Text>
                    <Pressable onPress={async () => {
                        await deleteGoal(g.id)
                    }}>
                        <Ionicons name="trash-outline" size={16} color={TEXT_TERTIARY} />
                    </Pressable>
                </AnimatedPressable>
            ))}
            
            <Pressable 
                style={styles.addGoalBtn}
                onPress={() => {
                    setIsModalVisible(true)
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                }}
            >
                <Ionicons name="add" size={20} color={ACCENT} />
                <Text style={styles.addGoalText}>Add New Goal</Text>
            </Pressable>
        </AnimatedView>

        {/* Ambient Focus */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ambient Focus</Text>
        </View>

        <AnimatedView entering={FadeInUp.delay(400)} style={styles.musicCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.musicScroll}>
                {FOCUS_TRACKS.map((track) => (
                    <Pressable 
                        key={track.id} 
                        style={[styles.trackBtn, selectedTrack?.id === track.id && styles.trackActive]}
                        onPress={() => {
                            togglePlayback(track)
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                        }}
                    >
                        {isLoadingAudio && selectedTrack?.id === track.id ? (
                          <ActivityIndicator size="small" color="#000" />
                        ) : (
                          <Ionicons 
                              name={selectedTrack?.id === track.id && isPlaying ? "pause" : (track.type === 'lofi' ? 'musical-note' : 'water')} 
                              size={18} 
                              color={selectedTrack?.id === track.id ? '#000' : ACCENT} 
                          />
                        )}
                        <Text style={[styles.trackName, selectedTrack?.id === track.id && styles.trackNameActive]}>
                            {track.title}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
            {selectedTrack && (
                <View style={styles.playerBar}>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playingLabel}>PLAYING:</Text>
                      <Text style={styles.playingTitle}>{selectedTrack.title} / {selectedTrack.artist}</Text>
                    </View>
                    <Ionicons 
                      name={isPlaying ? "volume-medium" : "volume-mute"} 
                      size={18} 
                      color={ACCENT} 
                      style={{ opacity: isPlaying ? 1 : 0.4 }}
                    />
                </View>
            )}
        </AnimatedView>

        {/* Insights */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Insights</Text>
        </View>

        <View style={styles.insightGrid}>
            <AnimatedView entering={FadeInUp.delay(500)} style={styles.insightCard}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(245,158,11,0.05)' }]}>
                    <Ionicons name="shield-checkmark" size={20} color={ACCENT} />
                </View>
                <Text style={styles.insightValue}>{profile?.focusScore ?? 0}%</Text>
                <Text style={styles.insightLabel}>Deep Work Score</Text>
            </AnimatedView>

            <AnimatedView entering={FadeInUp.delay(600)} style={styles.insightCard}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(16,185,129,0.05)' }]}>
                    <Ionicons name="trending-up" size={20} color="#10b981" />
                </View>
                <Text style={styles.insightValue}>{profile?.distractionReduction ?? 0}%</Text>
                <Text style={styles.insightLabel}>Distraction Defeat</Text>
            </AnimatedView>
        </View>

        {/* Daily Momentum */}
        <AnimatedView entering={FadeInUp.delay(550)}>
            {weeklyTrends && (
                <AnalyticsBoard 
                    weeklyData={weeklyTrends.data}
                    bestHour={behavioralStats?.bestFocusHour ?? 9}
                    totalMinutes={weeklyTrends.total}
                />
            )}
        </AnimatedView>

        <AnimatedView entering={FadeInUp.delay(650)} style={{ marginTop: 24 }}>
            <GoalEditor />
        </AnimatedView>
      </ScrollView>

      {/* Goal Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsModalVisible(false)} />
          <AnimatedView entering={FadeInUp} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Intention</Text>
            <Text style={styles.modalSub}>What is your primary focus for this block?</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Finish Logo Redesign"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={newGoal}
              onChangeText={setNewGoal}
              autoFocus
              maxLength={40}
            />

            <View style={styles.modalButtons}>
              <Pressable 
                style={styles.cancelBtn} 
                onPress={() => {
                  setIsModalVisible(false)
                  setNewGoal('')
                }}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </Pressable>

              <Pressable 
                style={[styles.confirmBtn, !newGoal.trim() && { opacity: 0.5 }]} 
                disabled={!newGoal.trim()}
                onPress={async () => {
                  await addGoal(newGoal.trim())
                  setNewGoal('')
                  setIsModalVisible(false)
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                }}
              >
                <Text style={styles.confirmBtnText}>LOCK IN</Text>
              </Pressable>
            </View>
          </AnimatedView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

function MomentumChart({ data }: { data: number[] }) {
    const width = 120
    const height = 60
    const padding = 5
    const points = data.map((val, i) => ({
        x: (i / (data.length - 1)) * (width - padding * 2) + padding,
        y: height - (val / Math.max(...data)) * (height - padding * 2) - padding
    }))

    const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`

    return (
        <Svg width={width} height={height}>
            <Path
                d={d}
                fill="none"
                stroke={ACCENT}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.6}
            />
        </Svg>
    )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING_LG,
    gap: SPACING_LG,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  subhead: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  profileIcon: {
      opacity: 0.8,
  },
  heroCard: {
    padding: 28,
    borderRadius: 28,
    minHeight: 200,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
  },
  levelCard: {
      backgroundColor: SURFACE,
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.03)',
  },
  levelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  rankText: {
      fontSize: 14,
      fontWeight: '900',
      color: ACCENT,
      letterSpacing: 1,
      textTransform: 'uppercase',
  },
  levelText: {
      fontSize: 12,
      fontWeight: '700',
      color: TEXT_SECONDARY,
  },
  progressBarBg: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 3,
      overflow: 'hidden',
  },
  progressBarFill: {
      height: '100%',
      backgroundColor: ACCENT,
      borderRadius: 3,
  },
  xpNext: {
      fontSize: 10,
      color: TEXT_TERTIARY,
      marginTop: 8,
      fontWeight: '600',
  },
  heroContent: {
      flex: 1,
      zIndex: 1,
  },
  momentumLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16,
  },
  momentumText: {
      fontSize: 10,
      fontWeight: '900',
      color: ACCENT,
      letterSpacing: 2,
  },
  heroTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: TEXT_PRIMARY,
      letterSpacing: -1,
      marginBottom: 8,
  },
  heroSub: {
      fontSize: 14,
      color: TEXT_SECONDARY,
      marginBottom: 16,
      fontWeight: '600',
  },
  heroBadgeRow: {
      flexDirection: 'row',
      gap: 8,
  },
  heroMiniBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(245,158,11,0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 100,
  },
  heroMiniBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: ACCENT,
  },
  heroGlow: {
      position: 'absolute',
      right: -50,
      top: -50,
      width: 200,
      height: 200,
      backgroundColor: ACCENT,
      opacity: 0.05,
      borderRadius: 100,
  },
  sectionHeader: {
      marginTop: 8,
  },
  sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: TEXT_TERTIARY,
      letterSpacing: 1,
      textTransform: 'uppercase',
  },
  insightGrid: {
      flexDirection: 'row',
      gap: SPACING_MD,
  },
  insightCard: {
      flex: 1,
      backgroundColor: SURFACE,
      padding: 16,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.02)',
  },
  iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
  },
  insightValue: {
      fontSize: 22,
      fontWeight: '900',
      color: TEXT_PRIMARY,
      marginBottom: 2,
  },
  insightLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: TEXT_TERTIARY,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
  },
  goalBox: {
      gap: 12,
  },
  goalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: SURFACE,
      padding: 16,
      borderRadius: 20,
      gap: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.03)',
  },
  goalCompleted: {
      opacity: 0.6,
      backgroundColor: 'rgba(16,185,129,0.05)',
  },
  goalText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: TEXT_PRIMARY,
  },
  goalTextDone: {
      textDecorationLine: 'line-through',
      color: TEXT_TERTIARY,
  },
  addGoalBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: 'rgba(245,158,11,0.3)',
      backgroundColor: 'rgba(245,158,11,0.02)',
  },
  addGoalText: {
      fontSize: 14,
      fontWeight: '700',
      color: ACCENT,
  },
  musicCard: {
      backgroundColor: SURFACE,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.02)',
  },
  musicScroll: {
      gap: 10,
  },
  trackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: 'rgba(245,158,11,0.05)',
      gap: 8,
  },
  trackActive: {
      backgroundColor: ACCENT,
  },
  trackName: {
      fontSize: 13,
      fontWeight: '700',
      color: ACCENT,
  },
  trackNameActive: {
      color: '#000',
  },
  momentumCard: {
      backgroundColor: SURFACE,
      padding: 20,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.02)',
  },
  momentumHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
  },
  momentumCardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: TEXT_PRIMARY,
  },
  momentumCardSub: {
      fontSize: 12,
      color: TEXT_SECONDARY,
      marginTop: 2,
  },
  streakBadge: {
      backgroundColor: ACCENT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
  },
  streakVal: {
      fontSize: 12,
      fontWeight: '900',
      color: '#000',
  },
  momentumChartWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  momentumStats: {
      alignItems: 'flex-end',
  },
  momentumStatVal: {
      fontSize: 18,
      fontWeight: '900',
      color: ACCENT,
      letterSpacing: 1,
  },
  momentumStatLabel: {
      fontSize: 8,
      fontWeight: '900',
      color: TEXT_TERTIARY,
      letterSpacing: 0.5,
  },
  playerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.05)',
      gap: 8,
  },
  playingLabel: {
      fontSize: 9,
      fontWeight: '900',
      color: TEXT_TERTIARY,
      letterSpacing: 1,
  },
  playingTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: ACCENT,
  },
  playerInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  modalContent: {
      backgroundColor: SURFACE,
      borderRadius: 32,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.2)',
      shadowColor: ACCENT,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 40,
  },
  modalTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: TEXT_PRIMARY,
      marginBottom: 8,
  },
  modalSub: {
      fontSize: 14,
      color: TEXT_SECONDARY,
      marginBottom: 24,
  },
  modalInput: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 16,
      color: TEXT_PRIMARY,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 24,
  },
  modalButtons: {
      flexDirection: 'row',
      gap: 12,
  },
  cancelBtn: {
      flex: 1,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
  },
  cancelBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: TEXT_TERTIARY,
      letterSpacing: 1,
  },
  confirmBtn: {
      flex: 2,
      backgroundColor: ACCENT,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
  },
  confirmBtnText: {
      fontSize: 13,
      fontWeight: '900',
      color: '#000',
      letterSpacing: 1,
  },
  guestBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 18,
      marginBottom: 8,
      gap: 12,
  },
  guestTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#fff',
  },
  guestSub: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 2,
  },
  guestBtn: {
      backgroundColor: '#fff',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
  },
  guestBtnText: {
      fontSize: 11,
      fontWeight: '900',
      color: ACCENT,
  },
})
