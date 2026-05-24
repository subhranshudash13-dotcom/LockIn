import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui/Text'
import { ACCENT, SURFACE, TEXT_PRIMARY, TEXT_TERTIARY } from '@/lib/theme'
import { Ionicons } from '@expo/vector-icons'

interface Props {
    id: string
    title: string
    icon: string
    unlocked: boolean
    unlockedAt?: string | null
}

export default function AchievementCard({ title, icon, unlocked, unlockedAt }: Props) {
    return (
        <View style={[styles.container, unlocked && styles.containerUnlocked]}>
            <View style={[styles.iconWrap, unlocked && styles.iconWrapUnlocked]}>
                <Text style={[styles.icon, !unlocked && styles.iconLocked]}>{icon}</Text>
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, !unlocked && styles.textLocked]}>{title}</Text>
                {unlocked && unlockedAt && (
                    <Text style={styles.date}>{new Date(unlockedAt).toLocaleDateString()}</Text>
                )}
            </View>
            {unlocked && (
                <View style={styles.check}>
                    <Ionicons name="checkmark-circle" size={14} color={ACCENT} />
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: SURFACE,
        borderRadius: 18,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.02)',
        opacity: 0.8,
    },
    containerUnlocked: {
        borderColor: 'rgba(245,158,11,0.15)',
        backgroundColor: 'rgba(245,158,11,0.03)',
        opacity: 1,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    iconWrapUnlocked: {
        backgroundColor: ACCENT,
    },
    icon: {
        fontSize: 18,
    },
    iconLocked: {
        opacity: 0.2,
        grayscale: 1,
    } as any,
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: TEXT_PRIMARY,
    },
    textLocked: {
        color: TEXT_TERTIARY,
        opacity: 0.5,
    },
    date: {
        fontSize: 10,
        fontWeight: '600',
        color: ACCENT,
        marginTop: 2,
        opacity: 0.8,
    },
    check: {
        position: 'absolute',
        top: 10,
        right: 10,
    }
})
