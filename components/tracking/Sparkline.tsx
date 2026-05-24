/**
 * Sparkline.tsx
 * Animated SVG area sparkline chart for 7-day trends.
 * Path draws left-to-right on mount using strokeDashoffset animation.
 */

import React, { useEffect, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, {
  Polyline,
  Defs,
  LinearGradient as SvgGrad,
  Stop,
  Path,
  Circle as SvgCircle,
} from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Text } from '@/components/ui/Text'
import { ACCENT, TEXT_TERTIARY } from '@/lib/theme'

const AnimatedPath = Animated.createAnimatedComponent(Path)

interface SparklineProps {
  data: number[]          // one value per day
  labels?: string[]       // day labels e.g. ['M','T','W',...]
  color?: string
  height?: number
  width?: number
  unit?: string           // e.g. 'min'
}

export default function Sparkline({
  data,
  labels,
  color = ACCENT,
  height = 100,
  width = 300,
  unit = 'min',
}: SparklineProps) {
  const paddingH = 12
  const paddingV = 10
  const chartW = width - paddingH * 2
  const chartH = height - paddingV * 2

  const maxVal = Math.max(...data, 1)
  const pathLength = useSharedValue(1000)
  const animOffset = useSharedValue(1000)

  const points = useMemo(() => {
    return data.map((v, i) => {
      const x = paddingH + (i / (data.length - 1)) * chartW
      const y = paddingV + chartH - (v / maxVal) * chartH
      return { x, y }
    })
  }, [data, maxVal, chartW, chartH])

  // Build SVG path string
  const linePath = useMemo(() => {
    if (points.length < 2) return ''
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ')
  }, [points])

  // Area fill path (close shape to bottom)
  const areaPath = useMemo(() => {
    if (points.length < 2) return ''
    const last = points[points.length - 1]
    const first = points[0]
    return (
      linePath +
      ` L${last.x},${paddingV + chartH} L${first.x},${paddingV + chartH} Z`
    )
  }, [linePath, points, chartH, paddingV])

  useEffect(() => {
    animOffset.value = withDelay(
      300,
      withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) })
    )
  }, [data])

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: animOffset.value,
    strokeDasharray: `${pathLength.value} ${pathLength.value}`,
  }))

  return (
    <View style={{ width, height: height + 20 }}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgGrad id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </SvgGrad>
        </Defs>

        {/* Area fill */}
        {areaPath ? (
          <Path d={areaPath} fill="url(#sparkFill)" />
        ) : null}

        {/* Animated line */}
        {linePath ? (
          <AnimatedPath
            d={linePath}
            stroke={color}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            animatedProps={animProps}
          />
        ) : null}

        {/* Dot markers */}
        {points.map((p, i) => (
          <SvgCircle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={color}
            opacity={data[i] > 0 ? 1 : 0.2}
          />
        ))}
      </Svg>

      {/* X-axis labels */}
      {labels && (
        <View style={[styles.labelsRow, { width }]}>
          {labels.map((l, i) => (
            <Text key={i} style={styles.label}>
              {l}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  label: {
    fontSize: 10,
    color: TEXT_TERTIARY,
    fontWeight: '600',
  },
})
