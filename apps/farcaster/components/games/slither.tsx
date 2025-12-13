'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useFrame } from '@/components/farcaster-provider'

interface Point {
  x: number
  y: number
}

interface Orb {
  x: number
  y: number
  color: string
  size: number
}

interface Bot {
  segments: Point[]
  color: string
  name: string
}

const WORLD_WIDTH = 3000
const WORLD_HEIGHT = 2000
const SNAKE_SPEED = 3
const INITIAL_LENGTH = 8
const ORB_COUNT = 100

export default function SlitherGame() {
  const { context } = useFrame()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const mouseRef = useRef<Point>({ x: 0, y: 0 })

  const [gameStarted, setGameStarted] = useState(false)
  const [isAlive, setIsAlive] = useState(true)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const snakeRef = useRef<Point[]>([])
  const orbsRef = useRef<Orb[]>([])
  const botsRef = useRef<Bot[]>([])
  const cameraRef = useRef<Point>({ x: 0, y: 0 })

  const getRandomColor = () => {
    const colors = [
      '#ef4444',
      '#f59e0b',
      '#10b981',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
    ]
    return colors[Math.floor(Math.random() * colors.length)]!
  }

  const initializeGame = useCallback(() => {
    // Initialize snake
    const startX = WORLD_WIDTH / 2
    const startY = WORLD_HEIGHT / 2
    const segments: Point[] = []
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      segments.push({ x: startX - i * 10, y: startY })
    }
    snakeRef.current = segments

    // Initialize orbs
    const orbs: Orb[] = []
    for (let i = 0; i < ORB_COUNT; i++) {
      orbs.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        color: getRandomColor(),
        size: 8,
      })
    }
    orbsRef.current = orbs

    // Initialize bots
    const bots: Bot[] = []
    for (let i = 0; i < 5; i++) {
      const botSegments: Point[] = []
      const botX = Math.random() * WORLD_WIDTH
      const botY = Math.random() * WORLD_HEIGHT
      for (let j = 0; j < 10; j++) {
        botSegments.push({ x: botX - j * 10, y: botY })
      }
      bots.push({
        segments: botSegments,
        color: getRandomColor(),
        name: `Bot ${i + 1}`,
      })
    }
    botsRef.current = bots

    setScore(0)
    setIsAlive(true)
    setGameOver(false)
    setGameStarted(true)
  }, [])

  // Mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  // Touch movement
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    if (touch) {
      mouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    }
  }, [])

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const width = Math.min(window.innerWidth - 32, 800)
      const height = Math.min(window.innerHeight - 200, 600)
      canvas.width = width
      canvas.height = height
    }

    resize()
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('resize', resize)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('resize', resize)
    }
  }, [handleMouseMove, handleTouchMove])

  // Game loop
  useEffect(() => {
    if (!gameStarted || !isAlive) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = () => {
      // Update snake
      const head = snakeRef.current[0]!
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      const dx = mouseRef.current.x - centerX
      const dy = mouseRef.current.y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        const newHead: Point = {
          x: head.x + (dx / distance) * SNAKE_SPEED,
          y: head.y + (dy / distance) * SNAKE_SPEED,
        }

        // Check boundaries
        if (
          newHead.x < 20 ||
          newHead.x > WORLD_WIDTH - 20 ||
          newHead.y < 20 ||
          newHead.y > WORLD_HEIGHT - 20
        ) {
          setIsAlive(false)
          setGameOver(true)
          return
        }

        // Update segments
        snakeRef.current = [newHead, ...snakeRef.current.slice(0, -1)]
      }

      // Update camera to follow snake
      cameraRef.current = {
        x: head.x - canvas.width / 2,
        y: head.y - canvas.height / 2,
      }

      // Collect orbs
      orbsRef.current = orbsRef.current.filter((orb) => {
        const distToOrb = Math.hypot(orb.x - head.x, orb.y - head.y)
        if (distToOrb < 20) {
          setScore((s) => s + 1)
          snakeRef.current.push({ ...snakeRef.current[snakeRef.current.length - 1]! })
          // Spawn new orb
          orbsRef.current.push({
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            color: getRandomColor(),
            size: 8,
          })
          return false
        }
        return true
      })

      // Simple bot AI
      botsRef.current.forEach((bot) => {
        const botHead = bot.segments[0]!
        // Move towards nearest orb
        const nearestOrb = orbsRef.current.reduce((nearest, orb) => {
          const dist = Math.hypot(orb.x - botHead.x, orb.y - botHead.y)
          if (!nearest || dist < Math.hypot(nearest.x - botHead.x, nearest.y - botHead.y)) {
            return orb
          }
          return nearest
        }, null as Orb | null)

        if (nearestOrb) {
          const dx = nearestOrb.x - botHead.x
          const dy = nearestOrb.y - botHead.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 0) {
            const newHead: Point = {
              x: botHead.x + (dx / dist) * SNAKE_SPEED * 0.8,
              y: botHead.y + (dy / dist) * SNAKE_SPEED * 0.8,
            }
            // Keep bot in bounds
            newHead.x = Math.max(20, Math.min(WORLD_WIDTH - 20, newHead.x))
            newHead.y = Math.max(20, Math.min(WORLD_HEIGHT - 20, newHead.y))
            bot.segments = [newHead, ...bot.segments.slice(0, -1)]
          }
        }
      })

      // Clear canvas
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = '#16213e'
      ctx.lineWidth = 1
      for (let x = 0; x < WORLD_WIDTH; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x - cameraRef.current.x, 0)
        ctx.lineTo(x - cameraRef.current.x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < WORLD_HEIGHT; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y - cameraRef.current.y)
        ctx.lineTo(canvas.width, y - cameraRef.current.y)
        ctx.stroke()
      }

      // Draw boundaries
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 4
      ctx.strokeRect(
        -cameraRef.current.x,
        -cameraRef.current.y,
        WORLD_WIDTH,
        WORLD_HEIGHT
      )

      // Draw orbs
      orbsRef.current.forEach((orb) => {
        ctx.fillStyle = orb.color
        ctx.beginPath()
        ctx.arc(
          orb.x - cameraRef.current.x,
          orb.y - cameraRef.current.y,
          orb.size,
          0,
          Math.PI * 2
        )
        ctx.fill()
      })

      // Draw bots
      botsRef.current.forEach((bot) => {
        ctx.fillStyle = bot.color
        bot.segments.forEach((segment, i) => {
          ctx.beginPath()
          ctx.arc(
            segment.x - cameraRef.current.x,
            segment.y - cameraRef.current.y,
            10 - i * 0.3,
            0,
            Math.PI * 2
          )
          ctx.fill()
        })
      })

      // Draw player snake
      ctx.fillStyle = '#10b981'
      snakeRef.current.forEach((segment, i) => {
        ctx.beginPath()
        ctx.arc(
          segment.x - cameraRef.current.x,
          segment.y - cameraRef.current.y,
          12 - i * 0.3,
          0,
          Math.PI * 2
        )
        ctx.fill()

        // Draw eyes on head
        if (i === 0) {
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(
            segment.x - cameraRef.current.x + 5,
            segment.y - cameraRef.current.y - 3,
            3,
            0,
            Math.PI * 2
          )
          ctx.fill()
          ctx.beginPath()
          ctx.arc(
            segment.x - cameraRef.current.x - 5,
            segment.y - cameraRef.current.y - 3,
            3,
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
      })

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [gameStarted, isAlive])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white p-4 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Slither
        </h1>
        <p className="text-sm text-gray-600">
          {context?.user?.displayName || 'Player'}
        </p>
      </div>

      {/* Score & Length */}
      <div className="flex gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 px-6 py-2">
          <div className="text-xs text-gray-600 font-bold">Score</div>
          <div className="text-2xl font-black text-purple-600">{score}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 px-6 py-2">
          <div className="text-xs text-gray-600 font-bold">Length</div>
          <div className="text-2xl font-black text-green-600">
            {snakeRef.current.length}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="bg-[#1a1a2e] rounded-2xl shadow-xl border-4 border-white cursor-none"
        />

        {/* Start Screen */}
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl">
            <div className="text-center">
              <h2 className="text-4xl font-black text-white mb-6">🐍 Slither</h2>
              <p className="text-white mb-6">Move mouse/finger to control</p>
              <button
                onClick={initializeGame}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl">
            <div className="text-center">
              <h2 className="text-4xl font-black text-white mb-4">Game Over!</h2>
              <p className="text-2xl text-white mb-2">Score: {score}</p>
              <p className="text-xl text-white mb-6">
                Length: {snakeRef.current.length}
              </p>
              <button
                onClick={initializeGame}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {gameStarted && isAlive && (
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>🎯 Collect orbs to grow</p>
          <p>🚫 Don't hit boundaries or other snakes</p>
          <p>🖱️ Move mouse/finger to control</p>
        </div>
      )}
    </div>
  )
}
