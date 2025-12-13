'use client'

import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import PaajiGame from '@/components/games/paaji'
import Link from 'next/link'

export default function PaajiPage() {
  const { context, isLoading, isSDKLoaded } = useFrame()

  if (isLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-center">Loading...</h1>
        </div>
      </SafeAreaContainer>
    )
  }

  if (!isSDKLoaded) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-center">
            Please use this miniapp in the Farcaster app
          </h1>
          <Link
            href="/games"
            className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold"
          >
            Back to Games
          </Link>
        </div>
      </SafeAreaContainer>
    )
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <div className="relative">
        <Link
          href="/games"
          className="absolute top-4 left-4 z-10 px-4 py-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 font-bold text-gray-700"
        >
          ← Back
        </Link>

        <PaajiGame />
      </div>
    </SafeAreaContainer>
  )
}
