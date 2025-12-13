'use client'

import { useState, useCallback } from 'react'
import { useFrame } from '@/components/farcaster-provider'

type Choice = 'rock' | 'paper' | 'scissors'
type GameResult = 'win' | 'lose' | 'tie' | null

const choices: Choice[] = ['rock', 'paper', 'scissors']

const choiceEmoji: Record<Choice, string> = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️',
}

export default function RockPaperScissorsGame() {
  const { context } = useFrame()
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null)
  const [aiChoice, setAiChoice] = useState<Choice | null>(null)
  const [result, setResult] = useState<GameResult>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [stats, setStats] = useState({ wins: 0, losses: 0, ties: 0 })

  const getWinner = (player: Choice, ai: Choice): GameResult => {
    if (player === ai) return 'tie'
    if (
      (player === 'rock' && ai === 'scissors') ||
      (player === 'paper' && ai === 'rock') ||
      (player === 'scissors' && ai === 'paper')
    ) {
      return 'win'
    }
    return 'lose'
  }

  const playGame = useCallback(
    (choice: Choice) => {
      if (isAnimating) return

      setIsAnimating(true)
      setPlayerChoice(choice)
      setAiChoice(null)
      setResult(null)

      setTimeout(() => {
        const aiChoice = choices[Math.floor(Math.random() * choices.length)]!
        const gameResult = getWinner(choice, aiChoice)

        setAiChoice(aiChoice)
        setResult(gameResult)
        setIsAnimating(false)

        setStats((prev) => {
          if (gameResult === 'win')
            return { ...prev, wins: prev.wins + 1 }
          if (gameResult === 'lose')
            return { ...prev, losses: prev.losses + 1 }
          return { ...prev, ties: prev.ties + 1 }
        })
      }, 1500)
    },
    [isAnimating]
  )

  const resetGame = () => {
    setPlayerChoice(null)
    setAiChoice(null)
    setResult(null)
    setIsAnimating(false)
  }

  const getResultMessage = () => {
    if (!result) return 'Choose your move!'
    if (result === 'win') return '🎉 You Win!'
    if (result === 'lose') return '😞 AI Wins!'
    return '🤝 It\'s a Tie!'
  }

  const getResultColor = () => {
    if (!result) return 'text-gray-700'
    if (result === 'win') return 'text-green-600'
    if (result === 'lose') return 'text-red-600'
    return 'text-blue-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <h1 className="text-3xl font-black text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Rock Paper Scissors
        </h1>
        <p className="text-center text-sm text-gray-600">
          Playing as {context?.user?.displayName || 'Player'}
        </p>
      </div>

      {/* Stats */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-xs text-gray-600 font-bold uppercase mb-1">
                Wins
              </p>
              <p className="text-2xl font-black text-green-600">
                {stats.wins}
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-gray-600 font-bold uppercase mb-1">
                Ties
              </p>
              <p className="text-2xl font-black text-blue-600">
                {stats.ties}
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-gray-600 font-bold uppercase mb-1">
                Losses
              </p>
              <p className="text-2xl font-black text-red-600">
                {stats.losses}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Result Message */}
      <div className="max-w-2xl mx-auto mb-6">
        <div
          className={`text-center text-2xl font-black ${getResultColor()} transition-all duration-300`}
        >
          {getResultMessage()}
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Player Side */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h3 className="text-center text-sm font-bold text-gray-700 mb-4">
              Your Choice
            </h3>
            <div className="flex justify-center items-center h-32">
              {playerChoice ? (
                <div className="text-6xl animate-bounce">
                  {choiceEmoji[playerChoice]}
                </div>
              ) : (
                <div className="text-4xl text-gray-300">❓</div>
              )}
            </div>
            {playerChoice && (
              <p className="text-center text-sm font-bold text-gray-700 mt-2 capitalize">
                {playerChoice}
              </p>
            )}
          </div>

          {/* AI Side */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h3 className="text-center text-sm font-bold text-gray-700 mb-4">
              AI Choice
            </h3>
            <div className="flex justify-center items-center h-32">
              {aiChoice ? (
                <div className="text-6xl animate-bounce">
                  {choiceEmoji[aiChoice]}
                </div>
              ) : (
                <div
                  className={`text-4xl text-gray-300 ${isAnimating ? 'animate-spin' : ''}`}
                >
                  🤖
                </div>
              )}
            </div>
            {aiChoice && (
              <p className="text-center text-sm font-bold text-gray-700 mt-2 capitalize">
                {aiChoice}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Choice Buttons */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="grid grid-cols-3 gap-3">
          {choices.map((choice) => (
            <button
              key={choice}
              onClick={() => playGame(choice)}
              disabled={isAnimating}
              className={`bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 transition-all duration-300 ${
                isAnimating
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 hover:border-purple-400 hover:shadow-xl active:scale-95'
              } ${playerChoice === choice ? 'border-purple-600 ring-4 ring-purple-200' : ''}`}
            >
              <div className="text-5xl mb-2">{choiceEmoji[choice]}</div>
              <p className="text-sm font-bold text-gray-700 capitalize">
                {choice}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      {result && (
        <div className="max-w-2xl mx-auto">
          <button
            onClick={resetGame}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}
