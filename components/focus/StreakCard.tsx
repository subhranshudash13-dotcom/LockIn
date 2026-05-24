/**
 * StreakCard.tsx
 * Displays the current streak with flame animation and freeze controls.
 */

import React, { useEffect } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Text } from '@/components/ui/Text'
import { StreakData } from '@/lib/focusStore'
import {
  ACCENT,
  ACCENT_DIM,
  ACCENT_BORDER,
  SURFACE,
  SURFACE2,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  WARNING,
} from '@/lib/theme'

interface StreakCardProps {
  streak: StreakData
  onUseFreeze?: () => void
}

export default function StreakCard({ streak, onUseFreeze }: StreakCardProps) {
  const flameScale = useSharedValue(1)
  const flameOpacity = useSharedValue(1)

  useEffect(() => {
    if (streak.currentStreak > 0) {
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.95, { duration: 800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
      flameOpacity.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      )
    }
  }, [streak.currentStreak])

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
    opacity: flameOpacity.value,
  }))

  const isActive = streak.currentStreak > 0
  const frozenStyle = streak.freezeUsed

  return (
    <View style={styles.card}>
      {/* Flame + count */}
      <View style={styles.main}>
        <Animated.Text style={[styles.flame, flameStyle, !isActive && styles.flameDead]}>
          {frozenStyle ? '❄️' : '🔥'}
        </Animated.Text>
        <View style={styles.countBlock}>
          <Text style={styles.count}>{streak.currentStreak}</Text>
          <Text style={styles.countLabel}>day streak</Text>
        </View>
      </View>

      {/* Streak dots — last 7 days visual */}
      <StreakDots streak={streak.currentStreak} />

      {/* Freeze badge / button */}
      <View style={styles.footer}>
        {streak.freezeAvailable ? (
          <Pressable
            style={styles.freezeBtn}
            onPress={onUseFreeze}
            hitSlop={8}
          >
            <Text style={styles.freezeBtnText}>❄️ Use Streak Freeze</Text>
          </Pressable>
        ) : streak.freezeUsed ? (
          <View style={styles.frozenBadge}>
            <Text style={styles.frozenText}>❄️ Freeze active — streak protected</Text>
          </View>
        ) : (
          <Text style={styles.noFreeze}>
            🛡️ Freeze recharges every 7 days
          </Text>
        )}
      </View>
    </View>
  )
}

function StreakDots({ streak }: { streak: number }) {
  const days = Array.from({ length: 7 }, (_, i) => i < (streak % 7 || (streak >= 7 ? 7 : 0)))
  return (
    <View style={dotStyles.row}>
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
        <View key={i} style={dotStyles.col}>
          <View style={[dotStyles.dot, days[i] && dotStyles.dotActive]} />
          <Text style={dotStyles.label}>{d}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    padding: 20,
    gap: 16,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  flame: {
    fontSize: 52,
  },
  flameDead: {
    opacity: 0.25,
  },
  countBlock: {
    gap: 2,
  },
  count: {
    fontSize: 44,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: -1.5,
  },
  countLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  footer: {
    alignItems: 'flex-start',
  },
  freezeBtn: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  freezeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: ACCENT,
  },
  frozenBadge: {
    backgroundColor: 'rgba(96,165,250,0.10)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  frozenText: {
    fontSize: 13,
    color: '#93c5fd',
  },
  noFreeze: {
    fontSize: 12,
    color: TEXT_TERTIARY,
  },
})

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  col: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dotActive: {
    backgroundColor: 'rgba(245,158,11,0.25)',
    borderColor: 'rgba(245,158,11,0.5)',
  },
  label: {
    fontSize: 10,
    color: TEXT_TERTIARY,
    fontWeight: '700',
  },
})
