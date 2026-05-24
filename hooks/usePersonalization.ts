import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface UserPersonalization {
  focusGoal: string
  intensity: 'soft' | 'sharp' | 'elite'
  theme: 'gold' | 'obsidian' | 'rose'
  remindersEnabled: boolean
  daily_target_mins: number
}

const STORAGE_KEY = 'lockin_personalization'

const DEFAULT_PERSONALIZATION: UserPersonalization = {
  focusGoal: 'productivity',
  intensity: 'sharp',
  theme: 'gold',
  remindersEnabled: true,
  daily_target_mins: 60
}

/**
 * usePersonalization
 * Manages user-specific focus goals and UI preferences.
 * Persists to both AsyncStorage (local) and Supabase (sync).
 */
export function usePersonalization() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['personalization'],
    queryFn: async () => {
      // 1. Initial local check
      const local = await AsyncStorage.getItem(STORAGE_KEY)
      const initialData = local ? JSON.parse(local) : DEFAULT_PERSONALIZATION

      // 2. Sync from Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        
        if (data) {
          const remote: UserPersonalization = {
            focusGoal: data.focus_goal,
            intensity: data.intensity as any,
            theme: data.theme as any,
            remindersEnabled: data.reminders_enabled ?? true,
            daily_target_mins: data.daily_target_mins ?? 60
          }
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remote))
          return remote
        }
      }
      return initialData as UserPersonalization
    },
  })

  const mutation = useMutation({
    mutationFn: async (updated: Partial<UserPersonalization>) => {
      const current = query.data || DEFAULT_PERSONALIZATION
      const next = { ...current, ...updated }

      // 1. Update Local
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))

      // 2. Update Remote
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: session.user.id,
            focus_goal: next.focusGoal,
            intensity: next.intensity,
            theme: next.theme,
            reminders_enabled: next.remindersEnabled,
            daily_target_mins: next.daily_target_mins,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id)
      }

      return next
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['personalization'], data)
    }
  })

  return {
    settings: query.data || DEFAULT_PERSONALIZATION,
    updateSettings: mutation.mutate,
    isLoading: query.isLoading
  }
}
