import React from 'react'
import { StyleSheet, View, ScrollView, Linking } from 'react-native'
import { Text } from '@/components/ui/Text'
import { BG, SURFACE, TEXT_SECONDARY, SPACING_LG, SPACING_MD, ACCENT } from '@/lib/theme'
import { APP_SUPPORT_EMAIL, APP_DOCS_URL } from '@/lib/constants'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Pressable } from 'react-native'

export default function SupportScreen() {
  const insets = useSafeAreaInsets()
  
  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={TEXT_SECONDARY} />
        </Pressable>
        <Text style={s.title}>Support</Text>
      </View>
      
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={s.hero}>
           <Ionicons name="chatbubbles-outline" size={48} color={ACCENT} />
           <Text style={s.heroTitle}>How can we help?</Text>
           <Text style={s.heroSub}>Our elite support team is ready to assist you in reclaiming your reality.</Text>
        </View>

        <View style={s.grid}>
           <SupportCard 
              icon="mail-outline" 
              title="Email Support" 
              desc="Average response time: 4 hours"
              onPress={() => Linking.openURL(`mailto:${APP_SUPPORT_EMAIL}`)}
           />
           <SupportCard 
              icon="book-outline" 
              title="Documentation" 
              desc="Guides, tips, and methodology"
              onPress={() => Linking.openURL(APP_DOCS_URL)}
           />
        </View>

        <View style={s.faqSection}>
           <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
           <FaqItem 
              q="Does LockIn collect my browsing history?" 
              a="No. LockIn only tracks the purpose-driven sessions you start within the app. Your privacy remains absolute." 
           />
           <FaqItem 
              q="How do I restore my Premium subscription?" 
              a="Navigate to the Profile tab, tap 'Upgrade', and select 'Restore Purchases' at the bottom." 
           />
        </View>
      </ScrollView>
    </View>
  )
}

function SupportCard({ icon, title, desc, onPress }: { icon: any, title: string, desc: string, onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}>
            <Ionicons name={icon} size={24} color={ACCENT} />
            <Text style={s.cardTitle}>{title}</Text>
            <Text style={s.cardDesc}>{desc}</Text>
        </Pressable>
    )
}

function FaqItem({ q, a }: { q: string, a: string }) {
    const [open, setOpen] = React.useState(false)
    return (
        <Pressable onPress={() => setOpen(!open)} style={s.faqItem}>
            <View style={s.faqRow}>
                <Text style={s.faqTitle}>{q}</Text>
                <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={TEXT_SECONDARY} />
            </View>
            {open && <Text style={s.faqBody}>{a}</Text>}
        </Pressable>
    )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING_LG, paddingBottom: SPACING_MD },
  back: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  scroll: { paddingHorizontal: SPACING_LG, paddingTop: SPACING_MD, gap: 32 },
  hero: { alignItems: 'center', gap: 12, marginTop: 10 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', maxWidth: 260, lineHeight: 21 },
  grid: { flexDirection: 'row', gap: 16 },
  card: { flex: 1, backgroundColor: SURFACE, padding: 20, borderRadius: 24, gap: 8, alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#fff', textAlign: 'center' },
  cardDesc: { fontSize: 12, color: TEXT_SECONDARY, textAlign: 'center' },
  faqSection: { gap: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1 },
  faqItem: { backgroundColor: SURFACE, padding: 20, borderRadius: 20, gap: 10 },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqTitle: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1, marginRight: 10 },
  faqBody: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 21 },
})
