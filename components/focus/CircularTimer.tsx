import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop, G } from 'react-native-svg'
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
  withRepeat,
  withSequence,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface CircularTimerProps {
  progress: number
  timeLeft: number
  totalSeconds: number
  isRunning: boolean
  size?: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CircularTimer({
  progress,
  timeLeft,
  isRunning,
  size = 280,
}: CircularTimerProps) {
  const strokeWidth = 8
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(
      circumference * (1 - progress),
      {
        duration: 800,
        easing: Easing.out(Easing.quad),
      }
    ),
  }))

  const breathingScale = useSharedValue(1)

  useEffect(() => {
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 3000 }),
        withTiming(1, { duration: 3000 })
      ),
      -1,
      true
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value }]
  }))

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, animatedStyle]}>
      <Svg 
        width={size} 
        height={size} 
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}
      >
        <Defs>
          <SvgGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ACCENT} stopOpacity="1" />
            <Stop offset="100%" stopColor="#B45309" stopOpacity="1" />
          </SvgGradient>
        </Defs>

        {/* Inner shadow circle */}
        <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius - 10}
            fill="rgba(245,158,11,0.02)"
        />

        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated progress ring */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#timerGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>

      {/* Center content */}
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.phaseText}>{isRunning ? 'FOCUS' : 'READY'}</Text>
        <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
        <View style={styles.statsBar}>
            <Ionicons name="flash" size={14} color={ACCENT} />
            <Text style={styles.xpText}>+{Math.floor((1 - progress) * 100)} XP</Text>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  phaseText: {
      fontSize: 12,
      fontWeight: '800',
      color: TEXT_TERTIARY,
      letterSpacing: 2,
  },
  timeText: {
    fontSize: 56,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 0.5,
  }
})
