import React, { useEffect } from 'react'
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Text } from '@/components/ui/Text'
import {
  ACCENT,
  BG,
  SURFACE,
  SURFACE2,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/lib/theme'
import { ACHIEVEMENT_DEFS } from '@/lib/achievementDefs'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'

interface SessionCompleteModalProps {
  visible: boolean
  durationMinutes: number
  xpGained: number
  streak: number
  newAchievementIds: string[]
  leveled: boolean
  newLevel?: number
  focusScore?: number
  onDismiss: () => void
}

export default function SessionCompleteModal({
  visible,
  durationMinutes,
  xpGained,
  streak,
  newAchievementIds,
  leveled,
  newLevel,
  focusScore = 100,
  onDismiss,
}: SessionCompleteModalProps) {
  const scale = useSharedValue(0.9)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1)
      opacity.value = withTiming(1, { duration: 400 })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }, [visible])

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  const newBadges = newAchievementIds
    .map((id) => ACHIEVEMENT_DEFS.find((a) => a.id === id))
    .filter(Boolean)

  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, cardStyle]}>
          <LinearGradient
            colors={['#1a1a1a', '#050505']}
            style={StyleSheet.absoluteFill}
          />
          
          <AnimatedView entering={FadeInDown.delay(200)} style={styles.header}>
            <View style={styles.iconCircle}>
                <Ionicons name="trophy" size={32} color={ACCENT} />
            </View>
            <Text style={styles.title}>Session Complete</Text>
            <Text style={styles.subtitle}>You focused for {durationMinutes} minutes.</Text>
          </AnimatedView>

          <View style={styles.statsRow}>
            <StatBox label="XP GAINED" value={`+${xpGained}`} color={ACCENT} />
            <StatBox label="FOCUS SCORE" value={`${focusScore}`} color="#60a5fa" />
            <StatBox label="STREAK" value={`${streak}d`} color="#10b981" />
          </View>

          {leveled && (
            <AnimatedView entering={FadeInDown.delay(400)} style={styles.levelUpBox}>
                <Text style={styles.levelUpText}>PRESTIGE UNLOCKED</Text>
                <Text style={styles.levelValue}>YOU HAVE ASCENDED TO LEVEL {newLevel}</Text>
            </AnimatedView>
          )}

          {newBadges.length > 0 && (
            <View style={styles.badgeSection}>
                <Text style={styles.sectionLabel}>NEW ACHIEVEMENTS</Text>
                {newBadges.map(b => (
                    <View key={b!.id} style={styles.badgeRow}>
                        <Text style={styles.badgeIcon}>{b!.icon}</Text>
                        <Text style={styles.badgeTitle}>{b!.title}</Text>
                    </View>
                ))}
            </View>
          )}

          <Pressable style={styles.dismissBtn} onPress={onDismiss}>
            <LinearGradient
                colors={[ACCENT, '#B45309']}
                style={styles.dismissGradient}
            >
                <Text style={styles.dismissText}>CONTINUE JOURNEY</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <View style={styles.statBox}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
    )
}

const AnimatedView = Animated.createAnimatedComponent(View)

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: SURFACE,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    padding: 32,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 100,
      backgroundColor: 'rgba(245,158,11,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.2)',
  },
  title: { fontSize: 24, fontWeight: '900', color: TEXT_PRIMARY, marginBottom: 8 },
  subtitle: { fontSize: 14, color: TEXT_SECONDARY },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 24,
  },
  statBox: {
      flex: 1,
      backgroundColor: SURFACE2,
      padding: 16,
      borderRadius: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.03)',
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 1 },
  statValue: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  levelUpBox: {
      width: '100%',
      backgroundColor: 'rgba(245,158,11,0.1)',
      padding: 20,
      borderRadius: 24,
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.2)',
  },
  levelUpText: { fontSize: 11, fontWeight: '900', color: ACCENT, letterSpacing: 2 },
  levelValue: { fontSize: 16, fontWeight: '900', color: TEXT_PRIMARY, marginTop: 4 },
  badgeSection: {
      width: '100%',
      marginBottom: 32,
      gap: 12,
  },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 1, marginBottom: 4 },
  badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: SURFACE2,
      padding: 12,
      borderRadius: 20,
      gap: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.03)',
  },
  badgeIcon: { fontSize: 20 },
  badgeTitle: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  dismissBtn: { width: '100%', borderRadius: 100, overflow: 'hidden' },
  dismissGradient: { paddingVertical: 20, alignItems: 'center' },
  dismissText: { fontSize: 15, fontWeight: '900', color: '#000', letterSpacing: 1 },
})
