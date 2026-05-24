import React from 'react'
import { StyleSheet, View, ScrollView, Switch } from 'react-native'
import { Text } from '@/components/ui/Text'
import SettingsRow from '@/components/ui/SettingsRow'
import { BG, SURFACE, TEXT_SECONDARY, SPACING_LG, SPACING_MD, ACCENT } from '@/lib/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Pressable } from 'react-native'

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const [hapticsEnabled, setHapticsEnabled] = React.useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true)
  
  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={TEXT_SECONDARY} />
        </Pressable>
        <Text style={s.title}>Settings</Text>
      </View>
      
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences</Text>
          <View style={s.card}>
             <View style={s.row}>
                <View style={s.iconTitle}>
                   <Ionicons name="notifications-outline" size={20} color={TEXT_SECONDARY} />
                   <Text style={s.rowText}>Push Notifications</Text>
                </View>
                <Switch 
                    value={notificationsEnabled} 
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#222', true: ACCENT }}
                    thumbColor="#fff"
                />
             </View>
             <View style={s.divider} />
             <View style={s.row}>
                <View style={s.iconTitle}>
                   <Ionicons name="finger-print-outline" size={20} color={TEXT_SECONDARY} />
                   <Text style={s.rowText}>Haptic Feedback</Text>
                </View>
                <Switch 
                    value={hapticsEnabled} 
                    onValueChange={setHapticsEnabled}
                    trackColor={{ false: '#222', true: ACCENT }}
                    thumbColor="#fff"
                />
             </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Legal & Support</Text>
          <View style={s.card}>
            <SettingsRow 
                icon="help-circle-outline" 
                label="Help & Support" 
                onPress={() => router.push('/support')}
            />
            <View style={s.divider} />
            <SettingsRow 
                icon="shield-outline" 
                label="Privacy Policy" 
                onPress={() => router.push('/privacy')}
            />
            <View style={s.divider} />
            <SettingsRow 
                icon="document-text-outline" 
                label="Terms of Service" 
                onPress={() => router.push('/terms')}
            />
          </View>
        </View>

        <Text style={s.version}>Version 1.0.0 (Production)</Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING_LG, paddingBottom: SPACING_MD },
  back: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  scroll: { paddingHorizontal: SPACING_LG, paddingTop: SPACING_MD, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  card: { backgroundColor: SURFACE, borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  iconTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginLeft: 48 },
  version: { textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 12 },
})
