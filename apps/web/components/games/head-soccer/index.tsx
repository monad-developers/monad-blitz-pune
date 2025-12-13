"use client";
import { useHeadSoccerGame } from "./use-head-soccer-game";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./types";
import {
  HeadSoccerHUD,
  ControlsHint,
  StartGameModal,
  GameOverModal,
} from "./game-overlays";

export default function HeadSoccer() {
  const {
    canvasRef,
    gameState,
    startGame,
    stakeMode,
    setStakeMode,
    stakeAmount,
    reward,
    drawRefund,
    walletConnected,
    contractConfigured,
    isLoading,
    resetLocalGameState,
  } = useHeadSoccerGame();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full h-full min-h-[600px] bg-slate-950 overflow-hidden font-sans select-none flex flex-col">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-4 gap-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_2px_10px_rgba(234,88,12,0.5)]">
            HEAD SOCCER
          </h1>
          <div className="flex items-center justify-center gap-2 text-slate-500 font-bold tracking-[0.2em] text-xs uppercase">
            <span className="text-orange-500">Pro</span> • League •{" "}
            <span className="text-orange-500">2025</span>
          </div>
        </div>

        {/* Game Container */}
        <div className="relative group rounded-xl overflow-hidden shadow-2xl shadow-black/80 border-4 border-slate-800 bg-slate-900 w-full max-w-[1200px]">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-auto block"
          />

          <HeadSoccerHUD gameState={gameState} formatTime={formatTime} />
        </div>

        <ControlsHint />
      </div>

      <StartGameModal
        gameState={gameState}
        contractConfigured={contractConfigured}
        walletConnected={walletConnected}
        stakeMode={stakeMode}
        stakeAmount={stakeAmount}
        reward={reward}
        setStakeMode={setStakeMode}
        startGame={startGame}
      />

      <GameOverModal
        gameState={gameState}
        stakeMode={stakeMode}
        isLoading={isLoading}
        stakeAmount={stakeAmount}
        reward={reward}
        drawRefund={drawRefund}
        resetLocalGameState={resetLocalGameState}
        startGame={startGame}
      />
    </div>
  );
}
