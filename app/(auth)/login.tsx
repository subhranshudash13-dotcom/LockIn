import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Pressable, StyleSheet, Dimensions,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  TextInput as RNTextInput, ScrollView, DeviceEventEmitter,
} from 'react-native'
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { Text } from '@/components/ui/Text'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/analytics'
import { ACCENT, ACCENT_DIM, ACCENT_BORDER, BG, SURFACE, BORDER, ERROR, ERROR_DIM, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { APP_NAME, APP_SCHEME } from '@/lib/constants'
import { adjustBrightness } from '@/lib/utils'
import { Fonts } from '@/lib/typography'

WebBrowser.maybeCompleteAuthSession()

const { width: SW, height: SH } = Dimensions.get('window')
const DEV_ALLOW_SKIP = __DEV__

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'trashmail.com', 'trashmail.me', 'maildrop.cc',
  'mailnesia.com', 'discard.email', 'throwaway.email', 'getnada.com', 'fakeinbox.com',
  'getairmail.com', 'spam4.me', 'spamgourmet.com', 'dispostable.com', 'filzmail.com',
])

function normalizeEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase()
  const atIdx = trimmed.lastIndexOf('@')
  if (atIdx === -1) return trimmed
  const local = trimmed.slice(0, atIdx)
  const domain = trimmed.slice(atIdx + 1)
  const cleanLocal = local.split('+')[0]
  const gmailDomains = ['gmail.com', 'googlemail.com']
  const finalLocal = gmailDomains.includes(domain) ? cleanLocal.replace(/\./g, '') : cleanLocal
  return `${finalLocal}@${domain}`
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null)
  const [lockoutLeft, setLockoutLeft] = useState(0)
  const otpRefs = useRef<(RNTextInput | null)[]>([])
  const emailRef = useRef<RNTextInput>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (!lockoutEnd) return
    const tick = () => {
      const rem = Math.max(0, Math.ceil((lockoutEnd - Date.now()) / 1000))
      setLockoutLeft(rem)
      if (rem === 0) setLockoutEnd(null)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [lockoutEnd])

  const handleSendOtp = async () => {
    const normalized = normalizeEmail(email)
    if (!normalized || !normalized.includes('@') || !normalized.includes('.')) {
      setError('Enter a valid email address')
      return
    }
    const domain = normalized.split('@')[1]
    if (DISPOSABLE_DOMAINS.has(domain)) {
      setError('Temporary email addresses are not allowed.')
      return
    }
    setLoading(true); setError(null)
    track('login_started')
    const { error: err } = await supabase.auth.signInWithOtp({ email: normalized })
    setLoading(false)
    if (err) { setError(err.message); return }
    track('otp_sent')
    setStep('otp')
    setCooldown(60)
    setTimeout(() => otpRefs.current[0]?.focus(), 300)
  }

  const handleVerifyOtp = useCallback(async (code: string) => {
    if (code.length < 6) return
    if (lockoutEnd && Date.now() < lockoutEnd) {
      setError(`Too many attempts. Wait ${Math.ceil((lockoutEnd - Date.now()) / 60000)} minute(s).`)
      return
    }
    setLoading(true); setError(null)
    const { error: err } = await supabase.auth.verifyOtp({
      email: normalizeEmail(email),
      token: code,
      type: 'email',
    })
    setLoading(false)
    if (err) {
      const next = failedAttempts + 1
      setFailedAttempts(next)
      if (next >= 5) {
        setLockoutEnd(Date.now() + 15 * 60 * 1000)
        setError('Too many failed attempts. Please wait 15 minutes.')
      } else {
        setError(`Invalid code. ${5 - next} attempt${5 - next === 1 ? '' : 's'} left.`)
      }
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
      return
    }
    track('login_success')
  }, [email, lockoutEnd, failedAttempts])

  const handleOtpChange = (val: string, index: number) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
    const code = next.join('')
    if (code.length === 6 && !next.includes('')) handleVerifyOtp(code)
  }

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const next = [...otp]
      next[index - 1] = ''
      setOtp(next)
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setLoading(true); setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({ email: normalizeEmail(email) })
    setLoading(false)
    if (err) { setError(err.message); return }
    setCooldown(60)
    setOtp(['', '', '', '', '', ''])
    setTimeout(() => otpRefs.current[0]?.focus(), 50)
  }

  const goBack = () => {
    setStep('email'); setOtp(['', '', '', '', '', ''])
    setError(null); setFailedAttempts(0); setLockoutEnd(null)
    setTimeout(() => emailRef.current?.focus(), 150)
  }

  const handleDevSkip = () => {
    DeviceEventEmitter.emit('__dev_skip_auth__')
  }

  async function handleOAuthLogin(provider: 'google' | 'apple') {
    setLoading(true)
    setError(null)
    try {
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: APP_SCHEME,
        path: 'auth-callback',
      })

      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo, 
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' }
        },
      })
      if (err) throw err
      if (!data.url) throw new Error('No OAuth URL returned from Supabase.')

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      
      if (result.type === 'cancel') {
        setLoading(false)
        return // user dismissed — not an error
      }

      if (result.type === 'success' && result.url) {
        // Handle both PKCE (code in query) and implicit (token in fragment)
        const url = result.url
        const parsedUrl = new URL(url)
        if (url.includes('#')) {
          // Implicit flow: extract access_token and refresh_token from hash fragment
          const hash = parsedUrl.hash
          const params = new URLSearchParams(hash.substring(1))
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          if (!access_token || !refresh_token) {
            throw new Error('No session tokens found in URL fragment.')
          }
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })
          if (sessionErr) throw sessionErr
        } else {
          // PKCE flow: extract code from query params
          const code = parsedUrl.searchParams.get('code')
          if (!code) {
            throw new Error('No authorization code found in redirect URL.')
          }
          const { error: sessionErr } = await supabase.auth.exchangeCodeForSession(code)
          if (sessionErr) throw sessionErr
        }
        // Auth state change listener in _layout.tsx handles navigation automatically
        track('google_login_success', { provider })
      } else {
        track('google_login_failed', { provider, error: 'Sign-in not completed' })
        throw new Error('Sign-in was not completed. Please try again.')
      }

    } catch (e: any) {
      console.warn('[OAuth]', provider, e?.message)
      track('google_login_error', { provider, error: e?.message })
      if (e?.message?.includes('provider is not enabled') || e?.status === 400) {
        setError(`${provider === 'google' ? 'Google' : 'Apple'} login is not enabled yet. Contact support.`)
      } else if (e?.message?.includes('cancelled') || e?.message?.includes('cancel')) {
        setError(null) // user cancelled, silently ignore
      } else {
        setError(e?.message ?? `${provider === 'google' ? 'Google' : 'Apple'} sign-in failed. Please try again.`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.root}>
      {/* Background Hints */}
      <View style={s.aura} pointerEvents="none">
          <LinearGradient
              colors={[`${ACCENT}00`, `${ACCENT}08`, `${ACCENT}00`]}
              style={StyleSheet.absoluteFillObject}
          />
      </View>

      <Pressable onPress={() => router.back()} style={[s.backBtn, { top: insets.top + 14 }]} hitSlop={14}>
        <Ionicons name="arrow-back" size={24} color={TEXT_TERTIARY} />
      </Pressable>

      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[s.form, { paddingTop: insets.top + 100, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.duration(800)} style={s.header}>
            <View style={s.logoDot} />
            <Text style={s.title}>{step === 'email' ? 'Identification' : 'Verification'}</Text>
            <Text style={s.sub}>
              {step === 'email' 
                ? 'Join the elite focusers. Enter your email to begin.' 
                : `We've sent a 6-digit code to ${email}`}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={s.stepWrap}>
            {step === 'email' ? (
              <View style={s.inputGroup}>
                <Text style={s.label}>Email Address</Text>
                <RNTextInput
                  ref={emailRef}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(null) }}
                  placeholder="you@resolute.com"
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  style={[s.input, error ? s.inputErr : null]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
            ) : (
                <View style={s.otpRow}>
                  {otp.map((digit, i) => (
                    <RNTextInput
                      key={i}
                      ref={(r) => { otpRefs.current[i] = r }}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, i)}
                      onKeyPress={(e) => handleOtpKeyPress(e, i)}
                      style={[s.otpBox, digit ? s.otpBoxActive : null]}
                      keyboardType="number-pad"
                      maxLength={1}
                      caretHidden
                      editable={!loading}
                    />
                  ))}
                </View>
            )}

            {error && (
              <Animated.View entering={FadeIn.duration(200)} style={s.errorBox}>
                 <Ionicons name="alert-circle" size={16} color={ERROR} />
                 <Text style={s.errorText}>{error}</Text>
              </Animated.View>
            )}

            <Pressable
              onPress={step === 'email' ? handleSendOtp : () => handleVerifyOtp(otp.join(''))}
              disabled={loading || (step === 'email' ? !email.trim() : otp.includes(''))}
              style={({ pressed }) => [s.primaryBtn, pressed && { transform: [{ scale: 0.98 }] }, (loading || (step === 'email' ? !email.trim() : otp.includes(''))) && { opacity: 0.5 }]}
            >
              <LinearGradient
                colors={[ACCENT, '#2563EB']}
                style={s.btnGrad}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                   <>
                    <Text style={s.btnText}>{step === 'email' ? 'Get Started' : 'Verify Identity'}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                   </>
                )}
              </LinearGradient>
            </Pressable>

            {step === 'email' && (
              <View style={s.social}>
                <View style={s.divider}>
                   <View style={s.line} />
                   <Text style={s.dividerText}>OR SECURE LOGIN</Text>
                   <View style={s.line} />
                </View>

                <View style={s.socialRow}>
                   <Pressable onPress={() => handleOAuthLogin('google')} style={s.socialBtn}>
                      <Ionicons name="logo-google" size={20} color={TEXT_SECONDARY} />
                   </Pressable>
                   <Pressable onPress={() => handleOAuthLogin('apple')} style={s.socialBtn}>
                      <Ionicons name="logo-apple" size={20} color={TEXT_SECONDARY} />
                   </Pressable>
                </View>
              </View>
            )}

            {step === 'otp' && (
                <View style={s.otpMeta}>
                    <Pressable onPress={handleResend} disabled={cooldown > 0}>
                        <Text style={[s.otpLink, cooldown > 0 && { opacity: 0.4 }]}>
                           {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                        </Text>
                    </Pressable>
                    <Pressable onPress={goBack}>
                        <Text style={s.otpLinkSecondary}>Change Email</Text>
                    </Pressable>
                </View>
            )}
          </Animated.View>

          {DEV_ALLOW_SKIP && (
              <Pressable onPress={handleDevSkip} style={s.devSkip}>
                  <Text style={s.devSkipText}>Skip to Tabs (Development Mode)</Text>
              </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  aura: { position: 'absolute', top: -SH * 0.1, left: -SW * 0.2, width: SW * 1.4, height: SH * 0.4, opacity: 0.6 },
  backBtn: { position: 'absolute', left: SW * 0.06, zIndex: 100 },
  kav: { flex: 1 },
  form: { paddingHorizontal: SW * 0.08, flexGrow: 1 },
  header: { marginBottom: 40, gap: 8 },
  logoDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: -1 },
  sub: { fontSize: 16, color: TEXT_SECONDARY, lineHeight: 24, maxWidth: '90%' },

  stepWrap: { gap: 24 },
  inputGroup: { gap: 10 },
  label: { fontSize: 12, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    height: 60,
    backgroundColor: SURFACE,
    borderRadius: 18,
    paddingHorizontal: 20,
    color: TEXT_PRIMARY,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputErr: { borderColor: `${ERROR}44` },

  primaryBtn: { borderRadius: 18, overflow: 'hidden' },
  btnGrad: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  otpBox: {
      flex: 1, height: 60, backgroundColor: SURFACE, borderRadius: 16,
      color: TEXT_PRIMARY, fontSize: 24, fontWeight: '800', textAlign: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  otpBoxActive: { borderColor: ACCENT, backgroundColor: 'rgba(59,130,246,0.05)' },
  otpMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
  otpLink: { color: ACCENT, fontWeight: '700', fontSize: 14 },
  otpLinkSecondary: { color: TEXT_TERTIARY, fontWeight: '600', fontSize: 14 },

  errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: 'rgba(239,68,68,0.05)', padding: 12, borderRadius: 12,
  },
  errorText: { color: ERROR, fontSize: 13, fontWeight: '600' },

  social: { gap: 24, marginTop: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  dividerText: { fontSize: 10, fontWeight: '800', color: TEXT_TERTIARY, letterSpacing: 1 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
      flex: 1, height: 56, backgroundColor: SURFACE, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  devSkip: { alignSelf: 'center', marginTop: 40 },
  devSkipText: { color: TEXT_TERTIARY, fontSize: 12, textDecorationLine: 'underline' },
})
