'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useFrame } from '@/components/farcaster-provider'

interface GameObject {
  x: number
  y: number
  width: number
  height: number
  type: 'obstacle' | 'collectible'
}

export default function EndlessRunnerGame() {
  const { context } = useFrame()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('endless-runner-highscore')
      return saved ? parseInt(saved) : 0
    }
    return 0
  })

  const [player, setPlayer] = useState({
    x: 100,
    y: 0,
    velocityY: 0,
    isJumping: false,
  })

  const [gameObjects, setGameObjects] = useState<GameObject[]>([])
  const [backgroundX, setBackgroundX] = useState(0)

  const GRAVITY = 0.8
  const JUMP_FORCE = -16
  const GAME_SPEED = 6
  const PLAYER_WIDTH = 40
  const PLAYER_HEIGHT = 40
  const GROUND_HEIGHT = 100

  const jump = useCallback(() => {
    if (gameState === 'playing' && !player.isJumping) {
      setPlayer((prev) => ({
        ...prev,
        velocityY: JUMP_FORCE,
        isJumping: true,
      }))
    }
  }, [gameState, player.isJumping])

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    setGameObjects([])
    setBackgroundX(0)
    setPlayer({
      x: 100,
      y: 0,
      velocityY: 0,
      isJumping: false,
    })
  }, [])

  const gameOver = useCallback(() => {
    setGameState('gameOver')
    if (score > highScore) {
      setHighScore(score)
      if (typeof window !== 'undefined') {
        localStorage.setItem('endless-runner-highscore', score.toString())
      }
    }
  }, [score, highScore])

  // Update canvas size
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const width = Math.min(window.innerWidth - 32, 800)
      const height = 400
      canvas.width = width
      canvas.height = height
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameCount = 0

    const gameLoop = () => {
      frameCount++

      // Update player
      setPlayer((prev) => {
        const newY = prev.y + prev.velocityY
        const groundY = canvas.height - GROUND_HEIGHT - PLAYER_HEIGHT
        const newVelocityY = prev.velocityY + GRAVITY

        if (newY >= groundY) {
          return {
            ...prev,
            y: groundY,
            velocityY: 0,
            isJumping: false,
          }
        }

        return {
          ...prev,
          y: newY,
          velocityY: newVelocityY,
        }
      })

      // Update background
      setBackgroundX((prev) => (prev - GAME_SPEED) % canvas.width)

      // Update game objects
      setGameObjects((prev) => {
        const updated = prev
          .map((obj) => ({
            ...obj,
            x: obj.x - GAME_SPEED,
          }))
          .filter((obj) => obj.x + obj.width > 0)

        // Spawn new obstacles
        if (frameCount % 60 === 0 && Math.random() < 0.5) {
          updated.push({
            x: canvas.width,
            y: canvas.height - GROUND_HEIGHT - 30,
            width: 30,
            height: 30,
            type: 'obstacle',
          })
        }

        // Spawn collectibles
        if (frameCount % 90 === 0 && Math.random() < 0.3) {
          updated.push({
            x: canvas.width,
            y: canvas.height - GROUND_HEIGHT - 80,
            width: 20,
            height: 20,
            type: 'collectible',
          })
        }

        return updated
      })

      // Check collisions
      setGameObjects((objects) => {
        const playerRect = {
          x: player.x,
          y: player.y,
          width: PLAYER_WIDTH,
          height: PLAYER_HEIGHT,
        }

        const remaining: GameObject[] = []

        for (const obj of objects) {
          const collision =
            playerRect.x < obj.x + obj.width &&
            playerRect.x + playerRect.width > obj.x &&
            playerRect.y < obj.y + obj.height &&
            playerRect.y + playerRect.height > obj.y

          if (collision) {
            if (obj.type === 'obstacle') {
              gameOver()
            } else if (obj.type === 'collectible') {
              setScore((s) => s + 10)
              continue
            }
          }
          remaining.push(obj)
        }

        return remaining
      })

      // Update score
      if (frameCount % 10 === 0) {
        setScore((s) => s + 1)
      }

      // Clear canvas
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw ground
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT)

      // Draw player
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT)

      // Draw game objects
      gameObjects.forEach((obj) => {
        if (obj.type === 'obstacle') {
          ctx.fillStyle = '#DC143C'
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
        } else {
          ctx.fillStyle = '#32CD32'
          ctx.beginPath()
          ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [gameState, player, gameObjects, gameOver])

  // Keyboard & Touch controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        if (gameState === 'menu' || gameState === 'gameOver') {
          startGame()
        } else {
          jump()
        }
      }
    }

    const handleTouch = () => {
      if (gameState === 'menu' || gameState === 'gameOver') {
        startGame()
      } else {
        jump()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('touchstart', handleTouch)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('touchstart', handleTouch)
    }
  }, [gameState, jump, startGame])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-4 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          Endless Runner
        </h1>
        <p className="text-sm text-gray-600">
          {context?.user?.displayName || 'Player'}
        </p>
      </div>

      {/* Scores */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 px-6 py-3 text-center">
          <div className="text-xs text-gray-600 font-bold">Score</div>
          <div className="text-2xl font-black text-blue-600">{score}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 px-6 py-3 text-center">
          <div className="text-xs text-gray-600 font-bold">Best</div>
          <div className="text-2xl font-black text-purple-600">
            {highScore}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="bg-sky-100 rounded-2xl shadow-xl border-4 border-white cursor-pointer"
          onClick={() => {
            if (gameState === 'menu' || gameState === 'gameOver') {
              startGame()
            } else {
              jump()
            }
          }}
        />

        {/* Overlays */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
            <div className="text-center text-white">
              <h2 className="text-3xl font-black mb-4">Endless Runner</h2>
              <p className="mb-6">Tap or Press Space to Jump</p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
            <div className="text-center text-white">
              <h2 className="text-3xl font-black mb-4">Game Over!</h2>
              <p className="text-xl mb-2">Score: {score}</p>
              {score >= highScore && (
                <p className="text-yellow-400 font-bold mb-6">🎉 New High Score!</p>
              )}
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-gray-600 max-w-md">
        <p className="font-bold mb-2">How to Play:</p>
        <p>🏃 Tap screen or press Space to jump</p>
        <p>🔴 Avoid red obstacles</p>
        <p>🟢 Collect green coins for points</p>
      </div>
    </div>
  )
}
