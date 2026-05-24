import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { BG, SURFACE, TEXT_SECONDARY, SPACING_LG, SPACING_MD } from '@/lib/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Pressable } from 'react-native'

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets()
  
  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={TEXT_SECONDARY} />
        </Pressable>
        <Text style={s.title}>Privacy Policy</Text>
      </View>
      
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={s.card}>
          <Text style={s.section}>Introduction</Text>
          <Text style={s.body}>
            Your privacy is important to us. This policy explains how we collect and use your data when you use LockIn.
          </Text>
          
          <Text style={s.section}>Data Collection</Text>
          <Text style={s.body}>
            We collect focus session data, goal progress, and basic profile information to provide our services.
          </Text>
          
          <Text style={s.section}>Data Usage</Text>
          <Text style={s.body}>
            Your data is used to calculate insights, track streaks, and sync your progress across devices via Supabase.
          </Text>
          
          <Text style={s.section}>Contact</Text>
          <Text style={s.body}>
            If you have questions, contact us at support@lockin.app.
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
