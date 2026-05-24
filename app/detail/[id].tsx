import React from 'react'
import { StyleSheet, View, ScrollView, Pressable } from 'react-native'
import { Text } from '@/components/ui/Text'
import { useLocalSearchParams, router } from 'expo-router'
import { useItem, useItemTasks } from '@/hooks/useItems'
import { BG, SURFACE, TEXT_SECONDARY, TEXT_TERTIARY, ACCENT, SPACING_LG, SPACING_MD } from '@/lib/theme'
import { statusLabel } from '@/lib/mockData'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import StatusBadge from '@/components/ui/StatusBadge'

/**
 * Item Detail Screen
 * Shows details, metrics, and tasks for a specific item.
 */
export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const { data: item, isLoading } = useItem(id!)
  const { data: tasks } = useItemTasks(id!)
  
  if (isLoading || !item) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: TEXT_TERTIARY }}>Loading project details...</Text>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={TEXT_SECONDARY} />
        </Pressable>
        <Text style={s.title}>{item.name}</Text>
      </View>
      
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <View style={s.card}>
          <View style={s.cardHeader}>
             <StatusBadge status={item.status as any} label={statusLabel(item.status)} />
             <Text style={s.date}>Updated {item.updatedAt}</Text>
          </View>
          <Text style={s.desc}>{item.summary}</Text>
          
          <View style={s.stats}>
             <StatItem label="Completion" value={`${item.completion}%`} />
             <StatItem label="Health" value={`${item.health}%`} />
             <StatItem label="Active" value={String(item.activeUsers)} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Tasks</Text>
          {tasks?.map(task => (
            <View key={task.id} style={s.taskRow}>
               <Ionicons 
                name={task.state === 'done' ? "checkbox" : "square-outline"} 
                size={20} 
                color={task.state === 'done' ? ACCENT : TEXT_TERTIARY} 
               />
               <Text style={[s.taskTitle, task.state === 'done' && s.taskCompleted]}>
                {task.title}
               </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

function StatItem({ label, value }: { label: string, value: string }) {
    return (
        <View style={s.stat}>
            <Text style={s.statVal}>{value}</Text>
            <Text style={s.statLabel}>{label}</Text>
        </View>
    )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING_LG, paddingBottom: SPACING_MD },
  back: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', flex: 1 },
  scroll: { paddingHorizontal: SPACING_LG, paddingTop: SPACING_MD, gap: 24 },
  card: { backgroundColor: SURFACE, padding: 20, borderRadius: 24, gap: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: TEXT_TERTIARY },
  desc: { fontSize: 15, color: TEXT_SECONDARY, lineHeight: 22 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: TEXT_TERTIARY, textTransform: 'uppercase', marginTop: 4 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: SURFACE, padding: 16, borderRadius: 16 },
  taskTitle: { fontSize: 15, color: '#fff', fontWeight: '500' },
  taskCompleted: { textDecorationLine: 'line-through', opacity: 0.5 },
})
