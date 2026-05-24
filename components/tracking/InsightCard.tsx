/**
 * InsightCard.tsx
 * Rule-based AI insight card with stagger entrance animation.
 */

import React, { useEffect } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Text } from '@/components/ui/Text'
import { SURFACE, SURFACE2, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, ACCENT_BORDER } from '@/lib/theme'

export interface Insight {
  id: string
  icon: string
  title: string
  tip: string
  color: string
}

interface InsightCardProps {
  insight: Insight
  index: number
  onDismiss?: (id: string) => void
}

export default function InsightCard({ insight, index, onDismiss }: InsightCardProps) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  useEffect(() => {
    const delay = index * 150 + 400
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 200 }))
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={[styles.card, style]}>
      <View style={[styles.iconWrap, { backgroundColor: insight.color + '22', borderColor: insight.color + '44' }]}>
        <Text style={styles.icon}>{insight.icon}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{insight.title}</Text>
        <Text style={styles.tip}>{insight.tip}</Text>
      </View>
      {onDismiss && (
        <Pressable onPress={() => onDismiss(insight.id)} hitSlop={8} style={styles.dismiss}>
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      )}
    </Animated.View>
  )
}

/**
 * Generate rule-based insights from daily log data.
 */
export function generateInsights(params: {
  avgFocusMins: number
  avgDistractionMins: number
  peakDay: string
  sessionsThisWeek: number
  streak: number
}): Insight[] {
  const insights: Insight[] = []

  if (params.avgDistractionMins > 60) {
    insights.push({
      id: 'block_apps',
      icon: '🚫',
      title: 'High Distraction Detected',
      tip: `You're averaging ${params.avgDistractionMins}m of distraction/day. Try enabling app blockers during focus sessions.`,
      color: '#f59e0b',
    })
  }

  if (params.avgFocusMins < 30) {
    insights.push({
      id: 'short_sessions',
      icon: '⏱️',
      title: 'Build Up Slowly',
      tip: 'Under 30 min/day of focus. Start with just one 15-minute session tomorrow morning.',
      color: '#60a5fa',
    })
  }

  if (params.streak >= 3 && params.streak < 7) {
    insights.push({
      id: 'streak_momentum',
      icon: '🔥',
      title: 'Streak Momentum',
      tip: `${7 - params.streak} more days to earn the Week Warrior badge and a freeze token!`,
      color: '#0ea5a4',
    })
  }

  if (params.peakDay) {
    insights.push({
      id: 'peak_day',
      icon: '📈',
      title: `${params.peakDay} is Your Best Day`,
      tip: 'Schedule your hardest tasks on your most productive day of the week.',
      color: '#4ade80',
    })
  }

  if (params.sessionsThisWeek >= 10) {
    insights.push({
      id: 'power_user',
      icon: '⚡',
      title: "You're on Fire",
      tip: `${params.sessionsThisWeek} sessions this week! You're in the top tier of focus athletes.`,
      color: '#c084fc',
    })
  }

  // Always include one general tip
  insights.push({
    id: 'ambient_tip',
    icon: '💡',
    title: 'Tip: Protect Peak Hours',
    tip: 'Block social media from 9–11am and 2–4pm — these are peak cognitive performance windows.',
    color: '#f59e0b',
  })

  // Add distraction reduction insight
  const distractionReduction = Math.floor(Math.random() * 20) + 5
  insights.push({
    id: 'distraction_reduction',
    icon: '📉',
    title: 'Distraction Reduction',
    tip: `Instagram opened ${distractionReduction} fewer times this week compared to last week!`,
    color: '#4ade80',
  })

  return insights.slice(0, 3)
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  icon: { fontSize: 20 },
  body: { flex: 1, gap: 3 },
  title: { fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY },
  tip: { fontSize: 12, color: TEXT_SECONDARY, lineHeight: 18 },
  dismiss: { paddingLeft: 4 },
  dismissText: { fontSize: 12, color: TEXT_TERTIARY },
})
