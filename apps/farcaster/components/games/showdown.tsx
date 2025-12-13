'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useFrame } from '@/components/farcaster-provider'

type GameState = 'waiting' | 'ready' | 'countdown' | 'fire' | 'result'
type Winner = 'player' | 'ai' | 'none'

export default function ShowdownGame() {
  const { context } = useFrame()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [winner, setWinner] = useState<Winner>('none')
  const [message, setMessage] = useState('Tap "Start Duel" to begin!')
  const [stats, setStats] = useState({ playerWins: 0, aiWins: 0 })
  const [playerShot, setPlayerShot] = useState(false)
  const [aiShot, setAiShot] = useState(false)
  const [playerFell, setPlayerFell] = useState(false)
  const [aiFell, setAiFell] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [showReadyIndicator, setShowReadyIndicator] = useState(false)

  const gameTimerRef = useRef<number | undefined>(undefined)
  const aiReactionRef = useRef<number | undefined>(undefined)
  const animationRef = useRef<number | undefined>(undefined)

  // Drawing functions
  const drawCactus = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    ctx.fillStyle = '#16a34a'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = 5
    ctx.fillRect(x, y, width, height)
    ctx.fillRect(x - 15, y + 20, 15, 30)
    ctx.fillRect(x + width, y + 30, 15, 25)
    ctx.shadowBlur = 0
  }

  const drawCowboy = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: 'left' | 'right',
    shot: boolean,
    fell: boolean,
    isPlayer: boolean
  ) => {
    ctx.save()
    ctx.translate(x, y)
    if (facing === 'right') ctx.scale(-1, 1)

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 4

    // Hat
    ctx.fillStyle = '#8b4513'
    ctx.fillRect(-15, -40, 30, 8)
    ctx.fillRect(-20, -48, 40, 8)

    // Head
    ctx.fillStyle = isPlayer ? '#fbbf24' : '#dc2626'
    ctx.fillRect(-10, -32, 20, 20)

    // Body
    ctx.fillStyle = '#1f2937'
    if (fell) {
      ctx.fillRect(-30, -5, 40, 15)
      ctx.fillStyle = '#92400e'
      ctx.fillRect(-35, -10, 15, 8)
      ctx.fillRect(20, -10, 15, 8)
    } else {
      ctx.fillRect(-12, -12, 24, 30)
      ctx.fillStyle = '#92400e'
      if (shot) {
        ctx.fillRect(12, -8, 20, 6)
        ctx.fillStyle = '#374151'
        ctx.fillRect(32, -6, 8, 3)
      } else {
        ctx.fillRect(-18, -8, 8, 20)
        ctx.fillRect(10, -8, 8, 20)
      }
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(-10, 18, 8, 20)
      ctx.fillRect(2, 18, 8, 20)
    }

    ctx.restore()
  }

  const drawMuzzleFlash = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    ctx.save()
    ctx.globalAlpha = 0.8
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20)
    gradient.addColorStop(0, '#fef3c7')
    gradient.addColorStop(0.3, '#fbbf24')
    gradient.addColorStop(0.7, '#f59e0b')
    gradient.addColorStop(1, 'rgba(245, 158, 11, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fef3c7'
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const drawReadyIndicator = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    const time = Date.now() * 0.005
    const alpha = (Math.sin(time) + 1) * 0.5
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.shadowColor = '#fbbf24'
    ctx.shadowBlur = 30
    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 64px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('READY', x, y)
    ctx.restore()
  }

  const drawFireText = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save()
    ctx.shadowColor = '#ef4444'
    ctx.shadowBlur = 40
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 96px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('FIRE!', x, y)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.strokeText('FIRE!', x, y)
    ctx.restore()
  }

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const time = Date.now() * 0.0001
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    skyGradient.addColorStop(0, `hsl(${40 + Math.sin(time) * 5}, 95%, 70%)`)
    skyGradient.addColorStop(0.4, '#fbbf24')
    skyGradient.addColorStop(0.7, '#f59e0b')
    skyGradient.addColorStop(1, '#d97706')
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.fillStyle = '#fef3c7'
    ctx.shadowColor = '#fef3c7'
    ctx.shadowBlur = 40
    ctx.beginPath()
    ctx.arc(
      canvas.width - 100,
      80 + Math.sin(time * 2) * 5,
      45,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.restore()

    const groundGradient = ctx.createLinearGradient(
      0,
      canvas.height - 100,
      0,
      canvas.height
    )
    groundGradient.addColorStop(0, '#92400e')
    groundGradient.addColorStop(1, '#78350f')
    ctx.fillStyle = groundGradient
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100)

    drawCactus(ctx, 100, canvas.height - 150, 30, 80)
    drawCactus(ctx, canvas.width - 150, canvas.height - 130, 25, 70)

    const playerY = playerFell ? canvas.height - 50 : canvas.height - 120
    drawCowboy(ctx, 150, playerY, 'left', playerShot, playerFell, true)

    const aiY = aiFell ? canvas.height - 50 : canvas.height - 120
    drawCowboy(ctx, canvas.width - 150, aiY, 'right', aiShot, aiFell, false)

    if (playerShot && !playerFell)
      drawMuzzleFlash(ctx, 180, canvas.height - 100)
    if (aiShot && !aiFell)
      drawMuzzleFlash(ctx, canvas.width - 180, canvas.height - 100)

    if (showReadyIndicator && gameState === 'ready') {
      drawReadyIndicator(ctx, canvas.width / 2, canvas.height / 2 - 50)
    }
    if (gameState === 'fire') {
      drawFireText(ctx, canvas.width / 2, canvas.height / 2 - 50)
    }
  }, [
    playerShot,
    aiShot,
    playerFell,
    aiFell,
    showReadyIndicator,
    gameState,
  ])

  const endGame = useCallback(
    (gameWinner: Winner, customMessage?: string) => {
      setGameState('result')
      setWinner(gameWinner)
      if (customMessage) {
        setMessage(customMessage)
      } else if (gameWinner === 'player') {
        setMessage('You won the duel!')
        setAiFell(true)
        setStats((prev) => ({ ...prev, playerWins: prev.playerWins + 1 }))
      } else if (gameWinner === 'ai') {
        setMessage('The AI outgunned you!')
        setPlayerFell(true)
        setStats((prev) => ({ ...prev, aiWins: prev.aiWins + 1 }))
      }
      setTimeout(() => setShowResultDialog(true), 1000)
      if (gameTimerRef.current) clearTimeout(gameTimerRef.current)
      if (aiReactionRef.current) clearTimeout(aiReactionRef.current)
    },
    []
  )

  const playerShoot = useCallback(() => {
    if (gameState === 'fire' && !playerShot) {
      setPlayerShot(true)
      if (!aiShot) endGame('player')
    } else if (gameState === 'ready' || gameState === 'countdown') {
      setPlayerShot(true)
      endGame('ai', 'You shot too early!')
    }
  }, [gameState, playerShot, aiShot, endGame])

  const startGame = useCallback(() => {
    setGameState('ready')
    setMessage('Get ready...')
    setShowReadyIndicator(true)
    setPlayerShot(false)
    setAiShot(false)
    setPlayerFell(false)
    setAiFell(false)
    setWinner('none')
    setShowResultDialog(false)

    gameTimerRef.current = window.setTimeout(() => {
      setShowReadyIndicator(false)
      setGameState('countdown')
      setMessage('Wait for it...')
      const delay = Math.random() * 2000 + 1000
      gameTimerRef.current = window.setTimeout(() => {
        setGameState('fire')
        setMessage('FIRE!')
        const aiReactionTime = Math.random() * 800 + 200
        aiReactionRef.current = window.setTimeout(() => {
          if (!playerShot) {
            setAiShot(true)
            endGame('ai')
          }
        }, aiReactionTime)
      }, delay)
    }, 2000)
  }, [endGame, playerShot])

  const resetGame = useCallback(() => {
    setGameState('waiting')
    setMessage('Tap "Start Duel" to begin!')
    setWinner('none')
    setPlayerShot(false)
    setAiShot(false)
    setPlayerFell(false)
    setAiFell(false)
    setShowReadyIndicator(false)
    setShowResultDialog(false)
    if (gameTimerRef.current) clearTimeout(gameTimerRef.current)
    if (aiReactionRef.current) clearTimeout(aiReactionRef.current)
  }, [])

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const container = canvas.parentElement
      if (!container) return
      
      const width = Math.min(window.innerWidth - 32, 800)
      const height = width * 0.5
      
      canvas.width = width
      canvas.height = height
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      drawScene()
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [drawScene])

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearTimeout(gameTimerRef.current)
      if (aiReactionRef.current) clearTimeout(aiReactionRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#2a1a10] relative">
      {/* Instructions Overlay */}
      {showInstructions && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#2a1a10] border-4 border-[#8b4513] rounded-sm p-8 max-w-md w-full">
            <h2 className="text-3xl font-black text-[#fcd34d] text-center mb-6">
              QUICK DRAW
            </h2>
            
            <div className="space-y-4 text-[#fcd34d] mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <span>Wait for <strong className="text-red-500">FIRE!</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔫</span>
                <span>Tap screen or press A to shoot</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <span>Don't shoot early!</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowInstructions(false)
                startGame()
              }}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-700 text-white py-4 px-6 rounded font-bold text-lg"
            >
              START DUEL
            </button>
          </div>
        </div>
      )}

      {/* Result Dialog */}
      {showResultDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#2a1a10] border-4 border-[#8b4513] rounded-sm p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">
              {winner === 'player' ? '🏆' : '💀'}
            </div>
            <h2 className="text-3xl font-black text-[#fcd34d] mb-4">
              {winner === 'player' ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <p className="text-xl text-white mb-6">{message}</p>

            {winner === 'player' && (
              <div className="bg-green-900/40 border-2 border-green-600 p-4 rounded mb-6">
                <p className="text-green-400 font-bold">You won!</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowResultDialog(false)
                  startGame()
                }}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-700 text-white py-4 px-6 rounded font-bold"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={resetGame}
                className="w-full bg-stone-800 text-stone-200 py-4 px-6 rounded font-bold"
              >
                EXIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game UI */}
      <div className="relative">
        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-4">
          <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border-2 border-blue-500/50">
            <div className="text-xs text-blue-300 font-bold">YOU</div>
            <div className="text-3xl font-black text-white">
              {stats.playerWins}
            </div>
          </div>

          <div className="bg-[#4a2c18]/80 backdrop-blur-md px-4 py-2 rounded-b-xl border-2 border-[#8b4513]">
            <div className="text-center">
              <span className="text-[#d4a373] text-xs font-bold">VS</span>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border-2 border-red-500/50">
            <div className="text-xs text-red-300 font-bold">AI</div>
            <div className="text-3xl font-black text-white">
              {stats.aiWins}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          onClick={playerShoot}
        />

        {/* Message Bar */}
        <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center">
          <div className="bg-black/70 backdrop-blur-md px-6 py-3 rounded-full border-2 border-[#fcd34d]/50">
            <p className="text-xl font-bold text-[#fcd34d]">{message}</p>
          </div>
        </div>

        {/* Shoot Button */}
        {gameState === 'fire' && !playerShot && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center z-10">
            <button
              onClick={playerShoot}
              className="bg-red-600 text-white px-12 py-6 rounded-xl font-black text-2xl animate-pulse"
            >
              SHOOT!
            </button>
          </div>
        )}
      </div>

      {/* Player info */}
      <div className="absolute bottom-4 left-4 text-xs text-[#d4a373]">
        {context?.user?.displayName || 'Player'}
      </div>
    </div>
  )
}
