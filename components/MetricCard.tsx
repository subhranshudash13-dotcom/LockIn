import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Text } from './ui/Text'
import { Ionicons } from '@expo/vector-icons'
import { SURFACE, TEXT_PRIMARY, TEXT_TERTIARY, ACCENT } from '@/lib/theme'
import Animated, { FadeInUp } from 'react-native-reanimated'

interface MetricCardProps {
    label: string
    value: string | number
    icon: keyof typeof Ionicons.glyphMap
    iconColor?: string
    style?: ViewStyle
    delay?: number
}

export const MetricCard = ({ label, value, icon, iconColor = ACCENT, style, delay = 0 }: MetricCardProps) => {
    return (
        <Animated.View 
            entering={FadeInUp.delay(delay).springify()}
            style={[styles.card, style]}
        >
            <View style={[styles.iconWrap, { backgroundColor: `${iconColor}10` }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: SURFACE,
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.02)',
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    value: {
        fontSize: 22,
        fontWeight: '900',
        color: TEXT_PRIMARY,
        marginBottom: 2,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: TEXT_TERTIARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
})
