import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'
import { demoUser } from '@/lib/mockData'
import { getInitials } from '@/lib/utils'
import { getProfile, getStreak, getDailyLogs, computeFocusScore } from '@/lib/focusStore'

export interface UserProfile {
    fullName: string
    email: string
    initials: string
    planType: 'free' | 'premium'
    xp: number
    level: number
    streak: number
    longestStreak: number
    focusScore: number
    todayFocusMinutes: number
    distractionReduction: number
    dailyTargetMins: number
}

export function useProfile() {
    return useQuery<UserProfile>({
        queryKey: ['profile'],
        queryFn: async () => {
            const [focusProfile, streakData] = await Promise.all([
                getProfile(),
                getStreak(),
            ])

            // If Supabase is not configured, return local-only data
            if (!isSupabaseEnabled) {
                const logs = await getDailyLogs(7)
                const todayLog = logs[logs.length - 1]
                const avgScore = logs.length > 0
                    ? Math.round(logs.reduce((a, l) => a + l.score, 0) / logs.length)
                    : 0
                const distractionReduction = computeDistractionReduction(logs)

                return {
                    fullName: demoUser.fullName,
                    email: demoUser.email,
                    initials: demoUser.initials,
                    planType: 'free',
                    xp: focusProfile.xp,
                    level: focusProfile.level,
                    streak: streakData.currentStreak,
                    longestStreak: focusProfile.longestStreak,
                    focusScore: avgScore,
                    todayFocusMinutes: todayLog?.focusMinutes ?? 0,
                    distractionReduction,
                    dailyTargetMins: 60,
                }
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: dbProfile } = await supabase
                .from('profiles')
                .select('name, display_name, xp, streak, focus_score, avatar_url')
                .eq('id', user.id)
                .maybeSingle()

            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const { data: sessions } = await supabase
                .from('focus_sessions')
                .select('duration_ms')
                .eq('user_id', user.id)
                .gte('started_at', today.toISOString())
                .eq('completed', true)

            const todayFocusMinutes = Math.round((sessions?.reduce(
                (sum, s) => sum + (s.duration_ms || 0), 0
            ) || 0) / 60000)

            // Compute real distraction reduction from last 14 days of sessions
            const twoWeeksAgo = new Date()
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
            const { data: recentSessions } = await supabase
                .from('focus_sessions')
                .select('distraction_warnings, started_at')
                .eq('user_id', user.id)
                .gte('started_at', twoWeeksAgo.toISOString())
                .order('started_at', { ascending: true })

            const distractionReduction = computeDistractionReductionFromSessions(
                recentSessions ?? []
            )

            const fullName =
                dbProfile?.name ||
                dbProfile?.display_name ||
                (user.user_metadata?.full_name as string | undefined) ||
                user.email?.split('@')[0] ||
                'User'

            const { data: prefs } = await supabase
                .from('user_preferences')
                .select('daily_target_mins')
                .eq('user_id', user.id)
                .maybeSingle()

            return {
                fullName,
                email: user.email ?? '',
                initials: getInitials(fullName),
                planType: 'free',
                xp: dbProfile?.xp ?? focusProfile.xp,
                level: focusProfile.level,
                streak: dbProfile?.streak ?? streakData.currentStreak,
                longestStreak: focusProfile.longestStreak,
                focusScore: dbProfile?.focus_score ?? 0,
                todayFocusMinutes,
                distractionReduction,
                dailyTargetMins: prefs?.daily_target_mins ?? 60,
            }
        },
        placeholderData: {
            fullName: demoUser.fullName,
            email: demoUser.email,
            initials: demoUser.initials,
            planType: 'free',
            xp: 0,
            level: 1,
            streak: 0,
            longestStreak: 0,
            focusScore: 0,
            todayFocusMinutes: 0,
            distractionReduction: 0,
            dailyTargetMins: 60,
        },
    })
}

/**
 * Computes distraction reduction % by comparing the first half vs second half
 * of recent sessions. If the user has fewer distractions in recent sessions,
 * the percentage is positive.
 */
function computeDistractionReductionFromSessions(
    sessions: { distraction_warnings: number; started_at: string }[]
): number {
    if (sessions.length < 2) return 0

    const mid = Math.floor(sessions.length / 2)
    const olderHalf = sessions.slice(0, mid)
    const newerHalf = sessions.slice(mid)

    const olderAvg = olderHalf.reduce((a, s) => a + (s.distraction_warnings || 0), 0) / olderHalf.length
    const newerAvg = newerHalf.reduce((a, s) => a + (s.distraction_warnings || 0), 0) / newerHalf.length

    if (olderAvg === 0) return newerAvg === 0 ? 0 : -100

    return Math.round(((olderAvg - newerAvg) / olderAvg) * 100)
}

/**
 * Offline fallback: compute distraction reduction from local daily logs.
 */
function computeDistractionReduction(
    logs: { distractionMinutes: number }[]
): number {
    if (logs.length < 2) return 0

    const mid = Math.floor(logs.length / 2)
    const olderHalf = logs.slice(0, mid)
    const newerHalf = logs.slice(mid)

    const olderAvg = olderHalf.reduce((a, l) => a + l.distractionMinutes, 0) / olderHalf.length
    const newerAvg = newerHalf.reduce((a, l) => a + l.distractionMinutes, 0) / newerHalf.length

    if (olderAvg === 0) return newerAvg === 0 ? 0 : -100

    return Math.round(((olderAvg - newerAvg) / olderAvg) * 100)
}
