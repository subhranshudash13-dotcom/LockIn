/**
 * XPRewardPopup.tsx
 * Animated overlay that bursts up and fades out when XP is earned.
 * Expose show(xp) via an imperative ref.
 */

import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Text } from '@/components/ui/Text'

export interface XPRewardPopupRef {
  show: (xp: number, label?: string) => void
}

interface XPRewardPopupProps {
  // no props needed; state driven imperatively
}

const XPRewardPopup = forwardRef<XPRewardPopupRef, XPRewardPopupProps>(
  (_, ref) => {
    const opacity = useSharedValue(0)
    const translateY = useSharedValue(0)
    const scale = useSharedValue(0.6)
    const xpRef = useRef(25)
    const labelRef = useRef('')

    useImperativeHandle(ref, () => ({
      show(xp: number, label = '') {
        xpRef.current = xp
        labelRef.current = label
        // Reset
        translateY.value = 0
        scale.value = 0.6
        opacity.value = 0
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

        // Animate: spring in, float up, fade out
        opacity.value = withSequence(
          withTiming(1, { duration: 200, easing: Easing.out(Easing.back(1.5)) }),
          withTiming(1, { duration: 1200 }),
          withTiming(0, { duration: 500 })
        )
        scale.value = withSpring(1, { damping: 10, stiffness: 200 })
        translateY.value = withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-60, { duration: 1800, easing: Easing.out(Easing.quad) })
        )
      },
    }))

    const animStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }))

    return (
      <Animated.View style={[styles.container, animStyle]} pointerEvents="none">
        <View style={styles.pill}>
          <Text style={styles.emoji}>⚡</Text>
          <Text style={styles.xpText}>+{xpRef.current} XP</Text>
        </View>
      </Animated.View>
    )
  }
)

XPRewardPopup.displayName = 'XPRewardPopup'
export default XPRewardPopup

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(245,158,11,0.35)',
  },
  emoji: {
    fontSize: 18,
  },
  xpText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: -1,
  },
})
