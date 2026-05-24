/**
 * Mock / placeholder data for the template.
 *
 * Replace these with real API calls once you wire up your backend.
 * The data is intentionally generic so this template works for any app type.
 *
 * Every screen reads from here — swap these exports with your data layer
 * and the UI stays intact.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ItemStatus = 'active' | 'pending' | 'archived'
export type TaskState = 'todo' | 'in-progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export type ItemSummary = {
    id: string
    name: string
    owner: string
    status: ItemStatus
    completion: number
    health: number
    activeUsers: number
    updatedAt: string
    summary: string
}

export type TaskItem = {
    id: string
    itemId: string
    title: string
    state: TaskState
    priority: TaskPriority
    dueDate: string
}

export type ActivityItem = {
    id: string
    itemId: string
    kind: 'milestone' | 'comment' | 'alert' | 'review'
    title: string
    detail: string
    timeAgo: string
}

export type NotificationItem = {
    id: string
    title: string
    body: string
    timeAgo: string
    category: 'billing' | 'system' | 'product' | 'team'
    read: boolean
}

export type FaqItem = {
    id: string
    question: string
    answer: string
}

// ─── Demo user ────────────────────────────────────────────────────────────────

export const demoUser = {
    fullName: 'Avery Quinn',
    email: 'avery.quinn@example.com',
    role: 'Admin',
    teamName: 'My Team',
    initials: 'AQ',
}

// ─── Items (generic placeholder data) ─────────────────────────────────────────

export const itemSummaries: ItemSummary[] = [
    {
        id: 'session-1',
        name: 'Deep Work: Coding',
        owner: 'You',
        status: 'active',
        completion: 100,
        health: 100,
        activeUsers: 1,
        updatedAt: '2h ago',
        summary: 'Locked in for 50m. High focus state achieved.',
    },
    {
        id: 'session-2',
        name: 'Design Sprint',
        owner: 'You',
        status: 'active',
        completion: 100,
        health: 100,
        activeUsers: 1,
        updatedAt: '4h ago',
        summary: '25m session. Solid progress on UI components.',
    },
    {
        id: 'session-3',
        name: 'Zen Flow',
        owner: 'System',
        status: 'active',
        completion: 100,
        health: 95,
        activeUsers: 124,
        updatedAt: 'Now',
        summary: 'Meditation-integrated focus sessions. Achieve peak mental clarity.',
    },
    {
        id: 'session-4',
        name: 'Visual Immersion',
        owner: 'System',
        status: 'active',
        completion: 100,
        health: 98,
        activeUsers: 89,
        updatedAt: '12m ago',
        summary: 'Cinematic environments for peak flow. High-fidelity visual focus.',
    },
]

export const insightCards = [
    { id: 'metric-1', label: "Today's Focus", value: '3h 42m', delta: '+12% vs avg' },
    { id: 'metric-2', label: 'Streak', value: '7 Days', delta: 'Keep it up!' },
    { id: 'metric-3', label: 'Deep Work', value: '88/100', delta: 'Top 5%' },
]

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const taskItems: TaskItem[] = [
    { id: 'task-1', itemId: 'item-1', title: 'Finalize design specs', state: 'review', priority: 'high', dueDate: 'Today' },
    { id: 'task-2', itemId: 'item-1', title: 'Fix reported issues', state: 'in-progress', priority: 'high', dueDate: 'Tomorrow' },
    { id: 'task-3', itemId: 'item-2', title: 'Update documentation', state: 'todo', priority: 'medium', dueDate: 'Mon' },
    { id: 'task-4', itemId: 'item-2', title: 'Run integration tests', state: 'in-progress', priority: 'medium', dueDate: 'Tue' },
    { id: 'task-5', itemId: 'item-3', title: 'Prepare release notes', state: 'todo', priority: 'high', dueDate: 'Today' },
    { id: 'task-6', itemId: 'item-4', title: 'Publish changelog', state: 'done', priority: 'low', dueDate: 'Done' },
    { id: 'task-7', itemId: 'item-4', title: 'Review pull requests', state: 'review', priority: 'low', dueDate: 'Fri' },
]

// ─── Activity feed ────────────────────────────────────────────────────────────

export const activityItems: ActivityItem[] = [
    {
        id: 'act-1',
        itemId: 'item-1',
        kind: 'milestone',
        title: 'Phase 2 completed',
        detail: 'All planned deliverables were submitted on time.',
        timeAgo: '22m ago',
    },
    {
        id: 'act-2',
        itemId: 'item-2',
        kind: 'comment',
        title: 'New feedback received',
        detail: 'Team requested changes to the layout before final review.',
        timeAgo: '1h ago',
    },
    {
        id: 'act-3',
        itemId: 'item-3',
        kind: 'alert',
        title: 'Deadline approaching',
        detail: 'The upcoming milestone is due within the next 48 hours.',
        timeAgo: '2h ago',
    },
    {
        id: 'act-4',
        itemId: 'item-4',
        kind: 'review',
        title: 'Review approved',
        detail: 'Quality checks and acceptance criteria have been met.',
        timeAgo: '5h ago',
    },
]

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationItems: NotificationItem[] = [
    {
        id: 'notif-1',
        title: 'New item assigned',
        body: 'You have been assigned a new item to review.',
        timeAgo: '12m ago',
        category: 'product',
        read: false,
    },
    {
        id: 'notif-2',
        title: 'Team member joined',
        body: 'Taylor has joined your team as an editor.',
        timeAgo: '58m ago',
        category: 'team',
        read: false,
    },
    {
        id: 'notif-3',
        title: 'Scheduled maintenance',
        body: 'The system will undergo maintenance Saturday at 02:00 UTC.',
        timeAgo: '3h ago',
        category: 'system',
        read: true,
    },
    {
        id: 'notif-4',
        title: 'New version available',
        body: 'Version 2.0 adds new features and performance improvements.',
        timeAgo: '1d ago',
        category: 'product',
        read: true,
    },
]

// ─── Support FAQ ──────────────────────────────────────────────────────────────

export const supportFaq: FaqItem[] = [
    {
        id: 'faq-1',
        question: 'Can I use this template without external services?',
        answer: 'Yes. The app ships with mock data and works as a full demo before wiring real APIs.',
    },
    {
        id: 'faq-2',
        question: 'How do I swap mock data for real APIs?',
        answer: 'Replace reads from lib/mockData.ts with your API adapter methods while keeping screen UI intact.',
    },
    {
        id: 'faq-3',
        question: 'Where should legal copy live?',
        answer: 'Use the privacy and terms routes as placeholders until your final policy documents are ready.',
    },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getItemById(itemId?: string | string[]) {
    if (!itemId || Array.isArray(itemId)) return null
    return itemSummaries.find((item) => item.id === itemId) ?? null
}

export function getItemTasks(itemId?: string | string[]) {
    if (!itemId || Array.isArray(itemId)) return []
    return taskItems.filter((task) => task.itemId === itemId)
}

export function statusLabel(status: ItemStatus) {
    switch (status) {
        case 'active':
            return 'Active'
        case 'pending':
            return 'Pending'
        case 'archived':
            return 'Archived'
        default:
            return status
    }
}
