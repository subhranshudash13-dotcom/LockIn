import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text } from '@/components/ui/Text'
import { ACCENT, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, SPACING_MD } from '@/lib/theme'
import { Ionicons } from '@expo/vector-icons'
import { usePersonalization } from '@/hooks/usePersonalization'

const GOAL_OPTIONS = [
    { label: 'Mild', mins: 30, icon: 'leaf' },
    { label: 'Steady', mins: 60, icon: 'walk' },
    { label: 'Locked-In', mins: 120, icon: 'flame' },
    { label: 'God Mode', mins: 240, icon: 'flash' },
]

export default function GoalEditor() {
    const { settings, updateSettings } = usePersonalization()
    const currentGoal = settings.daily_target_mins ?? 60

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Daily Focus Target</Text>
            <Text style={styles.subtitle}>Set your daily intention to maintain your streak.</Text>
            
            <View style={styles.grid}>
                {GOAL_OPTIONS.map((opt) => {
                    const isSelected = currentGoal === opt.mins
                    return (
                        <Pressable 
                            key={opt.mins}
                            style={[styles.card, isSelected && styles.cardActive]}
                            onPress={() => updateSettings({ daily_target_mins: opt.mins })}
                        >
                            <View style={[styles.iconWrap, isSelected && styles.iconWrapActive]}>
                                <Ionicons 
                                    name={opt.icon as any} 
                                    size={20} 
                                    color={isSelected ? '#000' : 'rgba(255,255,255,0.4)'} 
                                />
                            </View>
                            <Text style={[styles.label, isSelected && styles.labelActive]}>{opt.label}</Text>
                            <Text style={styles.mins}>{opt.mins}m</Text>
                        </Pressable>
                    )
                })}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: SURFACE,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: TEXT_PRIMARY,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        color: TEXT_SECONDARY,
        marginTop: 4,
        marginBottom: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardActive: {
        backgroundColor: 'rgba(245,158,11,0.05)',
        borderColor: 'rgba(245,158,11,0.2)',
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    iconWrapActive: {
        backgroundColor: ACCENT,
    },
    label: {
        fontSize: 14,
        fontWeight: '800',
        color: TEXT_SECONDARY,
    },
    labelActive: {
        color: TEXT_PRIMARY,
    },
    mins: {
        fontSize: 12,
        color: TEXT_SECONDARY,
        marginTop: 2,
        opacity: 0.6,
    }
})
