/**
 * Paywall.tsx
 * Premium subscription overlay with RevenueCat integration.
 * Features glassmorphism UI and benefit comparison.
 */

import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Modal, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { X, Check, Zap, Flame, BarChart3, Palette } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { fetchOfferings, purchasePackage, PurchasesPackage } from '@/lib/purchases'
import { ACCENT, BG, SURFACE, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'

interface PaywallProps {
  visible: boolean
  onClose: () => void
}

export default function Paywall({ visible, onClose }: PaywallProps) {
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    if (visible) {
      setLoading(true)
      fetchOfferings().then((offerings) => {
        if (offerings?.current) {
          setPackages(offerings.current.availablePackages)
        }
        setLoading(false)
      })
    }
  }, [visible])

  const onPurchase = async (pkg: PurchasesPackage) => {
    setBuying(true)
    try {
      const info = await purchasePackage(pkg)
      if (info?.entitlements.active['premium']) {
        onClose()
      }
    } catch (e) {
      console.warn('Purchase failed', e)
    } finally {
      setBuying(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <LinearGradient colors={['#0d0d0d', '#1a1a1a']} style={styles.content}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X color={TEXT_SECONDARY} size={24} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Zap color={ACCENT} size={32} fill={ACCENT} />
              </View>
              <Text style={styles.title}>Unlock LockIn Premium</Text>
              <Text style={styles.subtitle}>Supercharge your focus with elite productivity tools</Text>
            </View>

            <View style={styles.benefitGrid}>
              <BenefitItem 
                icon={<Flame color={ACCENT} size={20} />} 
                title="Unlimited Freezes" 
                desc="Protect your streak automatically when life happens." 
              />
              <BenefitItem 
                icon={<Palette color="#60a5fa" size={20} />} 
                title="Exclusive Themes" 
                desc="Gold, Obsidian, and Rose focus environments." 
              />
              <BenefitItem 
                icon={<BarChart3 color="#4ade80" size={20} />} 
                title="Advanced Analytics" 
                desc="Yearly heatmaps and deep focus hour trends." 
              />
              <BenefitItem 
                icon={<Check color="#fcd34d" size={20} />} 
                title="Cross-Device Sync" 
                desc="Your progress, secured forever via Supabase." 
              />
            </View>

            <View style={styles.pkgSection}>
              {loading ? (
                <ActivityIndicator color={ACCENT} />
              ) : packages.length > 0 ? (
                packages.map((pkg) => (
                  <Pressable 
                    key={pkg.identifier} 
                    onPress={() => onPurchase(pkg)}
                    style={styles.pkgRow}
                    disabled={buying}
                  >
                    <View>
                      <Text style={styles.pkgName}>{pkg.product.title}</Text>
                      <Text style={styles.pkgDesc}>{pkg.product.description}</Text>
                    </View>
                    <Text style={styles.pkgPrice}>{pkg.product.priceString}</Text>
                  </Pressable>
                ))
              ) : (
                <View style={[styles.pkgRow, { opacity: 0.5 }]}>
                  <View>
                    <Text style={styles.pkgName}>Premium Monthly</Text>
                    <Text style={styles.pkgDesc}>7-day free trial then $4.99/mo</Text>
                  </View>
                  <Text style={styles.pkgPrice}>$4.99</Text>
                </View>
              )}
            </View>

            <Text style={styles.legal}>
              Recurring billing. Cancel anytime. By continuing you agree to our Terms and Privacy Policy.
            </Text>
          </ScrollView>

          {buying && (
            <View style={styles.loaderCover}>
              <ActivityIndicator color={ACCENT} size="large" />
            </View>
          )}
        </LinearGradient>
      </View>
    </Modal>
  )
}

function BenefitItem({ icon, title, desc }: { icon: any; title: string, desc: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDesc}>{desc}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  content: {
    height: '92%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scroll: { padding: 24, paddingBottom: 60, gap: 32 },
  header: { alignItems: 'center', gap: 12, marginTop: 20 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 15, color: TEXT_SECONDARY, textAlign: 'center', paddingHorizontal: 20 },
  benefitGrid: { gap: 16 },
  benefit: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  benefitDesc: { fontSize: 13, color: TEXT_TERTIARY, marginTop: 2 },
  pkgSection: { gap: 12 },
  pkgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pkgName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  pkgDesc: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  pkgPrice: { fontSize: 18, fontWeight: '900', color: ACCENT },
  legal: { fontSize: 11, color: TEXT_TERTIARY, textAlign: 'center', paddingHorizontal: 30 },
  loaderCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
  },
})
