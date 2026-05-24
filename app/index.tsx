import { useEffect, useState, useMemo } from 'react'
import { View, Pressable, StyleSheet, Dimensions, Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ACCENT, BG, SURFACE, SURFACE2, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/lib/constants'
import { getTodayLog, getProfile, seedDemoData } from '@/lib/focusStore'

const { width: SW, height: SH } = Dimensions.get('window')

export default function LandingScreen() {
    const insets = useSafeAreaInsets()
    const [hoursSaved, setHoursSaved] = useState(203865)
    const [todayMins, setTodayMins] = useState(0)

    useEffect(() => {
        async function fetchStats() {
            const log = await getTodayLog()
            setTodayMins(log.focusMinutes)
            
            // For Demo: Seed if fresh
            if (log.focusMinutes === 0) {
              await seedDemoData()
              const updated = await getTodayLog()
              setTodayMins(updated.focusMinutes)
            }
        }
        fetchStats()

        const interval = setInterval(() => {
            setHoursSaved(prev => prev + Math.floor(Math.random() * 2))
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    const handleEnterApp = () => {
        // Shared-element-like transition: quick fade out then replace
        router.replace('/(tabs)')
    }

    return (
        <View style={s.root}>
            <LinearGradient
                colors={['#000', '#080808']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Top Navigation */}
            <Animated.View 
                entering={FadeInDown.duration(800).delay(100)}
                style={[s.header, { paddingTop: insets.top + 20 }]}
            >
                <View style={s.logoAndTitle}>
                    <BrandLogo size={32} />
                    <Text style={s.logo}>{APP_NAME}</Text>
                </View>
                
                <View style={s.navLinks}>
                    <Pressable onPress={() => router.push('/(tabs)')}>
                        <Text style={s.navLink}>Features</Text>
                    </Pressable>
                </View>

                <Pressable
                    onPress={handleEnterApp}
                    style={({ pressed }) => [s.navCta, pressed && { opacity: 0.8 }]}
                >
                    <Text style={s.navCtaText}>Try for free</Text>
                </Pressable>
            </Animated.View>

            <ScrollView 
                contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 60 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={s.mainHero}>
                    {/* Device Mockup Section */}
                    <Animated.View 
                        entering={FadeIn.duration(1200).delay(400)}
                        style={s.mockupContainer}
                    >
                        <DeviceMockup />
                    </Animated.View>

                    {/* Content Section */}
                    <View style={s.heroContent}>
                        <Animated.View entering={FadeInDown.duration(800).delay(300)} style={s.socialProof}>
                            <View style={s.badge}>
                                <Ionicons name="sparkles" size={14} color={ACCENT} />
                                <View>
                                    <Text style={s.badgeCategory}>ELITE</Text>
                                    <Text style={s.badgeTitle}>Focus Infrastructure</Text>
                                </View>
                            </View>
                            <View style={s.rating}>
                                <Text style={s.ratingVal}>4.9/5.0</Text>
                                <View style={s.stars}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Ionicons key={i} name="star" size={12} color="#FFD700" />
                                    ))}
                                </View>
                                <Text style={s.ratingCount}>CRYSTAL QUALITY</Text>
                            </View>
                        </Animated.View>

                        <Animated.Text entering={FadeInDown.duration(800).delay(450)} style={s.heroTitle}>
                            {APP_TAGLINE}
                        </Animated.Text>
                        
                        <Animated.Text entering={FadeInDown.duration(800).delay(550)} style={s.heroSub}>
                            {APP_DESCRIPTION}
                        </Animated.Text>

                        <Animated.View entering={FadeInUp.duration(800).delay(700)} style={s.ctaGroup}>
                            <Pressable 
                                onPress={handleEnterApp}
                                style={({ pressed }) => [s.ctaBtn, s.ctaPrimary, pressed && { opacity: 0.8 }]}
                            >
                                <Text style={s.ctaPrimaryText}>Begin Your Session</Text>
                                <Ionicons name="flash" size={18} color="#000" />
                            </Pressable>

                            <Pressable 
                                onPress={() => router.push('/(auth)/login')}
                                style={({ pressed }) => [s.ctaBtn, s.ctaOutline, pressed && { opacity: 0.7 }]}
                            >
                                <Text style={s.ctaBtnText}>Sign In</Text>
                                <Ionicons name="person-outline" size={18} color="#fff" />
                            </Pressable>
                        </Animated.View>
                    </View>
                </View>

                {/* Methodology / How it Works Section */}
                <Animated.View entering={FadeInUp.delay(1200)} style={s.methodology}>
                    <Text style={s.sectionLabel}>THE METHODOLOGY</Text>
                    <Text style={s.sectionTitle}>How LockIn Works</Text>
                    
                    <View style={s.stepGrid}>
                        <StepCard 
                            icon="flash" 
                            title="Set Your Purpose" 
                            desc="Define your 'One Thing' for the day and lock away digital noise."
                        />
                        <StepCard 
                            icon="eye" 
                            title="Visual Immersion" 
                            desc="Enter a cinematic flow state designed to keep your focus centered."
                        />
                        <StepCard 
                            icon="stats-chart" 
                            title="Dopamine Logging" 
                            desc="Watch your progress materialize through high-fidelity behavioral tracking."
                        />
                        <StepCard 
                            icon="ribbon" 
                            title="Ascend Tiers" 
                            desc="Gain XP and prestige as you master your attention span."
                        />
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Counter at the bottom */}
            <Animated.View 
                entering={FadeInUp.duration(800).delay(1000)}
                style={[s.footer, { paddingBottom: Math.max(20, insets.bottom) }]}
            >
                <View style={s.counterPill}>
                    <Text style={s.counterText}>
                        <Text style={s.counterBold}>{hoursSaved.toLocaleString()}</Text> hours saved with {APP_NAME}
                    </Text>
                </View>
            </Animated.View>
        </View>
    )
}

function DeviceMockup() {
    // Dynamic time logic (mocking for layout)
    return <DeviceMockupContent />
}

function DeviceMockupContent() {
    const [mins, setMins] = useState(0)
    
    useEffect(() => {
        getTodayLog().then(log => setMins(log.focusMinutes))
    }, [])

    const hr = Math.floor(mins / 60)
    const m = mins % 60

    return (
        <View style={s.mockup}>
            <LinearGradient colors={['#1a1a1a', '#0d0d0d']} style={s.mockupFrame}>
                <View style={s.mockupScreen}>
                    {/* Simplified focus screen represention */}
                    <View style={s.mockupNotch} />
                    <View style={s.mockupHeader}>
                        <Text style={s.mockupTime}>20:47</Text>
                        <Ionicons name="lock-closed" size={14} color="#fff" />
                    </View>
                    
                    <View style={s.mockupContent}>
                          <View style={s.mockupLogoSection}>
                             <BrandLogo size={64} />
                          </View>
                          <Text style={s.mockupFocusVal}>{hr}h {m}m</Text>
                          <Text style={s.mockupSub}>TODAY'S FOCUS TIME</Text>

                          <View style={s.mockupStats}>
                             <View style={[s.mockupBar, { height: 40 }]} />
                             <View style={[s.mockupBar, { height: 60 }]} />
                             <View style={[s.mockupBar, { height: 80, backgroundColor: ACCENT }]} />
                             <View style={[s.mockupBar, { height: 50, backgroundColor: ACCENT, opacity: 0.8 }]} />
                             <View style={[s.mockupBar, { height: 20 }]} />
                          </View>
                          <Text style={s.mockupStatLabel}>Active Dopamine Shield</Text>
                     </View>
                 </View>
             </LinearGradient>
         </View>
     )
 }

 function StepCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <View style={s.stepCard}>
            <View style={s.stepIconWrap}>
                 <Ionicons name={icon} size={24} color={ACCENT} />
            </View>
            <Text style={s.stepTitle}>{title}</Text>
            <Text style={s.stepDesc}>{desc}</Text>
        </View>
    )
 }

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        zIndex: 100,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    logoAndTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logo: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    navLinks: { 
        flexDirection: 'row', 
        gap: 24,
        display: Platform.OS === 'web' && SW > 600 ? 'flex' : 'none'
    },
    navLink: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
    navCta: {
        backgroundColor: ACCENT,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
    },
    navCtaText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

    scroll: { paddingTop: 140, paddingHorizontal: 24 },
    mainHero: { 
        flexDirection: Platform.OS === 'web' && SW > 800 ? 'row' : 'column',
        alignItems: 'center',
        gap: 60,
    },
    mockupContainer: { flex: 1, alignItems: 'center' },
    heroContent: { flex: 1, gap: 20 },

    socialProof: { flexDirection: 'row', alignItems: 'center', gap: 30 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badgeCategory: { fontSize: 10, fontWeight: '900', color: ACCENT, letterSpacing: 1 },
    badgeTitle: { fontSize: 13, fontWeight: '800', color: '#fff' },
    rating: { gap: 4 },
    ratingVal: { fontSize: 18, fontWeight: '900', color: '#fff' },
    stars: { flexDirection: 'row', gap: 2 },
    ratingCount: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },

    heroTitle: { fontSize: SW > 600 ? 72 : 44, fontWeight: '900', color: '#fff', letterSpacing: -2, lineHeight: SW > 600 ? 80 : 48 },
    heroSub: { fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 28, maxWidth: 500 },

    ctaGroup: { flexDirection: 'row', gap: 16, marginTop: 10 },
    ctaBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 12,
        height: 58,
        borderRadius: 29,
        paddingHorizontal: 24,
        flex: 1,
    },
    ctaOutline: { 
        borderWidth: 1.5, 
        borderColor: 'rgba(245,158,11,0.3)', 
        backgroundColor: 'rgba(245,158,11,0.02)' 
    },
    ctaPrimary: { backgroundColor: ACCENT }, 
    ctaBtnText: { color: TEXT_SECONDARY, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    ctaPrimaryText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    footer: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: 'transparent',
    },
    counterPill: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    counterText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 0.5 },
    counterBold: { color: '#fff', fontWeight: '800' },

    // Methodology Styles
    methodology: {
        marginTop: 100,
        paddingBottom: 100,
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: ACCENT,
        letterSpacing: 2.5,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
        marginBottom: 40,
        textAlign: 'center',
    },
    stepGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        justifyContent: 'center',
    },
    stepCard: {
        width: SW > 600 ? '45%' : '100%',
        backgroundColor: '#080808',
        padding: 32,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        gap: 16,
    },
    stepIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(245,158,11,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
    },
    stepDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        lineHeight: 22,
    },

    // Device Mockup Styles
// ... (rest of mockup styles)
    mockup: {
        width: 280,
        height: 580,
        borderRadius: 44,
        padding: 8,
        backgroundColor: '#1a1a1a',
    },
    mockupFrame: {
        flex: 1,
        borderRadius: 36,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#2a2a2a',
    },
    mockupScreen: { flex: 1, padding: 16 },
    mockupNotch: {
        width: 80,
        height: 20,
        backgroundColor: '#000',
        alignSelf: 'center',
        borderRadius: 10,
        marginBottom: 10,
    },
    mockupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mockupTime: { color: '#fff', fontSize: 12, fontWeight: '700' },
    mockupContent: { flex: 1, alignItems: 'center', paddingTop: 60 },
    mockupLogoSection: {
        marginBottom: 30,
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    mockupFocusVal: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    mockupSub: { fontSize: 11, fontWeight: '800', color: ACCENT, letterSpacing: 1 },
    mockupStats: { 
        flexDirection: 'row', 
        alignItems: 'flex-end', 
        gap: 8, 
        marginTop: 40,
        height: 80,
    },
    mockupBar: { width: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.05)' },
    mockupStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 12, fontWeight: '600' },
})
