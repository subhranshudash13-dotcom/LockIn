import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ActivityItem {
  id: string
  user_id: string
  type: 'session_complete' | 'achievement_unlocked' | 'streak_freeze'
  title: string
  description: string
  created_at: string
  metadata?: any
}

/**
 * useActivityFeed
 * Fetches recent activity notifications for the current user.
 */
export function useActivityFeed() {
  return useQuery({
    queryKey: ['activity_feed'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data as ActivityItem[]) || []
    },
    placeholderData: [],
  })
}
