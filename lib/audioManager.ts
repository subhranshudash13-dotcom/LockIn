import { Platform } from 'react-native'

/**
 * lib/audioManager.ts
 * Fail-safe wrapper for expo-av to prevent "Cannot find native module" crashes.
 */

let AV_MODULE: any = null

try {
  // Use require to capture load-time errors
  AV_MODULE = require('expo-av')
} catch (e) {
  console.warn('[AudioManager] expo-av could not be loaded:', e)
}

export const isAudioSupported = !!(AV_MODULE && AV_MODULE.Audio)

export const getAudio = () => {
  if (!isAudioSupported) {
    console.warn('[AudioManager] Audio is not supported in this environment.')
    return null
  }
  return AV_MODULE.Audio
}

export const safePlaySound = async (
    url: string, 
    onLoading?: (loading: boolean) => void,
    onStatusUpdate?: (status: any) => void
) => {
  const Audio = getAudio()
  if (!Audio) return null

  try {
    if (onLoading) onLoading(true)
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, isLooping: true, volume: 1.0 },
      onStatusUpdate
    )
    if (onLoading) onLoading(false)
    return sound
  } catch (error) {
    console.warn('[AudioManager] safePlaySound failed:', error)
    if (onLoading) onLoading(false)
    return null
  }
}

export const stopAndUnload = async (soundRef: any) => {
    try {
        if (soundRef) {
            await soundRef.stopAsync()
            await soundRef.unloadAsync()
        }
    } catch (e) {
        // Ignore unload errors
    }
}
