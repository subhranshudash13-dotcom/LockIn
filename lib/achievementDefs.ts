/**
 * achievementDefs.ts
 * Static definitions for all 12 achievements/badges in the app.
 */

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: string        // emoji — rendered in badge grid
  xpReward: number
  conditionKey: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'firstSession',
    title: 'First Lock-In',
    description: 'Complete your very first focus session.',
    icon: '🚀',
    xpReward: 25,
    conditionKey: 'firstSession',
    rarity: 'common',
  },
  {
    id: 'sessions5',
    title: 'Getting Warmed Up',
    description: 'Complete 5 focus sessions.',
    icon: '🔥',
    xpReward: 50,
    conditionKey: 'sessions5',
    rarity: 'common',
  },
  {
    id: 'sessions25',
    title: 'Deep Worker',
    description: 'Complete 25 focus sessions.',
    icon: '⚡',
    xpReward: 100,
    conditionKey: 'sessions25',
    rarity: 'rare',
  },
  {
    id: 'sessions100',
    title: 'Century Club',
    description: 'Complete 100 focus sessions.',
    icon: '💯',
    xpReward: 250,
    conditionKey: 'sessions100',
    rarity: 'epic',
  },
  {
    id: 'streak3',
    title: 'Hat Trick',
    description: 'Maintain a 3-day focus streak.',
    icon: '🎯',
    xpReward: 50,
    conditionKey: 'streak3',
    rarity: 'common',
  },
  {
    id: 'streak7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day focus streak.',
    icon: '🏆',
    xpReward: 150,
    conditionKey: 'streak7',
    rarity: 'rare',
  },
  {
    id: 'streak30',
    title: 'Iron Will',
    description: 'Maintain a 30-day focus streak.',
    icon: '👑',
    xpReward: 500,
    conditionKey: 'streak30',
    rarity: 'legendary',
  },
  {
    id: 'level5',
    title: 'Mid-Tier Grinder',
    description: 'Reach Level 5.',
    icon: '⭐',
    xpReward: 75,
    conditionKey: 'level5',
    rarity: 'rare',
  },
  {
    id: 'level10',
    title: 'Elite Focus',
    description: 'Reach Level 10.',
    icon: '💎',
    xpReward: 200,
    conditionKey: 'level10',
    rarity: 'epic',
  },
  {
    id: 'focus60min',
    title: 'Hour Power',
    description: 'Accumulate 60 minutes of total focus time.',
    icon: '⏱️',
    xpReward: 50,
    conditionKey: 'focus60min',
    rarity: 'common',
  },
  {
    id: 'focus500min',
    title: 'Time Lord',
    description: 'Accumulate 500 minutes of total focus time.',
    icon: '🌀',
    xpReward: 300,
    conditionKey: 'focus500min',
    rarity: 'epic',
  },
  {
    id: 'freezeUsed',
    title: 'Smooth Operator',
    description: 'Use a streak freeze to protect your streak.',
    icon: '❄️',
    xpReward: 25,
    conditionKey: 'freezeUsed',
    rarity: 'common',
  },
]

export const RARITY_COLORS: Record<AchievementDef['rarity'], string> = {
  common: '#9ca3af',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24',
}
