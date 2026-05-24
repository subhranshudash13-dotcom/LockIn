import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { 
    FadeIn, 
    FadeOut, 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    withSequence 
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { Text } from '@/components/ui/Text'
import { Ionicons } from '@expo/vector-icons'
import { ACCENT } from '@/lib/theme'

interface FocusOverlayProps {
    visible: boolean
    isStrict?: boolean
}

export default function FocusOverlay({ visible, isStrict = false }: FocusOverlayProps) {
    const pulse = useSharedValue(0.1)

    useEffect(() => {
        if (visible) {
            pulse.value = withRepeat(
                withSequence(
                    withTiming(isStrict ? 0.4 : 0.2, { duration: isStrict ? 1500 : 3000 }),
                    withTiming(isStrict ? 0.2 : 0.1, { duration: isStrict ? 1500 : 3000 })
                ),
                -1,
                true
            )
        }
    }, [visible, isStrict])

    const glowStyle = useAnimatedStyle(() => ({
        opacity: pulse.value,
        transform: [{ scale: 1 + pulse.value * 2 }]
    }))

    if (!visible) return null

    return (
        <Animated.View 
            entering={FadeIn} 
            exiting={FadeOut} 
            style={StyleSheet.absoluteFill}
        >
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={styles.container}>
                    <Animated.View style={[styles.glow, glowStyle, isStrict && { backgroundColor: '#ef4444' }]} />
                    <View style={styles.content}>
                        <Ionicons name={isStrict ? "warning" : "lock-closed"} size={48} color={isStrict ? "#ef4444" : ACCENT} />
                        <Text style={[styles.title, isStrict && { color: '#ef4444' }]}>{isStrict ? "STRICT LOCKIN ACTIVE" : "LOCKIN MODE ACTIVE"}</Text>
                        <Text style={styles.sub}>{isStrict ? "LEAVING WILL COST 10 XP. STAY FOCUSED." : "Focus on your task. Don't leave the app."}</Text>
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: ACCENT,
        opacity: 0.1,
    },
    content: {
        alignItems: 'center',
        gap: 16,
        padding: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
    },
    sub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
    }
})
