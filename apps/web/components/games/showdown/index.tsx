"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStats } from "@/hooks/use-game-stats";
import { useStakeGame } from "@/hooks/use-stake-game";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Skull, Target, Zap, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

type GameState =
  | "waiting"
  | "ready"
  | "countdown"
  | "fire"
  | "result"
  | "staking"
  | "contract_ready";
type Winner = "player" | "ai" | "none";
type GameStats = { playerWins: number; aiWins: number };

// --- Custom UI Components ---

const GameButton = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success";
  className?: string;
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-amber-600 to-orange-700 text-white border-amber-500 shadow-amber-900/50",
    secondary: "bg-stone-800 text-stone-200 border-stone-600 hover:bg-stone-700",
    danger: "bg-gradient-to-r from-red-700 to-rose-800 text-white border-red-500 shadow-red-900/50",
    success: "bg-gradient-to-r from-emerald-600 to-green-700 text-white border-emerald-500 shadow-emerald-900/50",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02, filter: "brightness(1.1)" }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-8 py-4 rounded-xl font-bold text-lg uppercase tracking-wider
        border-b-4 active:border-b-0 active:translate-y-1 transition-all
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        shadow-lg ${variants[variant]} ${className}
      `}
    >
      {children}
    </motion.button>
  );
};

const Modal = ({ isOpen, title, children }: { isOpen: boolean; title?: React.ReactNode; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.9, rotateX: -20 }}
          className="relative w-full max-w-2xl bg-[#2a1a10] border-4 border-[#8b4513] rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
          }}
        >
          {/* Wood texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
          
          {/* Corner decorations */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#d4a373]" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#d4a373]" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#d4a373]" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#d4a373]" />

          {title && (
            <div className="relative bg-[#4a2c18] p-6 border-b-4 border-[#8b4513] text-center shadow-lg">
              <h2 className="text-3xl font-black text-[#fcd34d] tracking-widest uppercase drop-shadow-md flex items-center justify-center gap-3">
                {title}
              </h2>
            </div>
          )}
          
          <div className="p-8 relative z-10">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function QuickDrawGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [winner, setWinner] = useState<Winner>("none");
  const [message, setMessage] = useState("Connect wallet to start staking!");
  const [stats, setStats] = useState<GameStats>({ playerWins: 0, aiWins: 0 });
  const [playerShot, setPlayerShot] = useState(false);
  const [aiShot, setAiShot] = useState(false);
  const [playerFell, setPlayerFell] = useState(false);
  const [aiFell, setAiFell] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showReadyIndicator, setShowReadyIndicator] = useState(false);
  const [showStakeDialog, setShowStakeDialog] = useState(false);
  const [showPostClaimDialog, setShowPostClaimDialog] = useState(false);
  const { updateStats } = useGameStats("showdown");
  const {
    stakeAmount,
    walletConnected,
    stakeForGame: stakeForGameContract,
    endGameWithResult,
    resetLocalGameState,
    isLoading,
  } = useStakeGame("showdown");
  const statsTrackedRef = useRef(false);

  const gameTimerRef = useRef<number | undefined>(undefined);
  const aiReactionRef = useRef<number | undefined>(undefined);
  const animationRef = useRef<number | undefined>(undefined);

  const REWARD = stakeAmount * 2 * 0.9; // 90% of pot

  // Drawing functions (kept same as original)
  const drawCactus = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.fillStyle = "#16a34a";
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.fillRect(x, y, width, height);
    ctx.fillRect(x - 15, y + 20, 15, 30);
    ctx.fillRect(x + width, y + 30, 15, 25);
    ctx.shadowBlur = 0;
  };

  const drawCowboy = (ctx: CanvasRenderingContext2D, x: number, y: number, facing: "left" | "right", shot: boolean, fell: boolean, isPlayer: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    if (facing === "right") ctx.scale(-1, 1);

    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Hat
    ctx.fillStyle = "#8b4513";
    ctx.fillRect(-15, -40, 30, 8);
    ctx.fillRect(-20, -48, 40, 8);

    // Head
    ctx.fillStyle = isPlayer ? "#fbbf24" : "#dc2626";
    ctx.fillRect(-10, -32, 20, 20);

    // Body
    ctx.fillStyle = "#1f2937";
    if (fell) {
      ctx.fillRect(-30, -5, 40, 15);
      ctx.fillStyle = "#92400e";
      ctx.fillRect(-35, -10, 15, 8);
      ctx.fillRect(20, -10, 15, 8);
    } else {
      ctx.fillRect(-12, -12, 24, 30);
      ctx.fillStyle = "#92400e";
      if (shot) {
        ctx.fillRect(12, -8, 20, 6);
        ctx.fillStyle = "#374151";
        ctx.fillRect(32, -6, 8, 3);
      } else {
        ctx.fillRect(-18, -8, 8, 20);
        ctx.fillRect(10, -8, 8, 20);
      }
      ctx.fillStyle = "#1e40af";
      ctx.fillRect(-10, 18, 8, 20);
      ctx.fillRect(2, 18, 8, 20);
    }

    ctx.restore();
  };

  const drawMuzzleFlash = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.globalAlpha = 0.8;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
    gradient.addColorStop(0, "#fef3c7");
    gradient.addColorStop(0.3, "#fbbf24");
    gradient.addColorStop(0.7, "#f59e0b");
    gradient.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawReadyIndicator = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const time = Date.now() * 0.005;
    const alpha = (Math.sin(time) + 1) * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 64px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("READY", x, y);
    ctx.restore();
  };

  const drawFireText = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 40;
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 96px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("FIRE!", x, y);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.strokeText("FIRE!", x, y);
    ctx.restore();
  };

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const time = Date.now() * 0.0001;
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, `hsl(${40 + Math.sin(time) * 5}, 95%, 70%)`);
    skyGradient.addColorStop(0.4, "#fbbf24");
    skyGradient.addColorStop(0.7, "#f59e0b");
    skyGradient.addColorStop(1, "#d97706");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.fillStyle = "#fef3c7";
    ctx.shadowColor = "#fef3c7";
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 80 + Math.sin(time * 2) * 5, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const groundGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
    groundGradient.addColorStop(0, "#92400e");
    groundGradient.addColorStop(1, "#78350f");
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    drawCactus(ctx, 100, canvas.height - 150, 30, 80);
    drawCactus(ctx, canvas.width - 150, canvas.height - 130, 25, 70);

    const playerY = playerFell ? canvas.height - 50 : canvas.height - 120;
    drawCowboy(ctx, 150, playerY, "left", playerShot, playerFell, true);

    const aiY = aiFell ? canvas.height - 50 : canvas.height - 120;
    drawCowboy(ctx, canvas.width - 150, aiY, "right", aiShot, aiFell, false);

    if (playerShot && !playerFell) drawMuzzleFlash(ctx, 180, canvas.height - 100);
    if (aiShot && !aiFell) drawMuzzleFlash(ctx, canvas.width - 180, canvas.height - 100);

    if (showReadyIndicator && gameState === "ready") {
      drawReadyIndicator(ctx, canvas.width / 2, canvas.height / 2 - 50);
    }
    if (gameState === "fire") {
      drawFireText(ctx, canvas.width / 2, canvas.height / 2 - 50);
    }
  }, [playerShot, aiShot, playerFell, aiFell, showReadyIndicator, gameState]);

  const endGame = useCallback((gameWinner: Winner, customMessage?: string) => {
    setGameState("result");
    setWinner(gameWinner);
    if (customMessage) {
      setMessage(customMessage);
    } else if (gameWinner === "player") {
      setMessage("You won the duel!");
      setAiFell(true);
      setStats((prev) => ({ ...prev, playerWins: prev.playerWins + 1 }));
    } else if (gameWinner === "ai") {
      setMessage("The AI outgunned you!");
      setPlayerFell(true);
      setStats((prev) => ({ ...prev, aiWins: prev.aiWins + 1 }));
    }
    setTimeout(() => setShowResultDialog(true), 1000);
    if (gameTimerRef.current) clearTimeout(gameTimerRef.current);
    if (aiReactionRef.current) clearTimeout(aiReactionRef.current);
  }, []);

  const playerShoot = useCallback(() => {
    if (gameState === "fire" && !playerShot) {
      setPlayerShot(true);
      if (!aiShot) endGame("player");
    } else if (gameState === "ready" || gameState === "countdown") {
      setPlayerShot(true);
      endGame("ai", "You shot too early!");
    }
  }, [gameState, playerShot, aiShot, endGame]);

  const resetGame = useCallback(() => {
    setGameState("staking");
    setMessage("Stake 2 GEM to play against 1 AI bot!");
    setWinner("none");
    setPlayerShot(false);
    setAiShot(false);
    setPlayerFell(false);
    setAiFell(false);
    setShowReadyIndicator(false);
    setShowResultDialog(false);
    setShowInstructions(false);
    statsTrackedRef.current = false;
    if (gameTimerRef.current) clearTimeout(gameTimerRef.current);
    if (aiReactionRef.current) clearTimeout(aiReactionRef.current);
  }, []);

  useEffect(() => {
    if (gameState === "result" && winner !== "none" && !statsTrackedRef.current) {
      statsTrackedRef.current = true;
      const playerWon = winner === "player";
      updateStats({ playerWon, tie: false });
      endGameWithResult(playerWon, false);
    }
  }, [gameState, winner, updateStats, endGameWithResult]);

  const handleStakeAndPlay = async () => {
    const success = await stakeForGameContract();
    if (!success) return;

    setGameState("ready");
    setMessage("Get ready...");
    setShowReadyIndicator(true);
    gameTimerRef.current = window.setTimeout(() => {
      setShowReadyIndicator(false);
      setGameState("countdown");
      setMessage("Wait for it...");
      const delay = Math.random() * 2000 + 1000;
      gameTimerRef.current = window.setTimeout(() => {
        setGameState("fire");
        setMessage("FIRE!");
        const aiReactionTime = Math.random() * 800 + 200;
        aiReactionRef.current = window.setTimeout(() => {
          if (!playerShot) {
            setAiShot(true);
            endGame("ai");
          }
        }, aiReactionTime);
      }, delay);
    }, 2000);
    setShowStakeDialog(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "KeyA") {
        e.preventDefault();
        playerShoot();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [playerShoot]);

  useEffect(() => {
    const animate = () => {
      drawScene();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [drawScene]);

  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearTimeout(gameTimerRef.current);
      if (aiReactionRef.current) clearTimeout(aiReactionRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#2a1a10] overflow-hidden font-mono">
      {/* Instruction Dialog */}
      <Modal isOpen={showInstructions} title="Quick Draw">
        <div className="space-y-6 text-[#fcd34d]">
          <div className="bg-black/30 p-6 rounded-lg border-2 border-[#8b4513]">
            <h3 className="text-xl font-bold mb-4 text-center underline decoration-2 underline-offset-4">HOW TO PLAY</h3>
            <ul className="space-y-4 text-lg">
              <li className="flex items-center gap-4">
                <span className="text-2xl">💰</span>
                <span>Stake <span className="text-white font-bold">{stakeAmount} Monad</span> to duel</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="text-2xl">⏰</span>
                <span>Wait for <span className="text-red-500 font-bold">FIRE!</span></span>
              </li>
              <li className="flex items-center gap-4">
                <span className="text-2xl">🔫</span>
                <span>Press <span className="bg-[#8b4513] px-2 py-1 rounded text-white border border-[#d4a373]">A</span> or Click to shoot</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-[#4a2c18] p-3 rounded border border-[#8b4513]">
              <div className="text-xs text-[#d4a373]">STAKE</div>
              <div className="font-bold text-xl">{stakeAmount}</div>
            </div>
            <div className="bg-[#4a2c18] p-3 rounded border border-[#8b4513]">
              <div className="text-xs text-[#d4a373]">PRIZE</div>
              <div className="font-bold text-xl text-green-400">{REWARD.toFixed(1)}</div>
            </div>
            <div className="bg-[#4a2c18] p-3 rounded border border-[#8b4513]">
              <div className="text-xs text-[#d4a373]">BOTS</div>
              <div className="font-bold text-xl">1</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            {!walletConnected && (
              <p className="text-center text-red-400 text-sm font-bold animate-pulse">
                ⚠️ CONNECT WALLET TO PLAY
              </p>
            )}
            <GameButton
              onClick={() => {
                setShowInstructions(false);
                setShowStakeDialog(true);
              }}
              disabled={!walletConnected}
              variant="primary"
              className="w-full"
            >
              Start Duel
            </GameButton>
            <Link href="/games" className="w-full">
              <GameButton variant="secondary" className="w-full">
                Exit Saloon
              </GameButton>
            </Link>
          </div>
        </div>
      </Modal>

      {/* Staking Dialog */}
      <Modal isOpen={showStakeDialog} title="Place Your Bet">
        <div className="space-y-6 text-[#fcd34d]">
          <div className="bg-black/30 p-6 rounded-lg border-2 border-[#8b4513] space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span>Your Stake:</span>
              <span className="font-bold text-white text-xl">{stakeAmount} Monad</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span>Opponent:</span>
              <span className="font-bold text-red-400 text-xl">{stakeAmount} Monad</span>
            </div>
            <div className="h-px bg-[#8b4513]" />
            <div className="flex justify-between items-center text-xl font-bold text-green-400">
              <span>Pot Size:</span>
              <span>{REWARD.toFixed(2)} Monad</span>
            </div>
          </div>
          
          <GameButton
            onClick={handleStakeAndPlay}
            disabled={!walletConnected || isLoading}
            variant="success"
            className="w-full"
          >
            {isLoading ? "Placing Bet..." : "Stake & Draw!"}
          </GameButton>
        </div>
      </Modal>

      {/* Result Dialog */}
      <Modal isOpen={showResultDialog} title={winner === "player" ? "VICTORY" : "DEFEAT"}>
        <div className="space-y-6 text-center">
          <div className="flex justify-center mb-4">
             {winner === "player" ? (
               <Trophy className="w-24 h-24 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
             ) : (
               <Skull className="w-24 h-24 text-stone-500 drop-shadow-[0_0_15px_rgba(120,113,108,0.5)]" />
             )}
          </div>
          
          <p className="text-2xl font-bold text-white tracking-wide">{message}</p>

          {winner === "player" && (
            <div className="bg-green-900/40 border-2 border-green-600 p-4 rounded-lg">
              <p className="text-green-400 font-bold text-xl">You won {REWARD.toFixed(2)} Monad!</p>
            </div>
          )}

          <GameButton
            onClick={() => {
              resetLocalGameState();
              setShowResultDialog(false);
              setShowPostClaimDialog(true);
            }}
            disabled={isLoading}
            variant={winner === "player" ? "success" : "secondary"}
            className="w-full"
          >
            {isLoading ? "Processing..." : "Continue"}
          </GameButton>
        </div>
      </Modal>

      {/* Post Claim Dialog */}
      <Modal isOpen={showPostClaimDialog} title="Duel Over">
        <div className="space-y-6 text-center">
          <p className="text-xl text-[#fcd34d]">Fancy another round, partner?</p>
          <div className="flex flex-col gap-4">
            <GameButton
              onClick={() => {
                setShowPostClaimDialog(false);
                resetGame();
                setShowStakeDialog(true);
              }}
              variant="primary"
            >
              Play Again
            </GameButton>
            <Link href="/games" className="w-full">
              <GameButton variant="secondary" className="w-full">
                Leave Town
              </GameButton>
            </Link>
          </div>
        </div>
      </Modal>

      {/* Game Canvas & HUD */}
      <div className="relative w-full h-full flex flex-col">
        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-6 pointer-events-none">
          {/* Player Stats */}
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border-2 border-blue-500/50 shadow-lg transform -skew-x-12">
            <div className="transform skew-x-12 text-center">
              <div className="text-xs text-blue-300 font-bold uppercase tracking-widest">You</div>
              <div className="text-4xl font-black text-white">{stats.playerWins}</div>
            </div>
          </div>

          {/* VS / Pool */}
          <div className="bg-[#4a2c18]/80 backdrop-blur-md px-6 py-2 rounded-b-xl border-x-2 border-b-2 border-[#8b4513] shadow-lg mt-[-24px]">
             <div className="text-center">
               <span className="text-[#d4a373] text-xs font-bold tracking-widest">POOL</span>
               <div className="text-2xl font-bold text-[#fcd34d]">{REWARD.toFixed(1)}</div>
             </div>
          </div>

          {/* AI Stats */}
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border-2 border-red-500/50 shadow-lg transform skew-x-12">
            <div className="transform -skew-x-12 text-center">
              <div className="text-xs text-red-300 font-bold uppercase tracking-widest">Outlaw</div>
              <div className="text-4xl font-black text-white">{stats.aiWins}</div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          className="w-full h-full object-cover cursor-crosshair"
          onClick={playerShoot}
        />

        {/* Message Bar */}
        <div className="absolute bottom-12 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={message}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-black/70 backdrop-blur-md px-8 py-4 rounded-full border-2 border-[#fcd34d]/50 shadow-2xl"
            >
              <p className="text-2xl font-bold text-[#fcd34d] tracking-wider uppercase text-shadow">
                {message}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
