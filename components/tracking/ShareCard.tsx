/**
 * ShareCard.tsx
 * A self-contained weekly stats card designed to be screenshot-shared.
 */

import React from 'react'
import { View, StyleSheet, Pressable, Share } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Text } from '@/components/ui/Text'
import { scoreTier } from '@/lib/focusStore'
import { ACCENT, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'

interface ShareCardProps {
  totalFocusMins: number
  totalSessions: number
  streak: number
  score: number
  savedHours: number  // vs last week
  weekLabel: string
}

export default function ShareCard({
  totalFocusMins,
  totalSessions,
  streak,
  score,
  savedHours,
  weekLabel,
}: ShareCardProps) {
  const tier = scoreTier(score)

  const handleShare = async () => {
    const hours = Math.floor(totalFocusMins / 60)
    const mins = totalFocusMins % 60
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    const msg =
      `🔒 LockIn Weekly Report — ${weekLabel}\n` +
      `\n⏱ Focus Time: ${timeStr}` +
      `\n🎯 Sessions: ${totalSessions}` +
      `\n🔥 Streak: ${streak} days` +
      `\n📊 Score: ${score}/100 ${tier.emoji} ${tier.label}` +
      (savedHours > 0 ? `\n✨ Saved ${savedHours}h vs last week` : '') +
      `\n\nLock in with me → LockIn app`
    await Share.share({ message: msg })
  }

  const hours = Math.floor(totalFocusMins / 60)
  const mins = totalFocusMins % 60

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#0d1a1a', '#0a0a0a']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>LockIn</Text>
            <Text style={styles.weekLabel}>{weekLabel}</Text>
          </View>
          <View style={[styles.scorePill, { borderColor: tier.color + '66', backgroundColor: tier.color + '22' }]}>
            <Text style={[styles.scoreText, { color: tier.color }]}>{score}</Text>
            <Text style={styles.scoreSub}>/100</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <Stat icon="⏱️" value={hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} label="Focus Time" />
          <Stat icon="🎯" value={`${totalSessions}`} label="Sessions" />
          <Stat icon="🔥" value={`${streak}d`} label="Streak" />
          <Stat icon={tier.emoji} value={tier.label} label="Tier" color={tier.color} />
        </View>

        {/* Saved hours badge */}
        {savedHours > 0 && (
          <View style={styles.savedBadge}>
            <Text style={styles.savedText}>✨ Saved {savedHours}h vs last week</Text>
          </View>
        )}

        {/* Teal accent bar */}
        <View style={styles.accentBar} />
      </LinearGradient>

      {/* Share button */}
      <Pressable
        style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.8 }]}
        onPress={handleShare}
      >
        <LinearGradient
          colors={['#0ea5a4', '#5eead4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shareBtnGrad}
        >
          <Text style={styles.shareBtnText}>Share My Week 🔗</Text>
        </LinearGradient>
      </Pressable>
    </View>
  )
}

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: string
  value: string
  label: string
  color?: string
}) {
  return (
    <View style={statStyles.item}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={[statStyles.value, color ? { color } : {}]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  )
}

const statStyles = StyleSheet.create({
  item: { alignItems: 'center', gap: 3, flex: 1 },
  icon: { fontSize: 18 },
  value: { fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.4 },
  label: { fontSize: 10, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 0.4 },
})

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(14,165,164,0.25)',
  },
  gradient: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appName: {
    fontSize: 18,
    fontWeight: '900',
    color: ACCENT,
    letterSpacing: -0.5,
  },
  weekLabel: { fontSize: 12, color: TEXT_SECONDARY },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  scoreText: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  scoreSub: { fontSize: 11, color: TEXT_SECONDARY },
  statsGrid: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
  },
  savedBadge: {
    backgroundColor: 'rgba(14,165,164,0.12)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(14,165,164,0.25)',
  },
  savedText: { fontSize: 13, color: '#5eead4', fontWeight: '600' },
  accentBar: {
    height: 3,
    backgroundColor: ACCENT,
    borderRadius: 2,
    opacity: 0.6,
  },
  shareBtn: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  shareBtnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0d0d0d',
    letterSpacing: -0.2,
  },
})
