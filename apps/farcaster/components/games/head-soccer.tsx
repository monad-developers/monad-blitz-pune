'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useFrame } from '@/components/farcaster-provider'

interface Player {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  onGround: boolean
  color: string
}

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 400
const GRAVITY = 0.6
const JUMP_FORCE = -14
const MOVE_SPEED = 5
const BALL_BOUNCE = 0.85
const GAME_DURATION = 60

export default function HeadSoccerGame() {
  const { context } = useFrame()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const gameTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const keysRef = useRef<Set<string>>(new Set())

  const [gameState, setGameState] = useState({
    player1Score: 0,
    player2Score: 0,
    timeLeft: GAME_DURATION,
    gameRunning: false,
    gameOver: false,
    winner: null as string | null,
  })

  const playerRef = useRef<Player>({
    x: 150,
    y: CANVAS_HEIGHT - 100,
    vx: 0,
    vy: 0,
    width: 40,
    height: 60,
    onGround: false,
    color: '#15803d',
  })

  const aiPlayerRef = useRef<Player>({
    x: CANVAS_WIDTH - 190,
    y: CANVAS_HEIGHT - 100,
    vx: 0,
    vy: 0,
    width: 40,
    height: 60,
    onGround: false,
    color: '#ea580c',
  })

  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 0,
    vy: 0,
    radius: 15,
  })

  const resetBall = useCallback(() => {
    const ball = ballRef.current
    ball.x = CANVAS_WIDTH / 2
    ball.y = CANVAS_HEIGHT / 2 - 100
    ball.vx = 0
    ball.vy = -3
  }, [])

  const startGame = useCallback(() => {
    playerRef.current = {
      x: 150,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      width: 40,
      height: 60,
      onGround: false,
      color: '#15803d',
    }

    aiPlayerRef.current = {
      x: CANVAS_WIDTH - 190,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      width: 40,
      height: 60,
      onGround: false,
      color: '#ea580c',
    }

    resetBall()

    setGameState({
      player1Score: 0,
      player2Score: 0,
      timeLeft: GAME_DURATION,
      gameRunning: true,
      gameOver: false,
      winner: null,
    })

    // Start timer
    gameTimerRef.current = setInterval(() => {
      setGameState((prev) => {
        const newTimeLeft = prev.timeLeft - 1
        if (newTimeLeft <= 0) {
          const winner =
            prev.player1Score > prev.player2Score
              ? 'Player 1 Wins!'
              : prev.player1Score < prev.player2Score
              ? 'AI Wins!'
              : 'Draw!'
          return {
            ...prev,
            timeLeft: 0,
            gameRunning: false,
            gameOver: true,
            winner,
          }
        }
        return { ...prev, timeLeft: newTimeLeft }
      })
    }, 1000)
  }, [resetBall])

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const width = Math.min(window.innerWidth - 32, 800)
      const height = width * 0.5
      canvas.width = width
      canvas.height = height
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Game loop
  useEffect(() => {
    if (!gameState.gameRunning) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const GROUND_Y = canvas.height - 20

    const gameLoop = () => {
      // Update player
      const player = playerRef.current
      const keys = keysRef.current

      player.vx = 0
      if (keys.has('a') || keys.has('arrowleft')) player.vx = -MOVE_SPEED
      if (keys.has('d') || keys.has('arrowright')) player.vx = MOVE_SPEED
      if ((keys.has('w') || keys.has('arrowup')) && player.onGround) {
        player.vy = JUMP_FORCE
        player.onGround = false
      }

      player.vy += GRAVITY
      player.x += player.vx
      player.y += player.vy

      if (player.y + player.height >= GROUND_Y) {
        player.y = GROUND_Y - player.height
        player.vy = 0
        player.onGround = true
      }

      player.x = Math.max(0, Math.min(canvas.width - player.width, player.x))

      // Update AI
      const ai = aiPlayerRef.current
      const ball = ballRef.current

      ai.vx = 0
      if (ball.x < ai.x + ai.width / 2) ai.vx = -MOVE_SPEED * 0.7
      if (ball.x > ai.x + ai.width / 2) ai.vx = MOVE_SPEED * 0.7
      if (Math.abs(ball.x - ai.x) < 100 && ai.onGround && Math.random() < 0.02) {
        ai.vy = JUMP_FORCE
        ai.onGround = false
      }

      ai.vy += GRAVITY
      ai.x += ai.vx
      ai.y += ai.vy

      if (ai.y + ai.height >= GROUND_Y) {
        ai.y = GROUND_Y - ai.height
        ai.vy = 0
        ai.onGround = true
      }

      ai.x = Math.max(0, Math.min(canvas.width - ai.width, ai.x))

      // Update ball
      ball.vy += GRAVITY * 0.5
      ball.x += ball.vx
      ball.y += ball.vy

      // Ball boundaries
      if (ball.y + ball.radius >= GROUND_Y) {
        ball.y = GROUND_Y - ball.radius
        ball.vy *= -BALL_BOUNCE
      }

      // Goal detection
      if (ball.x - ball.radius < 0) {
        setGameState((prev) => ({ ...prev, player2Score: prev.player2Score + 1 }))
        resetBall()
      }
      if (ball.x + ball.radius > canvas.width) {
        setGameState((prev) => ({ ...prev, player1Score: prev.player1Score + 1 }))
        resetBall()
      }

      // Player-ball collision
      const players = [player, ai]
      players.forEach((p) => {
        const dx = ball.x - Math.max(p.x, Math.min(ball.x, p.x + p.width))
        const dy = ball.y - Math.max(p.y, Math.min(ball.y, p.y + p.height))
        if (dx * dx + dy * dy < ball.radius * ball.radius) {
          const angle = Math.atan2(ball.y - (p.y + p.height / 2), ball.x - (p.x + p.width / 2))
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) + 3
          ball.vx = Math.cos(angle) * speed
          ball.vy = Math.sin(angle) * speed
        }
      })

      // Draw
      // Sky
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      skyGradient.addColorStop(0, '#87CEEB')
      skyGradient.addColorStop(1, '#E0F6FF')
      ctx.fillStyle = skyGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Ground
      ctx.fillStyle = '#22c55e'
      ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y)

      // Center line
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.setLineDash([10, 10])
      ctx.beginPath()
      ctx.moveTo(canvas.width / 2, 0)
      ctx.lineTo(canvas.width / 2, GROUND_Y)
      ctx.stroke()
      ctx.setLineDash([])

      // Goals
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, GROUND_Y - 80, 10, 80) // Left goal
      ctx.fillRect(canvas.width - 10, GROUND_Y - 80, 10, 80) // Right goal

      // Player
      ctx.fillStyle = player.color
      ctx.fillRect(player.x, player.y, player.width, player.height)
      ctx.fillStyle = '#000000'
      ctx.fillRect(player.x + 10, player.y + 10, 8, 8) // Eyes

      // AI Player
      ctx.fillStyle = ai.color
      ctx.fillRect(ai.x, ai.y, ai.width, ai.height)
      ctx.fillStyle = '#000000'
      ctx.fillRect(ai.x + 22, ai.y + 10, 8, 8) // Eyes

      // Ball
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Pentagon pattern on ball
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5
        const x = ball.x + Math.cos(angle) * 8
        const y = ball.y + Math.sin(angle) * 8
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [gameState.gameRunning, resetBall])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-white p-4 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Head Soccer
        </h1>
        <p className="text-sm text-gray-600">
          {context?.user?.displayName || 'Player'}
        </p>
      </div>

      {/* Scores & Timer */}
      <div className="flex gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 px-6 py-3">
          <div className="text-xs text-gray-600 font-bold">You</div>
          <div className="text-3xl font-black text-green-600">
            {gameState.player1Score}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 px-6 py-3">
          <div className="text-xs text-gray-600 font-bold">Time</div>
          <div className="text-2xl font-black text-gray-700">
            {formatTime(gameState.timeLeft)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 px-6 py-3">
          <div className="text-xs text-gray-600 font-bold">AI</div>
          <div className="text-3xl font-black text-red-600">
            {gameState.player2Score}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="bg-white rounded-2xl shadow-xl border-4 border-gray-200"
        />

        {/* Start Overlay */}
        {!gameState.gameRunning && !gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
            <div className="text-center">
              <h2 className="text-3xl font-black text-white mb-6">
                Head Soccer
              </h2>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {gameState.player1Score > gameState.player2Score ? '🏆' : gameState.player1Score < gameState.player2Score ? '😞' : '🤝'}
              </div>
              <h2 className="text-3xl font-black text-white mb-2">
                {gameState.winner}
              </h2>
              <p className="text-xl text-white mb-6">
                Final: {gameState.player1Score} - {gameState.player2Score}
              </p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 text-center text-sm text-gray-600 max-w-md">
        <p className="font-bold mb-2">Controls:</p>
        <div className="flex justify-center gap-4">
          <div>
            <p>⬅️ A / Arrow Left: Move Left</p>
            <p>➡️ D / Arrow Right: Move Right</p>
            <p>⬆️ W / Arrow Up: Jump</p>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      {gameState.gameRunning && (
        <div className="flex gap-4 mt-4">
          <button
            onTouchStart={() => keysRef.current.add('a')}
            onTouchEnd={() => keysRef.current.delete('a')}
            className="bg-white rounded-xl shadow-lg border-2 border-gray-200 px-8 py-4 font-bold active:scale-95"
          >
            ⬅️
          </button>
          <button
            onTouchStart={() => keysRef.current.add('w')}
            onTouchEnd={() => keysRef.current.delete('w')}
            className="bg-white rounded-xl shadow-lg border-2 border-gray-200 px-8 py-4 font-bold active:scale-95"
          >
            ⬆️
          </button>
          <button
            onTouchStart={() => keysRef.current.add('d')}
            onTouchEnd={() => keysRef.current.delete('d')}
            className="bg-white rounded-xl shadow-lg border-2 border-gray-200 px-8 py-4 font-bold active:scale-95"
          >
            ➡️
          </button>
        </div>
      )}
    </div>
  )
}
