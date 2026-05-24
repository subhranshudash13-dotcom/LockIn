import React, { useEffect } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Text } from './ui/Text'
import { ACCENT, SURFACE } from '@/lib/theme'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

interface XPBarProps {
    current: number
    max: number
    level: number
    style?: ViewStyle
}

export const XPBar = ({ current, max, level, style }: XPBarProps) => {
    const progress = useSharedValue(0)
    const percentage = Math.min(100, (current / max) * 100)

    useEffect(() => {
        progress.value = withSpring(percentage)
    }, [percentage])

    const fillStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }))

    return (
        <View style={[styles.container, style]}>
            <View style={styles.header}>
                <Text style={styles.levelText}>LVL {level}</Text>
                <Text style={styles.xpText}>{current} / {max} XP</Text>
            </View>
            <View style={styles.barRoot}>
                <Animated.View style={[styles.barFill, fillStyle]}>
                    <LinearGradient
                        colors={[ACCENT, '#FCD34D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    levelText: {
        fontSize: 12,
        fontWeight: '900',
        color: ACCENT,
        letterSpacing: 1,
    },
    xpText: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
    },
    barRoot: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
})
