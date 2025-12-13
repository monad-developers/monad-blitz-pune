'use client'

import Link from 'next/link'
import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import { NotificationActions } from './NotificationActions'
import CustomOGImageAction from './CustomOGImageAction'
import { Haptics } from './Haptics'

export function Demo() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center">
        Monad Arcade
      </h1>
      
      {/* Games CTA */}
      <Link
        href="/games"
        className="w-full max-w-md bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-6 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
      >
        <div className="text-center space-y-2">
          <div className="text-4xl mb-2">🎮</div>
          <h2 className="text-2xl font-black">Play Games</h2>
          <p className="text-purple-100 text-sm">
            6 exciting games to play on Farcaster
          </p>
        </div>
      </Link>

      <div className="w-full max-w-4xl space-y-6">
        <User />
        <FarcasterActions />
        <NotificationActions />
        <WalletActions />
        <CustomOGImageAction />
        <Haptics />
      </div>
    </div>
  )
}
