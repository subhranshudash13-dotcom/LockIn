/**
 * SubscriptionGate.tsx
 * A component that wraps premium features and shows a blur/lock 
 * if the user is not a premium subscriber.
 */

import React, { useState, useEffect, PropsWithChildren } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Lock } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import Paywall from './Paywall'
import { isPremiumUser } from '@/lib/focusStore'
import { ACCENT, SURFACE2, TEXT_SECONDARY } from '@/lib/theme'

interface SubscriptionGateProps {
  fallbackMessage?: string
}

export default function SubscriptionGate({ children, fallbackMessage }: PropsWithChildren<SubscriptionGateProps>) {
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    isPremiumUser().then(setIsPremium)
  }, [])

  if (isPremium === null) return null // loading state

  if (isPremium) return <>{children}</>

  return (
    <View style={styles.container}>
      <View style={styles.lockedContent} pointerEvents="none">
        {children}
      </View>
      
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.lockCircle}>
          <Lock color={ACCENT} size={24} fill={ACCENT} />
        </View>
        <Text style={styles.lockTitle}>Premium Feature</Text>
        <Text style={styles.lockDesc}>{fallbackMessage || 'Unlock this and more with LockIn Premium.'}</Text>
        
        <Pressable onPress={() => setShowPaywall(true)} style={styles.btn}>
          <Text style={styles.btnText}>Upgrade Now</Text>
        </Pressable>
      </View>

      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  lockedContent: {
    opacity: 0.15,
    filter: 'blur(4px)', // Note: standard React Native doesn't support filter, 
                        // but Expo BlurView can be used if needed.
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  lockCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lockTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  lockDesc: { fontSize: 13, color: TEXT_SECONDARY, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  btn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnText: { color: '#000', fontWeight: '700', fontSize: 14 },
})
