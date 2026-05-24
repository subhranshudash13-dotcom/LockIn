import React from 'react'
import { StyleSheet, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { Text } from '@/components/ui/Text'
import { BG, SURFACE, TEXT_SECONDARY, TEXT_TERTIARY, ACCENT, SPACING_LG, SPACING_MD } from '@/lib/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { formatRelativeDate } from '@/lib/utils'

export default function ActivityScreen() {
  const insets = useSafeAreaInsets()
  const { data, isLoading, refetch } = useActivityFeed()
  
  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <Text style={s.title}>Activity</Text>
      </View>
      
      {isLoading ? (
        <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={ACCENT} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={TEXT_TERTIARY} />
              <Text style={s.emptyText}>No recent activity</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.iconCircle}>
                 <Ionicons 
                    name={item.type === 'session_complete' ? 'flash' : 'ribbon'} 
                    size={18} 
                    color={ACCENT} 
                 />
              </View>
              <View style={s.cardContent}>
                <View style={s.row}>
                  <Text style={s.cardTitle}>{item.title}</Text>
                  <Text style={s.date}>{formatRelativeDate(new Date(item.created_at))}</Text>
                </View>
                <Text style={s.cardDesc}>{item.description}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: SPACING_LG, paddingBottom: SPACING_MD },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  list: { paddingHorizontal: SPACING_LG, paddingTop: SPACING_MD, gap: 12 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: SURFACE, 
    padding: 16, 
    borderRadius: 20, 
    gap: 16,
    alignItems: 'center' 
  },
  iconCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(245,158,11,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cardContent: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  date: { fontSize: 11, color: TEXT_TERTIARY },
  cardDesc: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyText: { color: TEXT_TERTIARY, fontSize: 15 },
})
