import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from './ui/Text'
import { SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, ACCENT } from '@/lib/theme'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeIn } from 'react-native-reanimated'

interface SessionSummaryProps {
    duration: number
    xpEarned: number
    score: number
}

export const SessionSummary = ({ duration, xpEarned, score }: SessionSummaryProps) => {
    return (
        <Animated.View entering={FadeIn} style={styles.card}>
            <Text style={styles.title}>LOCKED IN SUCCESSFULLY</Text>
            
            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statVal}>{duration}m</Text>
                    <Text style={styles.statLabel}>DURATION</Text>
                </View>
                <View style={[styles.stat, styles.divider]}>
                    <Text style={[styles.statVal, { color: ACCENT }]}>+{xpEarned}</Text>
                    <Text style={styles.statLabel}>XP GAINED</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statVal}>{score}</Text>
                    <Text style={styles.statLabel}>FOCUS SCORE</Text>
                </View>
            </View>

            <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={ACCENT} />
            </View>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: SURFACE,
        padding: 32,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.2)',
        alignItems: 'center',
        gap: 24,
    },
    title: {
        fontSize: 16,
        fontWeight: '900',
        color: ACCENT,
        letterSpacing: 2,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        paddingVertical: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    stat: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    divider: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statVal: {
        fontSize: 24,
        fontWeight: '900',
        color: TEXT_PRIMARY,
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: TEXT_SECONDARY,
        letterSpacing: 1,
    },
    successIcon: {
        marginTop: 8,
    },
})
