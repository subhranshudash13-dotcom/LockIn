/**
 * Tabs layout — add new tabs by:
 *   1. Create app/(tabs)/<name>.tsx
 *   2. Add a tabBarIcon and tabBarLabel in the <Tabs.Screen> below.
 *
 * The custom TabBar renders itself — its tab list is driven entirely by
 * the screens registered here.
 */
import { View, StyleSheet, Pressable } from 'react-native'
import { Tabs } from 'expo-router'
import { House, Compass, Bell, CircleUser, Timer, Trophy, BarChart2, LineChart, Users } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import TabBar, { TAB_BAR_HEIGHT } from '@/components/TabBar'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { Text } from '@/components/ui/Text'
import { BG, TEXT_PRIMARY, ACCENT, TEXT_SECONDARY, SURFACE } from '@/lib/theme'
import { APP_NAME } from '@/lib/constants'
import { useProfile } from '@/hooks/useProfile'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

function GlobalHeader() {
  const insets = useSafeAreaInsets()
  const { data: profile } = useProfile()
  
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <BrandLogo size={26} />
          <Text style={styles.headerTitle}>{APP_NAME}</Text>
        </View>

        {profile ? (
          <View style={styles.headerRight}>
            <View style={styles.statChip}>
              <Ionicons name="flame" size={14} color={ACCENT} />
              <Text style={styles.statValue}>{profile.streak}d</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lvl {profile.level}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.headerRight}>
            <View style={styles.guestStatus}>
              <View style={styles.pulseDot} />
              <Text style={styles.guestLabel}>PROVENANCE</Text>
            </View>
            <Pressable 
              onPress={() => router.push('/(auth)/login')}
              style={styles.signUpBtn}
            >
              <Text style={styles.signUpText}>JOIN ELITE</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: true,
        header: () => <GlobalHeader />,
        sceneStyle: { backgroundColor: BG },
        tabBarStyle: { height: TAB_BAR_HEIGHT },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <House size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="focus"
        options={{
          tabBarLabel: 'Focus',
          tabBarIcon: ({ color, size }) => (
            <Timer size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <LineChart size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="rewards"
        options={{
          tabBarLabel: 'Rewards',
          tabBarIcon: ({ color, size }) => (
            <Trophy size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Compass size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="activity"
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Bell size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <CircleUser size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />
    </Tabs>
  )
}
const styles = StyleSheet.create({
  header: {
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  headerContent: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
    opacity: 0.8,
  },
  guestLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: TEXT_SECONDARY,
    letterSpacing: 1,
  },
  signUpBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  signUpText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  statValue: {
    fontSize: 11,
    fontWeight: '800',
    color: ACCENT,
  },
  levelBadge: {
    backgroundColor: SURFACE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
})
