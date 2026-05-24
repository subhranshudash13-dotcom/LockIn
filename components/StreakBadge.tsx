import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Text } from './ui/Text'
import { Ionicons } from '@expo/vector-icons'
import { ACCENT } from '@/lib/theme'

interface StreakBadgeProps {
    count: number
    style?: ViewStyle
}

export const StreakBadge = ({ count, style }: StreakBadgeProps) => {
    return (
        <View style={[styles.badge, style]}>
            <Ionicons name="flame" size={14} color="#000" />
            <Text style={styles.text}>{count}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    badge: {
        backgroundColor: ACCENT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    text: {
        fontSize: 12,
        fontWeight: '900',
        color: '#000',
    },
})
