/**
 * ProductivityDial.tsx
 * Large animated arc dial sweeping 0 → score, with counting number and tier badge.
 */

import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated as RNAnimated, Easing as RNEasing } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { Text } from '@/components/ui/Text'
import { scoreTier } from '@/lib/focusStore'
import { TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'

const AnimSvgPath = Animated.createAnimatedComponent(Path)

interface ProductivityDialProps {
  score: number   // 0-100
  size?: number
}

/** Polar → Cartesian for arc path */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  'worklet';
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  'worklet';
  const s = polarToCartesian(cx, cy, r, startDeg)
  const e = polarToCartesian(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

const START_DEG = -140
const TOTAL_DEG = 280

export default function ProductivityDial({ score, size = 220 }: ProductivityDialProps) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.36
  const stroke = 14

  const tier = scoreTier(score)
  const progress = useSharedValue(0)
  const countRef = useRef(new RNAnimated.Value(0))
  const [displayScore, setDisplayScore] = React.useState(0)

  useEffect(() => {
    // Arc sweep
    progress.value = withDelay(
      300,
      withTiming(score / 100, { duration: 1000, easing: Easing.out(Easing.cubic) })
    )

    // Counting number
    RNAnimated.timing(countRef.current, {
      toValue: score,
      duration: 1100,
      delay: 300,
      easing: RNEasing.out(RNEasing.quad),
      useNativeDriver: false,
    }).start()

    const listener = countRef.current.addListener(({ value }) => {
      setDisplayScore(Math.round(value))
    })
    return () => countRef.current.removeListener(listener)
  }, [score])

  const animProps = useAnimatedProps(() => {
    const endDeg = START_DEG + progress.value * TOTAL_DEG
    const d = arcPath(cx, cy, r, START_DEG, endDeg)
    return { d }
  })

  // Static track arc
  const trackPath = arcPath(cx, cy, r, START_DEG, START_DEG + TOTAL_DEG)

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Path
          d={trackPath}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        {/* Animated fill */}
        <AnimSvgPath
          animatedProps={animProps}
          stroke={tier.color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>

      {/* Center */}
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.score, { color: tier.color }]}>{displayScore}</Text>
        <Text style={styles.scoreLabel}>/ 100</Text>
        <View style={[styles.tierBadge, { backgroundColor: tier.color + '22', borderColor: tier.color + '55' }]}>
          <Text style={styles.tierEmoji}>{tier.emoji}</Text>
          <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  score: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -2,
  },
  scoreLabel: {
    fontSize: 14,
    color: TEXT_TERTIARY,
    marginTop: -4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  tierEmoji: { fontSize: 14 },
  tierLabel: { fontSize: 13, fontWeight: '700' },
})
