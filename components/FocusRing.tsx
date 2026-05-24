import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg'
import { ACCENT } from '@/lib/theme'
import Animated, { useAnimatedProps } from 'react-native-reanimated'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface FocusRingProps {
    radius: number
    strokeWidth: number
    progress: number // 0 to 1
}

export const FocusRing = ({ radius, strokeWidth, progress }: FocusRingProps) => {
    const innerRadius = radius - strokeWidth / 2
    const circumference = 2 * Math.PI * innerRadius
    
    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress),
    }))

    return (
        <View style={styles.container}>
            <Svg width={radius * 2} height={radius * 2}>
                <Defs>
                    <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={ACCENT} />
                        <Stop offset="100%" stopColor="#FCD34D" />
                    </LinearGradient>
                </Defs>
                <G rotation="-90" origin={`${radius}, ${radius}`}>
                    <Circle
                        cx={radius}
                        cy={radius}
                        r={innerRadius}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <AnimatedCircle
                        cx={radius}
                        cy={radius}
                        r={innerRadius}
                        stroke="url(#grad)"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        animatedProps={animatedProps}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </G>
            </Svg>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
})
