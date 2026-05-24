import React, { useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Image } from 'react-native'
import * as Sentry from '@sentry/react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { AlertModal } from '@/components/ui/AppModal'
import SettingsRow from '@/components/ui/SettingsRow'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { logoutRevenueCat } from '@/lib/purchases'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/analytics'
import { adjustBrightness } from '@/lib/utils'
import {
    ACCENT,
    ACCENT_BORDER,
    BG,
    SURFACE,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { demoUser } from '@/lib/mockData'
import { useProfile } from '@/hooks/useProfile'
import Paywall from '@/components/premium/Paywall'
import { getAchievements } from '@/lib/focusStore'
import { ACHIEVEMENT_DEFS } from '@/lib/achievementDefs'
import AchievementCard from '@/components/rewards/AchievementCard'

function StatChip({
  icon,
  value,
  label,
}: {
  icon: string
  value: string
  label: string
}) {
  return (
    <View style={s.statChip}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

export default function ProfileScreen() {
    const insets = useSafeAreaInsets()
    const { isPremium, customerInfo } = useSubscription()
    const { data: profile } = useProfile()
    const [signOutModal, setSignOutModal] = useState(false)
    const [signingOut, setSigningOut] = useState(false)
    const [errorModal, setErrorModal] = useState<string | null>(null)
    const [showPaywall, setShowPaywall] = useState(false)
    const [achievements, setAchievements] = useState<Record<string, any>>({})
    const [loadingAchievements, setLoadingAchievements] = useState(true)

    useEffect(() => {
        const loadAchievements = async () => {
            const data = await getAchievements()
            setAchievements(data)
            setLoadingAchievements(false)
        }
        loadAchievements()
    }, [])

    const expiryMs = customerInfo?.entitlements.active['premium']?.expirationDate
    const expiryDate = expiryMs
        ? new Date(expiryMs).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : null

    async function handleSignOut() {
        setSigningOut(true)
        try {
            track('logout')
            await logoutRevenueCat()
            const { error } = await supabase.auth.signOut()
            if (error) throw error
        } catch (e: any) {
            setErrorModal(e?.message ?? 'Sign out failed. Please try again.')
        } finally {
            setSigningOut(false)
        }
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
            showsVerticalScrollIndicator={false}
        >
            <Card style={s.heroCard}>
                <View style={s.avatarWrap}>
                    <Text style={s.avatarText}>{profile?.initials ?? 'G'}</Text>
                    {isPremium && (
                        <View style={s.premiumDot}>
                            <Ionicons name="sparkles" size={10} color="#000" />
                        </View>
                    )}
                </View>

                <Text style={s.name}>{profile?.fullName ?? 'Guest Explorer'}</Text>
                <Text style={s.metaText}>{profile?.email ?? 'Unsaved Session'}</Text>
                
                <View style={s.statsRow}>
                  <StatChip icon="🔥" value={`${profile?.streak ?? 0}`} label="STREAK" />
                  <StatChip icon="⚡" value={`${profile?.xp ?? 0}`} label="TOTAL XP" />
                </View>

                {!profile ? (
                    <Pressable 
                        onPress={() => router.push('/(auth)/login')} 
                        style={[s.premiumBadge, { backgroundColor: ACCENT }]}
                    >
                        <Ionicons name="person-add" size={14} color="#000" />
                        <Text style={[s.premiumBadgeText, { color: '#000' }]}>LINK ACCOUNT</Text>
                    </Pressable>
                ) : (
                    <Pressable onPress={() => setShowPaywall(true)} style={s.premiumBadge}>
                        <Ionicons name="diamond" size={14} color={ACCENT} />
                        <Text style={s.premiumBadgeText}>{isPremium ? 'ELITE MEMBER' : 'UPGRADE TO ELITE'}</Text>
                    </Pressable>
                )}
            </Card>

            <Text style={s.sectionTitle}>Achievement Gallery</Text>
            <View style={s.achievementGrid}>
                {ACHIEVEMENT_DEFS.map(def => (
                    <AchievementCard 
                        key={def.id}
                        id={def.id}
                        title={def.title}
                        icon={def.icon}
                        unlocked={!!achievements[def.id]}
                        unlockedAt={achievements[def.id]?.unlockedAt}
                    />
                ))}
            </View>

            <Text style={s.sectionTitle}>Focus Defense</Text>
            <Card compact style={s.sectionCard}>
                <SettingsRow icon="shield-checkmark-outline" label="Simulated App Blocking" value="Active" onPress={() => {}} />
                <SettingsRow icon="notifications-outline" label="Intrusive Reminders" value="On" onPress={() => {}} />
                <SettingsRow icon="flash-outline" label="XP Decay Penalty" value="High" onPress={() => {}} last={true} />
            </Card>

            <Text style={s.sectionTitle}>Account</Text>
            <Card compact style={s.sectionCard}>
                <SettingsRow icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
                <SettingsRow icon="help-buoy-outline" label="Support" onPress={() => router.push('/support')} />
                <SettingsRow icon="document-text-outline" label="Privacy Policy" onPress={() => router.push('/privacy')} />
                <SettingsRow icon="shield-checkmark-outline" label="Terms of Service" onPress={() => router.push('/terms')} last={true} />
            </Card>

            <Pressable
                onPress={() => setSignOutModal(true)}
                disabled={signingOut}
                style={({ pressed }) => [s.signOutBtn, (pressed || signingOut) && { opacity: 0.72 }]}
            >
                <Ionicons name="log-out-outline" size={17} color="rgba(255,255,255,0.45)" />
                <Text style={s.signOutText}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
            </Pressable>

            <AlertModal
                visible={signOutModal}
                title="Sign out"
                message="You will be signed out of your account."
                buttons={[
                    { text: 'Cancel', style: 'cancel', onPress: () => setSignOutModal(false) },
                    { text: 'Sign out', style: 'destructive', onPress: () => { setSignOutModal(false); handleSignOut() } },
                ]}
                onDismiss={() => setSignOutModal(false)}
            />

            <AlertModal
                visible={!!errorModal}
                title="Error"
                message={errorModal ?? ''}
                buttons={[{ text: 'OK', onPress: () => setErrorModal(null) }]}
                onDismiss={() => setErrorModal(null)}
            />

            <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
        </ScrollView>
    )
}


const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 14 },
    heroCard: {
        overflow: 'hidden',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 16,
    },
    avatarWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 4,
    },
    logo: {
        width: 120,
        height: 60,
        marginBottom: 10,
    },
    avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
    premiumDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 999,
        backgroundColor: ACCENT,
        borderWidth: 2,
        borderColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    name: { fontSize: 24, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: -0.5 },
    metaText: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '600' },
    planCard: {
        borderWidth: 1,
        paddingVertical: 12,
    },
    planTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    planBadge: {
        width: 30,
        height: 30,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ACCENT,
    },
    planTitle: { color: ACCENT, fontSize: 14.5, fontWeight: '700' },
    planSub: { color: TEXT_SECONDARY, fontSize: 12 },
    manageBtn: {
        borderWidth: 1,
        borderColor: ACCENT_BORDER,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    manageBtnText: { color: ACCENT, fontSize: 12, fontWeight: '600' },
    upgradeCard: {
        minHeight: 66,
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
    },
    upgradeTitle: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
    upgradeSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: TEXT_TERTIARY,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 3,
        marginBottom: -4,
    },
    sectionCard: { padding: 0, overflow: 'hidden' },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingVertical: 10,
    },
    signOutText: { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '500' },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: SURFACE,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.03)',
    },
    statIcon: { fontSize: 16 },
    statValue: { fontSize: 16, fontWeight: '900', color: TEXT_PRIMARY },
    statLabel: { fontSize: 10, fontWeight: '800', color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: 0.5 },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: 'rgba(245,158,11,0.08)',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.15)',
    },
    premiumBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        color: ACCENT,
        letterSpacing: 1,
    },
    achievementGrid: {
        gap: 10,
    }
})
