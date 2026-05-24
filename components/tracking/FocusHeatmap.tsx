/**
 * FocusHeatmap.tsx
 * A 7x5 GitHub-style contribution grid showing real focus intensity from daily logs.
 */

import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { Text } from '@/components/ui/Text'
import { ACCENT, TEXT_TERTIARY } from '@/lib/theme'
import { getDailyLogs, DailyLog } from '@/lib/focusStore'

const { width } = Dimensions.get('window')
const SQUARE_SIZE = (width - 40 - 24) / 7

export default function FocusHeatmap() {
  const [days, setDays] = useState<{ id: number; intensity: number }[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const logs = await getDailyLogs(35)
    const mapped = logs.map((log, i) => ({
      id: i,
      intensity: minutesToIntensity(log.focusMinutes),
    }))
    setDays(mapped)
  }

  const getOpacity = (intensity: number) => {
    if (intensity === 0) return 0.05
    if (intensity === 1) return 0.2
    if (intensity === 2) return 0.5
    return 1
  }

  // Fallback: show empty grid while loading
  const displayDays = days.length > 0
    ? days
    : Array.from({ length: 35 }, (_, i) => ({ id: i, intensity: 0 }))

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {displayDays.map(day => (
          <View
            key={day.id}
            style={[
              styles.square,
              {
                backgroundColor: ACCENT,
                opacity: getOpacity(day.intensity),
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.squareSm, { backgroundColor: ACCENT, opacity: getOpacity(i) }]} />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  )
}

/**
 * Map focus minutes to a 0-3 intensity level:
 *   0 mins      → 0 (no activity)
 *   1–29 mins   → 1 (light)
 *   30–59 mins  → 2 (moderate)
 *   60+ mins    → 3 (heavy)
 */
function minutesToIntensity(minutes: number): number {
  if (minutes <= 0) return 0
  if (minutes < 30) return 1
  if (minutes < 60) return 2
  return 3
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
  },
  legendText: {
    fontSize: 10,
    color: TEXT_TERTIARY,
  },
  squareSm: {
    width: 8,
    height: 8,
    borderRadius: 1,
  },
})
