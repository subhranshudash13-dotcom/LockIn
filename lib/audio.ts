export interface FocusTrack {
    id: string
    title: string
    artist: string
    url: string
    type: 'lofi' | 'noise'
}

export const FOCUS_TRACKS: FocusTrack[] = [
    { id: '1', title: 'Midnight Rain', artist: 'Lofi Flow', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', type: 'lofi' },
    { id: '2', title: 'Alpha Waves', artist: 'NeuroSound', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', type: 'noise' },
    { id: '3', title: 'Coffee Shop', artist: 'Deep Work', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', type: 'lofi' },
    { id: '4', title: 'Steady Brown', artist: 'Pure Noise', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', type: 'noise' },
    { id: '5', title: 'Forest Stream', artist: 'Nature Sync', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', type: 'lofi' },
    { id: '6', title: 'Deep Space', artist: 'Cosmic Focus', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', type: 'noise' },
    { id: '7', title: 'Cyberpunk Study', artist: 'Neon Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', type: 'lofi' },
]
