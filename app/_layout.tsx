import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Platform, DeviceEventEmitter } from 'react-native'
import { Stack, useNavigationContainerRef, usePathname } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import * as Sentry from '@sentry/react-native'

const routingInstrumentation = Sentry.reactNavigationIntegration()

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  environment: __DEV__ ? 'development' : 'production',
  enabled: true,
  integrations: [routingInstrumentation],
  tracesSampleRate: 0,
})

import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter'
import { ThemeProvider, DarkTheme } from '@react-navigation/native'
import { PostHogProvider } from 'posthog-react-native'
import { I18nextProvider } from 'react-i18next'

import { supabase, isSupabaseEnabled } from '@/lib/supabase'
import { posthog, isPostHogEnabled, identify, resetIdentity, track } from '@/lib/analytics'
import { configureRevenueCat, loginRevenueCat, logoutRevenueCat } from '@/lib/purchases'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'
import { ToastProvider } from '@/contexts/ToastContext'
import i18n, { initI18n } from '@/lib/i18n'
import OfflineBanner from '@/components/OfflineBanner'
import OfflineOverlay from '@/components/OfflineOverlay'
import { Text } from '@/components/ui/Text'
import { BG } from '@/lib/theme'
import { useLockInStore } from '@/lib/useLockInStore'

// ─── Error boundary ───────────────────────────────────────────────────────────
// React requires a class component to catch render errors — hooks cannot do this.

function ErrorFallback() {
  return (
    <View style={eb.container}>
      <Text style={eb.title}>Something went wrong</Text>
      <Text style={eb.subtitle}>Please close and reopen the app.</Text>
    </View>
  )
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info)
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  }

  render() {
    if (this.state.hasError) return <ErrorFallback />
    return this.props.children
  }
}

const eb = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
})

// ─── Theme ────────────────────────────────────────────────────────────────────

const customDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: BG },
}

// ─── Conditional PostHog provider ─────────────────────────────────────────────
// PostHogProvider requires a valid client instance. When the API key is missing
// we skip the provider entirely so no errors are thrown.

function MaybePostHogProvider({ children }: { children: React.ReactNode }) {
  if (isPostHogEnabled && posthog) {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
  }
  return <>{children}</>
}

// ─── Screen tracking ─────────────────────────────────────────────────────────
// Rendered inside the navigator so usePathname has routing context.

function ScreenTracker() {
  const pathname = usePathname()
  useEffect(() => {
    track('screen_viewed', { screen: pathname })
  }, [pathname])
  return null
}

// ─── Root layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  const navigationRef = useNavigationContainerRef()
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  })

  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const setSession = useLockInStore((state) => state.setSession)
  const [i18nReady, setI18nReady] = useState(false)

  useEffect(() => {
    initI18n().then(() => setI18nReady(true))
  }, [])

  useEffect(() => {
    if (navigationRef.current) {
      routingInstrumentation.registerNavigationContainer(navigationRef)
    }
  }, [navigationRef])

  useEffect(() => {
    // Configure RevenueCat once at startup, before any user is known
    configureRevenueCat()

    if (!isSupabaseEnabled) {
      // No credentials — stay on landing page, no errors thrown
      setIsAuthed(false)
      return
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const authed = !!session
        setIsAuthed(authed)
        
        if (session?.user) {
          setSession(session)
          setOnboardingCompleted(session.user.user_metadata?.onboarding_completed === true)
          loginRevenueCat(session.user.id)
          identify(session.user.id, session.user.email ? { email: session.user.email } : undefined)
        } else {
          setSession(null)
          setOnboardingCompleted(null)
        }
      } catch (err) {
        console.warn('[Auth] Session check failed:', err)
        setIsAuthed(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] Event: ${event}`)
      const authed = !!session
      setIsAuthed(authed)

      if (authed && session?.user) {
        setSession(session)
        setOnboardingCompleted(session.user.user_metadata?.onboarding_completed === true)
        loginRevenueCat(session.user.id)
        identify(session.user.id, session.user.email ? { email: session.user.email } : undefined)
      } else {
        setSession(null)
        setOnboardingCompleted(null)
        logoutRevenueCat()
        resetIdentity()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!__DEV__) return
    const sub = DeviceEventEmitter.addListener('__dev_skip_auth__', () => {
      setIsAuthed(true)
      setOnboardingCompleted(true)
    })
    return () => sub.remove()
  }, [])

  // Show blank dark screen while session + i18n checks complete.
  // This prevents a flash of wrong content on launch.
  if (!fontsLoaded || isAuthed === null || !i18nReady || (isAuthed === true && onboardingCompleted === null)) {
    return <View style={{ flex: 1, backgroundColor: BG }} />
  }

  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <MaybePostHogProvider>
          <QueryClientProvider client={queryClient}>
          <SubscriptionProvider>
            <ToastProvider>
            <SafeAreaProvider>
              <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG }}>
                <BottomSheetModalProvider>
                  <StatusBar
                    style="light"
                    translucent={Platform.OS === 'android'}
                    backgroundColor={Platform.OS === 'android' ? BG : undefined}
                  />
                  <ThemeProvider value={customDarkTheme}>
                    <View style={{ flex: 1, backgroundColor: BG }}>
                      <Stack ref={navigationRef} screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: BG } }}>
                        {/* ── Landing & Auth ── */}
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />

                        {/* ── Onboarding ── */}
                        {isAuthed && onboardingCompleted === false && (
                          <Stack.Screen name="(onboarding)" />
                        )}

                        {/* ── Infrastructure ── */}
                        <Stack.Screen name="upgrade" />
                        <Stack.Screen name="privacy" />
                        <Stack.Screen name="terms" />
                        <Stack.Screen name="settings" />
                        <Stack.Screen name="support" />

                        {/* ── Main App ── */}
                        {isAuthed && onboardingCompleted === true && (
                          <Stack.Screen name="(tabs)" />
                        )}
                      </Stack>
                      <ScreenTracker />
                      <OfflineBanner />
                      <OfflineOverlay />
                    </View>
                  </ThemeProvider>
                </BottomSheetModalProvider>
              </GestureHandlerRootView>
            </SafeAreaProvider>
            </ToastProvider>
          </SubscriptionProvider>
          </QueryClientProvider>
        </MaybePostHogProvider>
      </I18nextProvider>
    </ErrorBoundary>
  )
}

export default Sentry.wrap(RootLayout)
