/**
 * AchievementGrid.tsx
 * 3-column grid of achievement badges — locked/unlocked states.
 */

import React, { useState } from 'react'
import { View, StyleSheet, Pressable, Modal } from 'react-native'
import { BlurView } from 'expo-blur'
import { Text } from '@/components/ui/Text'
import { ACHIEVEMENT_DEFS, RARITY_COLORS, AchievementDef } from '@/lib/achievementDefs'
import { AchievementState } from '@/lib/focusStore'
import {
  ACCENT,
  ACCENT_BORDER,
  SURFACE,
  SURFACE2,
  SURFACE3,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/lib/theme'

interface AchievementGridProps {
  achievements: AchievementState
}

export default function AchievementGrid({ achievements }: AchievementGridProps) {
  const [selected, setSelected] = useState<AchievementDef | null>(null)
  const selectedState = selected ? achievements[selected.id] : null

  const unlockedCount = ACHIEVEMENT_DEFS.filter((a) => achievements[a.id]?.unlocked).length

  return (
    <>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.count}>
            {unlockedCount}/{ACHIEVEMENT_DEFS.length}
          </Text>
        </View>

        <View style={styles.grid}>
          {ACHIEVEMENT_DEFS.map((def) => {
            const unlocked = achievements[def.id]?.unlocked ?? false
            return (
              <Pressable
                key={def.id}
                style={({ pressed }) => [
                  styles.badge,
                  unlocked && styles.badgeUnlocked,
                  unlocked && { borderColor: RARITY_COLORS[def.rarity] + '66' },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setSelected(def)}
              >
                {unlocked ? (
                  <>
                    <Text style={styles.badgeIcon}>{def.icon}</Text>
                    <Text style={styles.badgeTitle} numberOfLines={2}>{def.title}</Text>
                    <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[def.rarity] }]} />
                  </>
                ) : (
                  <>
                    <Text style={styles.lockedIcon}>🔒</Text>
                    <Text style={styles.badgeTitleLocked} numberOfLines={2}>???</Text>
                  </>
                )}
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Detail bottom sheet */}
      <Modal visible={!!selected} transparent animationType="slide" statusBarTranslucent>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
          <View style={styles.sheet}>
            {selected && (
              <>
                <Text style={styles.sheetIcon}>
                  {selectedState?.unlocked ? selected.icon : '🔒'}
                </Text>
                <Text style={styles.sheetTitle}>{selected.title}</Text>
                <Text style={styles.sheetDesc}>{selected.description}</Text>
                <View style={styles.sheetMeta}>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaText}>
                      ⚡ {selected.xpReward} XP
                    </Text>
                  </View>
                  <View style={[styles.metaChip, { borderColor: RARITY_COLORS[selected.rarity] + '66' }]}>
                    <Text style={[styles.metaText, { color: RARITY_COLORS[selected.rarity] }]}>
                      {selected.rarity.charAt(0).toUpperCase() + selected.rarity.slice(1)}
                    </Text>
                  </View>
                </View>
                {selectedState?.unlocked && selectedState.unlockedAt && (
                  <Text style={styles.unlockedAt}>
                    Unlocked {new Date(selectedState.unlockedAt).toLocaleDateString()}
                  </Text>
                )}
                {!selectedState?.unlocked && (
                  <Text style={styles.lockedHint}>Complete the condition to unlock this badge.</Text>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_TERTIARY,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  count: { fontSize: 12, color: TEXT_TERTIARY },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    width: '30%',
    aspectRatio: 0.85,
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
  },
  badgeUnlocked: {
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  badgeIcon: { fontSize: 28 },
  lockedIcon: { fontSize: 22, opacity: 0.25 },
  badgeTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 13,
  },
  badgeTitleLocked: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.15)',
    textAlign: 'center',
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  sheetIcon: { fontSize: 52 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 },
  sheetDesc: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 20 },
  sheetMeta: { flexDirection: 'row', gap: 10 },
  metaChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: SURFACE2,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  metaText: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY },
  unlockedAt: { fontSize: 12, color: TEXT_TERTIARY },
  lockedHint: { fontSize: 12, color: TEXT_TERTIARY, textAlign: 'center' },
})
