import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Text } from '@/components/ui/Text'
import { FocusProfile, levelProgress, xpForLevel, xpForNextLevel } from '@/lib/focusStore'
import {
  ACCENT,
  SURFACE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/lib/theme'

interface XPBarProps {
  profile: FocusProfile
}

export default function XPBar({ profile }: XPBarProps) {
  const progress = levelProgress(profile.xp)
  const animWidth = useSharedValue(0)

  useEffect(() => {
    animWidth.value = withTiming(progress, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    })
  }, [progress])

  const barStyle = useAnimatedStyle(() => ({
    width: `${animWidth.value * 100}%` as any,
  }))

  const currentLevelXP = xpForLevel(profile.level)
  const xpInLevel = profile.xp - currentLevelXP
  const xpNeeded = xpForNextLevel(profile.level)

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Level {profile.level}</Text>
        </View>
        <Text style={styles.xpFraction}>
          {xpInLevel} / {xpNeeded} XP
        </Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]}>
          <LinearGradient
            colors={[ACCENT, '#B45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      <Text style={styles.totalXP}>TOTAL PROGRESS: {profile.xp.toLocaleString()} XP</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBadge: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
  },
  levelText: { fontSize: 13, fontWeight: '900', color: ACCENT, letterSpacing: 0.5 },
  xpFraction: { fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY },
  track: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 100,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    minWidth: 10,
  },
  totalXP: {
    fontSize: 9,
    fontWeight: '800',
    color: TEXT_TERTIARY,
    letterSpacing: 1,
  },
})
