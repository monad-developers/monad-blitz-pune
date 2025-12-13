'use client'

import Link from 'next/link'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import { Gamepad2, Star, Users, Zap } from 'lucide-react'

interface Game {
  id: string
  title: string
  description: string
  emoji: string
  href: string
  category: string
  players: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

const games: Game[] = [
  {
    id: 'head-soccer',
    title: 'Head Soccer',
    description:
      'A fast-paced physics-based soccer game where you control characters with oversized heads.',
    emoji: '⚽',
    href: '/games/head-soccer',
    category: 'Sports',
    players: '1-2 Players',
    difficulty: 'Medium',
  },
  {
    id: 'showdown',
    title: 'Quick Draw Showdown',
    description:
      'Test your reflexes in this Wild West quick-draw duel. Be the fastest to draw!',
    emoji: '🤠',
    href: '/games/showdown',
    category: 'Action',
    players: 'Single Player',
    difficulty: 'Hard',
  },
  {
    id: 'rock-paper-scissor',
    title: 'Rock Paper Scissors',
    description:
      'The classic hand game with a modern twist. Challenge the AI!',
    emoji: '✋',
    href: '/games/rock-paper-scissor',
    category: 'Casual',
    players: 'Single Player',
    difficulty: 'Easy',
  },
  {
    id: 'paaji',
    title: 'Paaji',
    description:
      'An exciting adventure game featuring unique mechanics and challenging gameplay.',
    emoji: '🎮',
    href: '/games/paaji',
    category: 'Adventure',
    players: 'Single Player',
    difficulty: 'Medium',
  },
  {
    id: 'endless-runner',
    title: 'Endless Runner',
    description:
      'Run, jump, and dodge obstacles in this fast-paced endless runner game.',
    emoji: '🏃',
    href: '/games/endless-runner',
    category: 'Action',
    players: 'Single Player',
    difficulty: 'Easy',
  },
  {
    id: 'slither',
    title: 'Slither',
    description:
      'A snake game where you grow by consuming orbs. Can you become the longest?',
    emoji: '🐍',
    href: '/games/slither',
    category: 'Casual',
    players: 'Single Player',
    difficulty: 'Medium',
  },
]

const difficultyColors = {
  Easy: 'bg-green-500/10 text-green-600 border-green-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  Hard: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export default function GamesPage() {
  const { context } = useFrame()

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-8 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
              <Gamepad2 className="w-4 h-4" />
              <span className="text-sm font-medium">{games.length} Games</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              Monad Arcade
            </h1>
            <p className="text-lg text-purple-100">
              Play exciting games on Farcaster
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-4xl mx-auto px-4 -mt-6 mb-8">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Star, label: 'Featured', value: '6' },
              { icon: Users, label: 'Active', value: '100+' },
              { icon: Zap, label: 'New', value: '2' },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-4 border border-gray-200 shadow-lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">
                    <stat.icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-600">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {games.map((game) => (
              <Link
                key={game.id}
                href={game.href}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Header with Emoji */}
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-center">
                  <div className="text-6xl mb-2">{game.emoji}</div>
                  <h3 className="text-xl font-black text-white">
                    {game.title}
                  </h3>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {game.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                      {game.category}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold border ${difficultyColors[game.difficulty]}`}
                    >
                      {game.difficulty}
                    </span>
                  </div>

                  {/* Players */}
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{game.players}</span>
                  </div>

                  {/* Play Button */}
                  <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-xl font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
                    <Gamepad2 className="w-5 h-5" />
                    Play Now
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 shadow-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              More Games Coming Soon!
            </h2>
            <p className="text-purple-100">
              Check back regularly for new exciting games
            </p>
          </div>
        </div>
      </div>
    </SafeAreaContainer>
  )
}
