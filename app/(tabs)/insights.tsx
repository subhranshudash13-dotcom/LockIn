/**
 * app/(tabs)/insights.tsx
 * Weekly Insights — productivity score dial, focus consistency chart, AI tips, share card.
 */

import React, { useCallback, useState } from 'react'
import { View, ScrollView, StyleSheet, RefreshControl, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import ProductivityDial from '@/components/tracking/ProductivityDial'
import Sparkline from '@/components/tracking/Sparkline'
import FocusHeatmap from '@/components/tracking/FocusHeatmap'
import InsightCard, { generateInsights, Insight } from '@/components/tracking/InsightCard'
import ShareCard from '@/components/tracking/ShareCard'
import {
  getDailyLogs,
  getStreak,
  computeFocusScore,
  scoreTier,
  getBestFocusHour,
  getWeeklyTrends,
  DailyLog,
} from '@/lib/focusStore'
import {
  ACCENT,
  BG,
  SURFACE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import SubscriptionGate from '@/components/premium/SubscriptionGate'
import { Ionicons } from '@expo/vector-icons'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function InsightsScreen() {
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [weekLogs, setWeekLogs] = useState<DailyLog[]>([])
  const [streak, setStreak] = useState(0)
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [weekScore, setWeekScore] = useState(0)
  const [minutesToBeatYesterday, setMinutesToBeatYesterday] = useState(42)
  const [bestHour, setBestHour] = useState(9)
  const [trends, setTrends] = useState({ improvement: 0, thisWeekMins: 0, lastWeekMins: 0 })

  const load = useCallback(async () => {
    const [logs, s] = await Promise.all([getDailyLogs(7), getStreak()])
    setWeekLogs(logs)
    setStreak(s.currentStreak)

    if (logs.length === 0) {
        setInsights([])
        setWeekScore(0)
        return
    }

    // Compute blended weekly productivity score
    const scores = logs.map((l) => computeFocusScore(1, l.distractionMinutes, s.currentStreak))
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length))
    setWeekScore(avg)

    // Find peak day
    const peakLog = logs.reduce(
      (best, l) => (l.focusMinutes > best.focusMinutes ? l : best),
      logs[0]
    )
    const peakDay = peakLog ? DAYS_OF_WEEK[(new Date(peakLog.date).getDay() + 6) % 7] : ''

    const avgFocusMins = Math.round(
      logs.reduce((a, l) => a + l.focusMinutes, 0) / 7
    )
    const avgDistractionMins = Math.round(
      logs.reduce((a, l) => a + l.distractionMinutes, 0) / 7
    )
    const sessionsThisWeek = logs.reduce((a, l) => a + l.sessionsCompleted, 0)

    // Calculate minutes away from beating yesterday's record
    const yesterdayIndex = logs.length - 2
    const yesterdayMinutes = yesterdayIndex >= 0 ? logs[yesterdayIndex].focusMinutes : 0
    const todayMinutes = logs.length > 0 ? logs[logs.length - 1].focusMinutes : 0
    const minutesToBeat = Math.max(0, yesterdayMinutes - todayMinutes + 1)
    setMinutesToBeatYesterday(minutesToBeat)

    const t = await getWeeklyTrends()
    setTrends(t)
    
    const bh = await getBestFocusHour()
    setBestHour(bh)

    setInsights(
      generateInsights({
        avgFocusMins,
        avgDistractionMins,
        peakDay,
        sessionsThisWeek,
        streak: s.currentStreak,
      })
    )
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

  const dismissInsight = (id: string) => {
    setDismissedInsights((prev) => [...prev, id])
  }

  const visibleInsights = insights.filter((i) => !dismissedInsights.includes(i.id))

  // Derived data
  const focusData = weekLogs.map((l) => l.focusMinutes)
  const sessionData = weekLogs.map((l) => l.sessionsCompleted)
  const totalFocusMins = weekLogs.reduce((a, l) => a + l.focusMinutes, 0)
  const totalSessions = weekLogs.reduce((a, l) => a + l.sessionsCompleted, 0)
  const savedHours = Math.max(0, Math.round((totalFocusMins - 180) / 60))
  const tier = scoreTier(weekScore)

  // Week label
  const { width: SW } = Dimensions.get('window')
  const chartWidth = Math.max(280, SW - 72)
  const today = new Date()
  const weekLabel = (() => {
    try {
        return `Weekly Analysis · ${today.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
    } catch (e) {
        return `Weekly Analysis · ${today.getFullYear()}`
    }
  })()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: TAB_BAR_CLEARANCE + 24 },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>{weekLabel}</Text>
      </View>

      {/* Deep Work Score Dial */}
      <SectionLabel label="Productivity Score" />
      <View style={styles.dialCard}>
        <ProductivityDial score={weekScore} size={180} />
        <Text style={styles.dialCaption}>
          {tier.emoji} {tier.label} — Momentum identified.
        </Text>
      </View>

      {/* High Productivity Window */}
      <View style={styles.trendRow}>
        <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>PEAK FOCUS HOUR</Text>
            <Text style={styles.trendValue}>{bestHour === 0 ? '12' : bestHour > 12 ? bestHour - 12 : bestHour}:00 {bestHour >= 12 ? 'PM' : 'AM'}</Text>
        </View>
        <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>WEEKLY TREND</Text>
            <Text style={[styles.trendValue, { color: trends.improvement >= 0 ? '#10b981' : '#f87171' }]}>
                {trends.improvement >= 0 ? '+' : ''}{trends.improvement}%
            </Text>
        </View>
      </View>

      {/* Focus Velocity Section */}
      <SectionLabel label="Focus Velocity" />
      <View style={styles.card}>
        <View style={styles.velocityRow}>
            <Ionicons name="trending-up" size={20} color={ACCENT} />
            <Text style={styles.recordText}>
                {minutesToBeatYesterday > 0 
                  ? `${minutesToBeatYesterday}m to match yesterday`
                  : 'New daily record achieved'}
            </Text>
        </View>
        <Text style={styles.recordSubtext}>Stay consistent to maintain the flow.</Text>
      </View>

      {/* Heatmap Section */}
      <SectionLabel label="Deep Work Momentum" />
      <Card style={styles.heatmapCard}>
        <FocusHeatmap />
      </Card>

      {/* Focus Consistency Sparkline */}
      <SectionLabel label="Focus Consistency" />
      <View style={styles.card}>
        <Sparkline
          data={focusData}
          labels={DAY_LABELS}
          width={chartWidth}
          height={80}
          unit="m"
        />
      </View>

      {/* Sessions per day */}
      <SectionLabel label="Session Intensity" />
      <SubscriptionGate fallbackMessage="Unlock Session-by-session history and deep analytics.">
        <View style={styles.card}>
          <Sparkline
            data={sessionData}
            labels={DAY_LABELS}
            color={ACCENT}
            width={chartWidth}
            height={80}
            unit=""
          />
        </View>
      </SubscriptionGate>

      {/* AI Insight cards */}
      {visibleInsights.length > 0 && (
        <>
          <SectionLabel label="AI Insights" />
          {visibleInsights.map((ins, idx) => (
            <InsightCard
              key={ins.id}
              insight={ins}
              index={idx}
              onDismiss={dismissInsight}
            />
          ))}
        </>
      )}

      {/* Share card */}
      <SectionLabel label="Share Your Week" />
      <ShareCard
        totalFocusMins={totalFocusMins}
        totalSessions={totalSessions}
        streak={streak}
        score={weekScore}
        savedHours={savedHours}
        weekLabel={weekLabel}
      />
    </ScrollView>
  )
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, gap: 16 },
  header: { marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: -1 },
  subtitle: { fontSize: 14, color: TEXT_SECONDARY, marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_TERTIARY,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  dialCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.05)',
  },
  dialCaption: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.05)',
  },
  heatmapCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.05)',
  },
  velocityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
  },
  recordText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.2,
  },
  recordSubtext: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  trendRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trendItem: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  trendLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: TEXT_TERTIARY,
    letterSpacing: 1,
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 20,
    fontWeight: '900',
    color: TEXT_PRIMARY,
  },
})
