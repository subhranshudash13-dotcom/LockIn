import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { BG, SURFACE, TEXT_SECONDARY, SPACING_LG, SPACING_MD } from '@/lib/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Pressable } from 'react-native'

export default function TermsScreen() {
  const insets = useSafeAreaInsets()
  
  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={TEXT_SECONDARY} />
        </Pressable>
        <Text style={s.title}>Terms of Service</Text>
      </View>
      
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={s.card}>
          <Text style={s.section}>License</Text>
          <Text style={s.body}>
            By using LockIn, you are granted a limited, non-exclusive license to use the app for personal productivity.
          </Text>
          
          <Text style={s.section}>Premium</Text>
          <Text style={s.body}>
            Premium features are available via subscription through RevenueCat. Fees are non-refundable unless required by law.
          </Text>
          
          <Text style={s.section}>Prohibited Use</Text>
          <Text style={s.body}>
            You may not reverse engineer, redistribute, or use the app for any illegal purposes.
          </Text>
          
          <Text style={s.section}>Changes</Text>
          <Text style={s.body}>
            We reserve the right to modify these terms at any time. Continued use of the app constitutes acceptance.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING_LG, paddingBottom: SPACING_MD },
  back: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  scroll: { paddingHorizontal: SPACING_LG, paddingTop: SPACING_MD },
  card: { backgroundColor: SURFACE, padding: SPACING_LG, borderRadius: 24 },
  section: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 24, marginBottom: 8 },
  body: { fontSize: 15, color: TEXT_SECONDARY, lineHeight: 22 },
})
