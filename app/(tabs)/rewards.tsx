import React, { useCallback, useState } from 'react'
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { LinearGradient } from 'expo-linear-gradient'
import XPBar from '@/components/focus/XPBar'
import StreakCard from '@/components/focus/StreakCard'
import AchievementGrid from '@/components/focus/AchievementGrid'
import {
  getProfile,
  getStreak,
  getAchievements,
  useStreakFreeze,
  FocusProfile,
  StreakData,
  AchievementState,
} from '@/lib/focusStore'
import {
  ACCENT,
  BG,
  SURFACE,
  SURFACE2,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { Ionicons } from '@expo/vector-icons'

export default function RewardsScreen() {
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)

  const [profile, setProfile] = useState<FocusProfile | null>(null)
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [achievements, setAchievements] = useState<AchievementState>({})

  const load = useCallback(async () => {
    const [p, s, a] = await Promise.all([
      getProfile(),
      getStreak(),
      getAchievements(),
    ])
    setProfile(p)
    setStreak(s)
    setAchievements(a)
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const handleUseFreeze = async () => {
    const ok = await useStreakFreeze()
    if (ok) await load()
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + 20,
          paddingBottom: TAB_BAR_CLEARANCE + 24,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={ACCENT}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hall of Resolve</Text>
        <Text style={styles.subtitle}>Your evolution in the deep work arena.</Text>
      </View>

      {/* Global stats row */}
      {profile && (
        <View style={styles.statsRow}>
          <MiniStat label="Sessions" value={`${profile.totalSessions}`} icon="copy" />
          <MiniStat
            label="Total Focus"
            value={
              profile.totalFocusMinutes >= 60
                ? `${Math.floor(profile.totalFocusMinutes / 60)}h ${profile.totalFocusMinutes % 60}m`
                : `${profile.totalFocusMinutes}m`
            }
            icon="timer"
          />
          <MiniStat label="Best Streak" value={`${profile.longestStreak}d`} icon="shield" />
        </View>
      )}

      {/* Rank Card */}
      <SectionLabel label="ELITE STANDING" />
      <Card style={styles.rankCard}>
        <LinearGradient
            colors={['rgba(245,158,11,0.08)', 'transparent']}
            style={StyleSheet.absoluteFill}
        />
        <View style={styles.rankInfo}>
          <View style={styles.iconCircle}>
            <Ionicons name="medal" size={32} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rankTitle}>Monk Mode</Text>
            <Text style={styles.rankSubtitle}>Top 5% Global Momentum</Text>
          </View>
          <View style={styles.badgeLabel}>
            <Text style={styles.badgeText}>ELITE</Text>
          </View>
        </View>
      </Card>

      {/* XP / Level bar */}
      <SectionLabel label="LEVEL PROGRESSION" />
      {profile && <XPBar profile={profile} />}

      {/* Streak card */}
      <SectionLabel label="STREAK SURVIVAL" />
      {streak && (
        <StreakCard streak={streak} onUseFreeze={handleUseFreeze} />
      )}

      {/* Achievement grid */}
      <AchievementGrid achievements={achievements} />
    </ScrollView>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={sectionStyles.label}>{label}</Text>
  )
}

function MiniStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={miniStyles.card}>
      <Ionicons name={icon as any} size={20} color={TEXT_SECONDARY} style={{ marginBottom: 4 }} />
      <Text style={miniStyles.value}>{value}</Text>
      <Text style={miniStyles.label}>{label}</Text>
    </View>
  )
}

const miniStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.05)',
  },
  value: { fontSize: 18, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: -0.5 },
  label: { fontSize: 9, color: TEXT_TERTIARY, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
})

const sectionStyles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: TEXT_TERTIARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 10,
  },
})

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rankCard: {
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
      width: 60,
      height: 60,
      borderRadius: 100,
      backgroundColor: 'rgba(245,158,11,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
  },
  rankTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  rankSubtitle: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: '500'
  },
  badgeLabel: {
      backgroundColor: ACCENT,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 100,
  },
  badgeText: {
      fontSize: 10,
      fontWeight: '900',
      color: '#000',
  }
})
