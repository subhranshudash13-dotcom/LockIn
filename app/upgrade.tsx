import React from 'react'
import Paywall from '@/components/premium/Paywall'
import { router } from 'expo-router'

/**
 * Paywall Screen
 * Dedicated route for the subscription paywall.
 */
export default function UpgradeScreen() {
  return <Paywall visible={true} onClose={() => router.back()} />
}
