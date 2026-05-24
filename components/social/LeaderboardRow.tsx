import React from 'react'
import { View, StyleSheet, Image } from 'react-native'
import { Text } from '@/components/ui/Text'
import { ACCENT, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { Ionicons } from '@expo/vector-icons'
import { LeaderboardEntry } from '@/lib/focusStore'

interface Props {
    entry: LeaderboardEntry
}

export default function LeaderboardRow({ entry }: Props) {
    const isTop3 = entry.rank <= 3
    const rankColor = entry.rank === 1 ? '#F59E0B' : entry.rank === 2 ? '#94A3B8' : entry.rank === 3 ? '#B45309' : TEXT_TERTIARY

    return (
        <View style={[styles.container, entry.isMe && styles.isMe]}>
            <View style={styles.rankWrap}>
                {isTop3 ? (
                    <Ionicons name="trophy" size={16} color={rankColor} />
                ) : (
                    <Text style={[styles.rankText, { color: rankColor }]}>{entry.rank}</Text>
                )}
            </View>
            
            <Image 
                source={{ uri: entry.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${entry.name}` }} 
                style={styles.avatar} 
            />

            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                    {entry.name} {entry.isMe && '(You)'}
                </Text>
                <Text style={styles.xpLabel}>{entry.xp.toLocaleString()} XP</Text>
            </View>

            {entry.isFriend && (
                <View style={styles.friendBadge}>
                    <Ionicons name="people" size={10} color={ACCENT} />
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: SURFACE,
        borderRadius: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.02)',
    },
    isMe: {
        borderColor: 'rgba(245,158,11,0.3)',
        backgroundColor: 'rgba(245,158,11,0.05)',
    },
    rankWrap: {
        width: 30,
        alignItems: 'center',
    },
    rankText: {
        fontSize: 13,
        fontWeight: '900',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: TEXT_PRIMARY,
    },
    xpLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: TEXT_SECONDARY,
        marginTop: 2,
    },
    friendBadge: {
        backgroundColor: 'rgba(245,158,11,0.1)',
        padding: 4,
        borderRadius: 6,
    }
})
