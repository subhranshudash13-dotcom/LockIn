import React from 'react'
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native'
import { Text } from './ui/Text'
import { Ionicons } from '@expo/vector-icons'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, BG } from '@/lib/theme'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown } from 'react-native-reanimated'

interface FocusCardProps {
    title: string
    subtitle: string
    onPress: () => void
    style?: ViewStyle
}

export const FocusCard = ({ title, subtitle, onPress, style }: FocusCardProps) => {
    return (
        <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.9 }]}>
                <LinearGradient
                    colors={['#171717', '#080808']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.content}>
                    <View style={styles.labelRow}>
                        <Ionicons name="flame" size={16} color={ACCENT} />
                        <Text style={styles.labelText}>COMMAND CENTER</Text>
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                <View style={styles.glow} />
            </Pressable>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    card: {
        padding: 24,
        borderRadius: 32,
        minHeight: 180,
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.15)',
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
    },
    content: {
        zIndex: 1,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    labelText: {
        fontSize: 10,
        fontWeight: '900',
        color: ACCENT,
        letterSpacing: 2,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: TEXT_PRIMARY,
        letterSpacing: -1,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        fontWeight: '600',
    },
    glow: {
        position: 'absolute',
        right: -50,
        top: -50,
        width: 200,
        height: 200,
        backgroundColor: ACCENT,
        opacity: 0.05,
        borderRadius: 100,
    },
})
