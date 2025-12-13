'use client'

import * as React from 'react'
import { useFrame } from '@/components/farcaster-provider'

type GameStatus = 'idle' | 'in-progress' | 'won' | 'lost' | 'cashed-out'
type Difficulty = 'Easy' | 'Hard'

interface RowConfig {
  safeIndices: number[]
  revealedIndex?: number
}

export default function PaajiGame() {
  const { context } = useFrame()
  const [status, setStatus] = React.useState<GameStatus>('idle')
  const [currentRow, setCurrentRow] = React.useState(0)
  const [config, setConfig] = React.useState<RowConfig[]>([])
  const [steps, setSteps] = React.useState(0)
  const [difficulty, setDifficulty] = React.useState<Difficulty>('Easy')
  const [betAmount, setBetAmount] = React.useState<string>('10')
  const [balance, setBalance] = React.useState<number>(1000)
  const [showResult, setShowResult] = React.useState(false)
  const [message, setMessage] = React.useState('')

  const rows = 8
  const numCols = difficulty === 'Easy' ? 4 : 5

  const multiplier = React.useMemo(() => {
    const easy = [1.12, 1.36, 1.65, 1.95, 2.0, 2.4, 2.6, 3.0]
    const hard = [1.25, 1.56, 1.95, 2.2, 2.8, 3.5, 4.3, 5.0]
    const list = difficulty === 'Easy' ? easy : hard
    const idx = Math.min(steps, list.length - 1)
    return list[idx] || 1
  }, [steps, difficulty])

  const potentialWin = React.useMemo(() => {
    const bet = parseFloat(betAmount) || 0
    return (bet * multiplier).toFixed(2)
  }, [betAmount, multiplier])

  function generateBoard(): RowConfig[] {
    const safePerRow = difficulty === 'Easy' ? 2 : 1
    return Array.from({ length: rows }, () => {
      const safeIndices: number[] = []
      while (safeIndices.length < safePerRow) {
        const idx = Math.floor(Math.random() * numCols)
        if (!safeIndices.includes(idx)) safeIndices.push(idx)
      }
      return { safeIndices }
    })
  }

  function startGame() {
    const bet = parseFloat(betAmount)
    if (isNaN(bet) || bet <= 0 || bet > balance) return

    setBalance((prev) => prev - bet)
    setConfig(generateBoard())
    setStatus('in-progress')
    setCurrentRow(0)
    setSteps(0)
    setShowResult(false)
    setMessage('')
  }

  function resetGame() {
    setStatus('idle')
    setCurrentRow(0)
    setConfig([])
    setSteps(0)
    setShowResult(false)
    setMessage('')
  }

  const cashOut = () => {
    if (status === 'in-progress') {
      setStatus('cashed-out')
      const winnings = parseFloat(potentialWin)
      setBalance((prev) => prev + winnings)
      setMessage(`💰 Cashed out ${winnings.toFixed(2)} coins!`)
      setShowResult(true)
    }
  }

  const pickTile = (row: number, col: number) => {
    if (status !== 'in-progress' || row !== currentRow) return

    setConfig((prev) => {
      const next = [...prev]
      next[row] = { ...next[row], revealedIndex: col }
      return next
    })

    const isSafe = config[row]?.safeIndices?.includes(col)
    if (isSafe) {
      const nextRow = currentRow + 1
      setSteps((s) => s + 1)

      if (nextRow >= rows) {
        setStatus('won')
        const winnings = parseFloat(potentialWin)
        setBalance((prev) => prev + winnings)
        setMessage(`🎉 You won ${winnings.toFixed(2)} coins!`)
        setShowResult(true)
      } else {
        setCurrentRow(nextRow)
      }
    } else {
      setStatus('lost')
      setMessage('💥 Better luck next time!')
      setShowResult(true)
    }
  }

  const getTileState = (row: number, col: number) => {
    const rowConfig = config[row]
    if (!rowConfig) return 'hidden'
    
    if (rowConfig.revealedIndex === col) {
      return rowConfig.safeIndices.includes(col) ? 'safe' : 'bomb'
    }
    
    if (row < currentRow) {
      return rowConfig.safeIndices.includes(col) ? 'safe' : 'hidden'
    }
    
    return 'hidden'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-3xl font-black text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Paaji
        </h1>
        <p className="text-center text-sm text-gray-600">
          Playing as {context?.user?.displayName || 'Player'}
        </p>
      </div>

      {/* Stats & Controls */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-600 font-bold mb-1">Balance</div>
            <div className="text-2xl font-black text-purple-600">
              {balance.toFixed(0)}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-600 font-bold mb-1">Potential Win</div>
            <div className="text-2xl font-black text-green-600">
              {potentialWin}
            </div>
          </div>
        </div>

        {/* Controls */}
        {status === 'idle' && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setDifficulty('Easy')}
                className={`flex-1 py-2 px-4 rounded-xl font-bold ${
                  difficulty === 'Easy'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Easy
              </button>
              <button
                onClick={() => setDifficulty('Hard')}
                className={`flex-1 py-2 px-4 rounded-xl font-bold ${
                  difficulty === 'Hard'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Hard
              </button>
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">
                Bet Amount
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 font-bold text-lg"
              />
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold shadow-xl"
            >
              Start Game ({betAmount} coins)
            </button>
          </div>
        )}

        {status === 'in-progress' && (
          <div className="flex gap-2">
            <button
              onClick={cashOut}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-2xl font-bold"
            >
              Cash Out ({potentialWin})
            </button>
          </div>
        )}
      </div>

      {/* Game Board */}
      {config.length > 0 && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4">
            <div className="space-y-2">
              {config.map((rowConfig, rowIdx) => (
                <div
                  key={rowIdx}
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}
                >
                  {Array.from({ length: numCols }).map((_, colIdx) => {
                    const state = getTileState(rowIdx, colIdx)
                    const isActive = rowIdx === currentRow && status === 'in-progress'

                    return (
                      <button
                        key={colIdx}
                        onClick={() => pickTile(rowIdx, colIdx)}
                        disabled={!isActive}
                        className={`aspect-square rounded-xl font-bold text-2xl transition-all ${
                          state === 'safe'
                            ? 'bg-green-500 text-white'
                            : state === 'bomb'
                            ? 'bg-red-500 text-white'
                            : isActive
                            ? 'bg-purple-100 hover:bg-purple-200 border-2 border-purple-400'
                            : 'bg-gray-100 border-2 border-gray-200'
                        }`}
                      >
                        {state === 'safe' ? '😊' : state === 'bomb' ? '💥' : '?'}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result Dialog */}
      {showResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">
              {status === 'won' || status === 'cashed-out' ? '🎉' : '💥'}
            </div>
            <h2 className="text-2xl font-black mb-4">
              {status === 'won' ? 'You Won!' : status === 'cashed-out' ? 'Cashed Out!' : 'Game Over'}
            </h2>
            <p className="text-xl text-gray-700 mb-6">{message}</p>
            <button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
