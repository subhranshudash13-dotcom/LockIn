import { useState, useRef } from 'react'
import {
  View, Pressable, TextInput as RNTextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/Text'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/analytics'
import { ACCENT, ACCENT_DIM, ACCENT_BORDER, BG, SURFACE, BORDER, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { adjustBrightness } from '@/lib/utils'
import { Fonts } from '@/lib/typography'
import { usePersonalization } from '@/hooks/usePersonalization'
import { Ionicons } from '@expo/vector-icons'

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const { settings, updateSettings } = usePersonalization()

  const [step, setStep] = useState<'name' | 'goal' | 'distractions' | 'style'>('name')
  const [displayName, setDisplayName] = useState('')
  const [selectedGoal, setSelectedGoal] = useState('productivity')
  const [distractionProfile, setDistractionProfile] = useState<string[]>([])
  const [focusStyle, setFocusStyle] = useState('deep') // 'deep' | 'pomodoro'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const nameInputRef = useRef<RNTextInput>(null)

  async function complete() {
    setLoading(true)
    setError(null)

    // 1. Update personalization
    updateSettings({ focusGoal: selectedGoal })

    // 2. Update Auth metadata
    const { error: err } = await supabase.auth.updateUser({
      data: {
        onboarding_completed: true,
        full_name: displayName.trim() || undefined,
      },
    })

    if (err) {
      setLoading(false)
      setError('Could not save. Please try again.')
      return
    }

    // 3. Update Profiles table
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        await supabase
          .from('profiles')
          .upsert({ 
            id: user.id, 
            name: displayName.trim() || user.email?.split('@')[0],
            metadata: { 
                onboarding_completed: true, 
                personalization: { 
                    ...settings, 
                    focusGoal: selectedGoal,
                    distractionProfile,
                    focusStyle
                } 
            } 
          })
    }

    track('onboarding_completed', { goal: selectedGoal, style: focusStyle })
    setLoading(false)
  }

  const handleNext = () => {
    if (step === 'name') {
       if (!displayName.trim()) {
           setError('Please enter your name to continue.')
           return
       }
       setStep('goal')
    } else if (step === 'goal') {
       setStep('distractions')
    } else if (step === 'distractions') {
       setStep('style')
    } else {
       complete()
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[s.root, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 }]}>
        
        {step === 'name' ? (
          <Animated.View key="name-step" entering={FadeInDown.duration(600)} style={s.content}>
            <View style={s.header}>
              <View style={[s.iconBadge, { backgroundColor: ACCENT_DIM, borderColor: ACCENT_BORDER }]}>
                <Text style={{ fontSize: 28 }}>👋</Text>
              </View>
              <Text style={s.title}>What's your name?</Text>
              <Text style={s.subtitle}>This is how you'll be identified in the global focus leaderboard.</Text>
            </View>

            <View style={s.fieldGroup}>
              <RNTextInput
                ref={nameInputRef}
                value={displayName}
                onChangeText={(v) => { setDisplayName(v); setError(null) }}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255,255,255,0.18)"
                style={s.input}
                autoFocus
                autoCapitalize="words"
              />
            </View>
          </Animated.View>
        ) : step === 'goal' ? (
          <Animated.View key="goal-step" entering={FadeInUp.duration(600)} style={s.content}>
             <View style={s.header}>
              <View style={[s.iconBadge, { backgroundColor: ACCENT_DIM, borderColor: ACCENT_BORDER }]}>
                <Ionicons name="compass-outline" size={32} color={ACCENT} />
              </View>
              <Text style={s.title}>Define your goal</Text>
              <Text style={s.subtitle}>We'll personalize your experience based on your primary objective.</Text>
            </View>

            <View style={s.grid}>
               <GoalCard 
                  active={selectedGoal === 'productivity'} 
                  title="Peak Productivity" icon="rocket-outline" 
                  onPress={() => setSelectedGoal('productivity')}
               />
               <GoalCard 
                  active={selectedGoal === 'mental'} 
                  title="Mental Clarity" icon="leaf-outline" 
                  onPress={() => setSelectedGoal('mental')}
               />
               <GoalCard 
                  active={selectedGoal === 'coding'} 
                  title="Deep Flow" icon="code-slash-outline" 
                  onPress={() => setSelectedGoal('coding')}
               />
            </View>
          </Animated.View>
        ) : step === 'distractions' ? (
          <Animated.View key="distraction-step" entering={FadeInUp.duration(600)} style={s.content}>
             <View style={s.header}>
              <View style={[s.iconBadge, { backgroundColor: ACCENT_DIM, borderColor: ACCENT_BORDER }]}>
                <Ionicons name="shield-outline" size={32} color={ACCENT} />
              </View>
              <Text style={s.title}>Common Distractions</Text>
              <Text style={s.subtitle}>What usually breaks your focus?</Text>
            </View>
            <View style={s.grid}>
                {['Social Media', 'Video Streaming', 'Messaging', 'News'].map(d => (
                    <GoalCard 
                        key={d}
                        active={distractionProfile.includes(d)}
                        title={d}
                        icon={d === 'Social Media' ? 'logo-instagram' : d === 'Messaging' ? 'chatbubble-outline' : 'videocam-outline'}
                        onPress={() => setDistractionProfile(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                    />
                ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View key="style-step" entering={FadeInUp.duration(600)} style={s.content}>
             <View style={s.header}>
              <View style={[s.iconBadge, { backgroundColor: ACCENT_DIM, borderColor: ACCENT_BORDER }]}>
                <Ionicons name="flash-outline" size={32} color={ACCENT} />
              </View>
              <Text style={s.title}>Focus Protocol</Text>
              <Text style={s.subtitle}>How do you prefer to work?</Text>
            </View>
            <View style={s.grid}>
                <GoalCard 
                    active={focusStyle === 'deep'} 
                    title="Deep Work (Long blocks)" icon="infinite-outline" 
                    onPress={() => setFocusStyle('deep')}
                />
                <GoalCard 
                    active={focusStyle === 'pomodoro'} 
                    title="Pomodoro (25/5 breaks)" icon="timer-outline" 
                    onPress={() => setFocusStyle('pomodoro')}
                />
            </View>
          </Animated.View>
        )}

        {error && (
            <Animated.View entering={FadeIn.duration(200)} style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
            </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.footer}>
           <Pressable
              onPress={handleNext}
              disabled={loading}
              style={({ pressed }) => [s.primaryBtnWrap, pressed && { opacity: 0.8 }]}
           >
             <LinearGradient colors={[ACCENT, adjustBrightness(ACCENT, -25)]} style={s.primaryBtn}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{step === 'style' ? 'Unlock Access' : 'Next Step'}</Text>}
             </LinearGradient>
           </Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}

function GoalCard({ active, title, icon, onPress }: any) {
    return (
        <Pressable onPress={onPress} style={[s.card, active && s.cardActive]}>
            <Ionicons name={icon} size={24} color={active ? ACCENT : TEXT_TERTIARY} />
            <Text style={[s.cardTitle, active && { color: '#fff' }]}>{title}</Text>
        </Pressable>
    )
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  content: { gap: 32 },
  header: { gap: 12, alignItems: 'center' },
  iconBadge: { width: 80, height: 80, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 15, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  fieldGroup: { gap: 12 },
  input: { height: 60, backgroundColor: SURFACE, borderRadius: 18, paddingHorizontal: 20, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: BORDER },
  grid: { gap: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, padding: 20, borderRadius: 20, gap: 16, borderWidth: 1, borderColor: 'transparent' },
  cardActive: { borderColor: ACCENT, backgroundColor: 'rgba(245,158,11,0.05)' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: TEXT_SECONDARY },
  footer: { paddingBottom: 10 },
  primaryBtnWrap: { borderRadius: 18, overflow: 'hidden' },
  primaryBtn: { height: 60, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 12, marginBottom: 10 },
  errorText: { color: '#f87171', fontSize: 13, textAlign: 'center', fontWeight: '600' },
})
