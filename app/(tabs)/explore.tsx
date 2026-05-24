import React from 'react'
import { StyleSheet, View, FlatList, TextInput, Pressable } from 'react-native'
import { Text } from '@/components/ui/Text'
import { router } from 'expo-router'
import { BG, SURFACE, TEXT_SECONDARY, TEXT_TERTIARY, ACCENT, SPACING_LG, SPACING_MD } from '@/lib/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { getLeaderboard, LeaderboardEntry } from '@/lib/focusStore'
import LeaderboardRow from '@/components/social/LeaderboardRow'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = React.useState('')
  const [tab, setTab] = React.useState<'techniques' | 'social'>('techniques')
  const [leaders, setLeaders] = React.useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = React.useState(false)

  const loadSocial = React.useCallback(async () => {
    setLoading(true)
    const data = await getLeaderboard()
    setLeaders(data)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    if (tab === 'social') loadSocial()
  }, [tab])
  
  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <Text style={s.title}>Explore</Text>
        
        {/* Segment Control */}
        <View style={s.segment}>
          <Pressable 
            style={[s.segmentBtn, tab === 'techniques' && s.segmentActive]} 
            onPress={() => setTab('techniques')}
          >
            <Text style={[s.segmentText, tab === 'techniques' && s.segmentTextActive]}>Techniques</Text>
          </Pressable>
          <Pressable 
            style={[s.segmentBtn, tab === 'social' && s.segmentActive]} 
            onPress={() => setTab('social')}
          >
            <Text style={[s.segmentText, tab === 'social' && s.segmentTextActive]}>Hall of Fame</Text>
          </Pressable>
        </View>

        {tab === 'techniques' && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={s.searchBar}>
             <Ionicons name="search" size={18} color={TEXT_TERTIARY} />
             <TextInput 
                value={search}
                onChangeText={setSearch}
                placeholder="Search focus techniques..."
                placeholderTextColor={TEXT_TERTIARY}
                style={s.searchInput}
             />
          </Animated.View>
        )}
      </View>
      
      {tab === 'techniques' ? (
        <FlatList 
          data={CATEGORIES}
          keyExtractor={item => item.id}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item }) => (
            <Pressable 
              style={s.card}
              onPress={() => router.push(`/detail/${item.id}`)}
            >
              <View style={[s.iconWrap, { backgroundColor: item.color + '10' }]}>
                 <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={s.cardContent}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={TEXT_TERTIARY} />
            </Pressable>
          )}
        />
      ) : (
        <FlatList 
          data={leaders}
          keyExtractor={item => item.userId}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 100 }]}
          refreshing={loading}
          onRefresh={loadSocial}
          renderItem={({ item }) => <LeaderboardRow entry={item} />}
        />
      )}
    </View>
  )
}

interface Category {
  id: string
  title: string
  desc: string
  icon: string
  color: string
}

const CATEGORIES: Category[] = [
  { id: 'session-1', title: 'Pomodoro Masters', desc: 'Advanced intervals for high-intensity work.', icon: 'timer-outline', color: '#f87171' },
  { id: 'session-2', title: 'Deep Work Protocol', desc: 'Cal Newport inspired distraction-free blocks.', icon: 'infinite-outline', color: '#60a5fa' },
  { id: 'session-3', title: 'Zen Flow', desc: 'Meditation-integrated focus sessions.', icon: 'leaf-outline', color: '#4ade80' },
  { id: 'session-4', title: 'Visual Immersion', desc: 'Cinematic environments for peak flow.', icon: 'videocam-outline', color: '#a78bfa' },
]

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: SPACING_LG, paddingBottom: SPACING_MD, gap: 16 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: SURFACE, 
    height: 50, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    gap: 12 
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  list: { paddingHorizontal: SPACING_LG, paddingTop: SPACING_MD, gap: 16 },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: SURFACE, 
    padding: 16, 
    borderRadius: 20, 
    gap: 16 
  },
  iconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardDesc: { fontSize: 13, color: TEXT_TERTIARY, marginTop: 2 },
  segment: { 
    flexDirection: 'row', 
    backgroundColor: SURFACE, 
    borderRadius: 14, 
    padding: 4, 
    marginTop: 8 
  },
  segmentBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 10 
  },
  segmentActive: { backgroundColor: 'rgba(255,255,255,0.05)' },
  segmentText: { fontSize: 13, fontWeight: '700', color: TEXT_TERTIARY },
  segmentTextActive: { color: ACCENT },
})
