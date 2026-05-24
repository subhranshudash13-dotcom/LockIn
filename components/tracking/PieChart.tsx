/**
 * PieChart.tsx
 * Animated SVG donut chart — focus (teal) vs distraction (amber).
 * Both arcs draw from 12 o'clock on mount.
 */

import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { Text } from '@/components/ui/Text'
import { SURFACE, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface PieChartProps {
  focusMinutes: number
  distractionMinutes: number
  size?: number
}

const FOCUS_COLOR = '#0ea5a4'
const DISTRACT_COLOR = '#f59e0b'

export default function PieChart({
  focusMinutes,
  distractionMinutes,
  size = 200,
}: PieChartProps) {
  const strokeWidth = 22
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius

  const total = focusMinutes + distractionMinutes || 1
  const focusFrac = focusMinutes / total
  const distractFrac = distractionMinutes / total

  // Animated dash fraction for each arc
  const focusAnim = useSharedValue(0)
  const distractAnim = useSharedValue(0)

  useEffect(() => {
    focusAnim.value = withTiming(focusFrac, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    })
    distractAnim.value = withDelay(
      200,
      withTiming(distractFrac, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      })
    )
  }, [focusMinutes, distractionMinutes])

  // Focus arc — starts at top (rotation -90), draws clockwise
  const focusProps = useAnimatedProps(() => ({
    strokeDasharray: `${circumference * focusAnim.value} ${circumference * (1 - focusAnim.value)}`,
  }))

  // Distraction arc — starts just after focus arc ends
  const distractRotation = focusFrac * 360 - 90
  const distractProps = useAnimatedProps(() => ({
    strokeDasharray: `${circumference * distractAnim.value} ${circumference * (1 - distractAnim.value)}`,
  }))

  const totalHours = (focusMinutes / 60).toFixed(1)

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Focus arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={FOCUS_COLOR}
          strokeWidth={strokeWidth}
          fill="none"
          animatedProps={focusProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
        {/* Distraction arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={DISTRACT_COLOR}
          strokeWidth={strokeWidth}
          fill="none"
          animatedProps={distractProps}
          strokeLinecap="round"
          rotation={`${distractRotation}`}
          origin={`${size / 2},${size / 2}`}
        />
      </Svg>

      {/* Center label */}
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.totalHours}>{totalHours}h</Text>
        <Text style={styles.totalLabel}>total today</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={FOCUS_COLOR} label="Focus" value={`${focusMinutes}m`} />
        <LegendItem color={DISTRACT_COLOR} label="Distraction" value={`${distractionMinutes}m`} />
      </View>
    </View>
  )
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={legendStyles.row}>
      <View style={[legendStyles.dot, { backgroundColor: color }]} />
      <Text style={legendStyles.label}>{label}</Text>
      <Text style={legendStyles.value}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  totalHours: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  totalLabel: { fontSize: 12, color: TEXT_TERTIARY },
  legend: { flexDirection: 'row', gap: 20 },
})

const legendStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 13, color: TEXT_SECONDARY },
  value: { fontSize: 13, fontWeight: '700', color: '#fff' },
})
