import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Timer,
  User,
  Cpu,
  Wallet,
  RotateCcw,
  ArrowLeft,
  Medal,
} from "lucide-react";
import Link from "next/link";
import { GameState } from "./types";
import { GameButton, Modal, Badge } from "./ui-components";

export const HeadSoccerHUD = ({
  gameState,
  formatTime,
}: {
  gameState: GameState;
  formatTime: (s: number) => string;
}) => (
  <AnimatePresence>
    {gameState.gameRunning && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none"
      >
        {/* Player 1 Score */}
        <div className="flex flex-col items-center gap-1">
          <div className="bg-linear-to-b from-blue-500 to-blue-700 text-white font-black text-4xl px-4 py-2 rounded-lg shadow-[0_4px_0_rgb(30,58,138)] border border-blue-400 min-w-20 text-center">
            {gameState.player1Score}
          </div>
          <Badge className="bg-blue-900/80 text-blue-200 border border-blue-500/30 backdrop-blur-sm">
            YOU
          </Badge>
        </div>

        {/* Timer */}
        <div className="bg-slate-900/90 text-white font-mono font-bold text-3xl px-6 py-3 rounded-b-2xl shadow-xl border-x-2 border-b-2 border-slate-700 backdrop-blur-md -mt-4 flex items-center gap-2">
          <Timer className="w-5 h-5 text-orange-400" />
          {formatTime(gameState.timeLeft)}
        </div>

        {/* Player 2 Score */}
        <div className="flex flex-col items-center gap-1">
          <div className="bg-linear-to-b from-red-500 to-red-700 text-white font-black text-4xl px-4 py-2 rounded-lg shadow-[0_4px_0_rgb(153,27,27)] border border-red-400 min-w-20 text-center">
            {gameState.player2Score}
          </div>
          <Badge className="bg-red-900/80 text-red-200 border border-red-500/30 backdrop-blur-sm">
            CPU
          </Badge>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const ControlsHint = () => (
  <div className="hidden sm:flex gap-8 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-900/50 px-6 py-3 rounded-full border border-slate-800/50 backdrop-blur-sm">
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <span className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded border border-slate-700 text-slate-300 shadow-sm">
          W
        </span>
        <span className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded border border-slate-700 text-slate-300 shadow-sm">
          A
        </span>
        <span className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded border border-slate-700 text-slate-300 shadow-sm">
          D
        </span>
      </div>
      <span>Move & Jump</span>
    </div>
    <div className="w-px h-6 bg-slate-800" />
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded border border-slate-700 text-slate-300 shadow-sm">
        W
      </span>
      <span>Super Shot</span>
    </div>
  </div>
);

interface StartGameModalProps {
  gameState: GameState;
  contractConfigured: boolean;
  walletConnected: boolean;
  stakeMode: boolean;
  stakeAmount: number;
  reward: number;
  setStakeMode: (mode: boolean) => void;
  startGame: () => void;
}

export const StartGameModal = ({
  gameState,
  contractConfigured,
  walletConnected,
  stakeMode,
  stakeAmount,
  reward,
  setStakeMode,
  startGame,
}: StartGameModalProps) => (
  <Modal
    isOpen={!gameState.gameRunning && !gameState.gameOver}
    title={
      <div className="flex flex-col items-center gap-2">
        <Trophy className="w-12 h-12 text-yellow-400" />
        <span>Ready to Play?</span>
      </div>
    }
  >
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold">
            <User className="w-4 h-4" /> Player 1
          </div>
          <p className="text-slate-400 text-sm">
            Control your player to score goals against the AI.
          </p>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <Cpu className="w-4 h-4" /> AI Rival
          </div>
          <p className="text-slate-400 text-sm">
            Defeat the computer to win rewards!
          </p>
        </div>
      </div>

      {contractConfigured && walletConnected && (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                stakeMode
                  ? "bg-green-500/20 text-green-400"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-white">Stake Mode</p>
              <p className="text-xs text-slate-400">
                Win {reward.toFixed(2)} Monad
              </p>
            </div>
          </div>
          <button
            onClick={() => setStakeMode(!stakeMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              stakeMode ? "bg-green-500" : "bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                stakeMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <GameButton
          onClick={startGame}
          disabled={stakeMode && !walletConnected}
          variant={stakeMode ? "success" : "primary"}
          className="w-full"
          size="lg"
        >
          {stakeMode ? `Stake ${stakeAmount} Monad & Play` : "Start Match"}
        </GameButton>

        <Link href="/games" className="w-full">
          <GameButton variant="secondary" className="w-full">
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </GameButton>
        </Link>
      </div>
    </div>
  </Modal>
);

interface GameOverModalProps {
  gameState: GameState;
  stakeMode: boolean;
  isLoading: boolean;
  stakeAmount: number;
  reward: number;
  drawRefund: number;
  resetLocalGameState: () => void;
  startGame: () => void;
}

export const GameOverModal = ({
  gameState,
  stakeMode,
  isLoading,
  stakeAmount,
  reward,
  drawRefund,
  resetLocalGameState,
  startGame,
}: GameOverModalProps) => (
  <Modal
    isOpen={gameState.gameOver}
    title={
      <div className="flex flex-col items-center gap-2">
        {gameState.winner === "Player 1" ? (
          <Medal className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        ) : gameState.winner === "Tie" ? (
          <RotateCcw className="w-12 h-12 text-blue-400" />
        ) : (
          <div className="text-6xl">💀</div>
        )}
        <span
          className={
            gameState.winner === "Player 1" ? "text-yellow-400" : "text-white"
          }
        >
          {gameState.winner === "Player 1"
            ? "VICTORY!"
            : gameState.winner === "Tie"
            ? "DRAW"
            : "DEFEAT"}
        </span>
      </div>
    }
  >
    <div className="space-y-6 text-center">
      <div className="flex justify-center items-center gap-8 py-4">
        <div className="text-center">
          <div className="text-5xl font-black text-blue-500">
            {gameState.player1Score}
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase mt-1">
            You
          </div>
        </div>
        <div className="text-2xl font-black text-slate-700">-</div>
        <div className="text-center">
          <div className="text-5xl font-black text-red-500">
            {gameState.player2Score}
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase mt-1">
            CPU
          </div>
        </div>
      </div>

      {stakeMode && (
        <div
          className={`p-4 rounded-xl border ${
            gameState.winner === "Player 1"
              ? "bg-green-900/30 border-green-500/50 text-green-400"
              : gameState.winner === "Tie"
              ? "bg-blue-900/30 border-blue-500/50 text-blue-400"
              : "bg-red-900/30 border-red-500/50 text-red-400"
          }`}
        >
          <p className="font-bold text-lg">
            {isLoading
              ? "Processing Transaction..."
              : gameState.winner === "Player 1"
              ? `You won ${reward.toFixed(2)} Monad!`
              : gameState.winner === "Tie"
              ? `Draw - ${drawRefund.toFixed(2)} Monad returned (10% fee)`
              : `Lost ${stakeAmount} Monad`}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <GameButton
          onClick={() => {
            if (stakeMode) resetLocalGameState();
            startGame();
          }}
          disabled={isLoading}
          variant="primary"
          className="w-full"
          size="lg"
        >
          Play Again
        </GameButton>

        <Link href="/games" className="w-full">
          <GameButton variant="secondary" className="w-full">
            Exit to Menu
          </GameButton>
        </Link>
      </div>
    </div>
  </Modal>
);
