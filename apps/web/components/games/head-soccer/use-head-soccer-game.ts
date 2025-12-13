import { useEffect, useRef, useState, useCallback } from "react";
import { useGameStats } from "@/hooks/use-game-stats";
import { useStakeGame } from "@/hooks/use-stake-game";
import {
  Player,
  Ball,
  GameState,
  GoalPost,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  MOVE_SPEED,
  BALL_BOUNCE,
  POST_BOUNCE,
  GOAL_WIDTH,
  GOAL_HEIGHT,
  CROSSBAR_HEIGHT,
  GAME_DURATION,
  GOAL_COOLDOWN,
  MAX_BALL_VELOCITY,
} from "./types";

export function useHeadSoccerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const [stakeMode, setStakeMode] = useState(false);
  const { updateStats } = useGameStats("head-soccer");
  const {
    stakeAmount,
    reward,
    drawRefund,
    contractConfigured,
    walletConnected,
    stakeForGame: stakeForGameContract,
    endGameWithResult,
    resetLocalGameState,
    isLoading,
  } = useStakeGame("head-soccer");
  const statsTrackedRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>({
    player1Score: 0,
    player2Score: 0,
    timeLeft: GAME_DURATION,
    gameRunning: false,
    gameOver: false,
    winner: null,
  });

  const playerRef = useRef<Player>({
    x: 150,
    y: CANVAS_HEIGHT - 100,
    vx: 0,
    vy: 0,
    width: 40,
    height: 60,
    onGround: false,
    color: "#15803d",
    isAI: false,
  });

  const aiPlayerRef = useRef<Player>({
    x: CANVAS_WIDTH - 190,
    y: CANVAS_HEIGHT - 100,
    vx: 0,
    vy: 0,
    width: 40,
    height: 60,
    onGround: false,
    color: "#ea580c",
    isAI: true,
  });

  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 0,
    vy: 0,
    radius: 15,
  });

  const gameTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastGoalEffectRef = useRef<{
    side: "left" | "right" | null;
    time: number;
  }>({ side: null, time: 0 });

  const goalCooldownRef = useRef<number>(0);

  const goalPostsRef = useRef({
    left: {
      vertical: {
        x: 0,
        y: CANVAS_HEIGHT - GOAL_HEIGHT - 20,
        width: GOAL_WIDTH,
        height: GOAL_HEIGHT,
      },
      crossbar: {
        x: 0,
        y: CANVAS_HEIGHT - GOAL_HEIGHT - 20,
        width: GOAL_WIDTH * 4,
        height: CROSSBAR_HEIGHT,
      },
    },
    right: {
      vertical: {
        x: CANVAS_WIDTH - GOAL_WIDTH,
        y: CANVAS_HEIGHT - GOAL_HEIGHT - 20,
        width: GOAL_WIDTH,
        height: GOAL_HEIGHT,
      },
      crossbar: {
        x: CANVAS_WIDTH - GOAL_WIDTH * 4,
        y: CANVAS_HEIGHT - GOAL_HEIGHT - 20,
        width: GOAL_WIDTH * 4,
        height: CROSSBAR_HEIGHT,
      },
    },
  });

  const cloudsRef = useRef<{ x: number; y: number; size: number; speed: number }[]>([]);

  // Initialize clouds
  useEffect(() => {
    const clouds = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * (CANVAS_HEIGHT / 2),
        size: 15 + Math.random() * 20,
        speed: 0.2 + Math.random() * 0.5,
      });
    }
    cloudsRef.current = clouds;
  }, []);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const resetBall = useCallback(() => {
    const ball = ballRef.current;
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2 - 100;
    ball.vx = 0;
    ball.vy = -3;
  }, []);

  const resetGame = useCallback(() => {
    playerRef.current = {
      x: 150,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      width: 40,
      height: 60,
      onGround: false,
      color: "#15803d",
      isAI: false,
    };

    aiPlayerRef.current = {
      x: CANVAS_WIDTH - 190,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      width: 40,
      height: 60,
      onGround: false,
      color: "#ea580c",
      isAI: true,
    };

    resetBall();

    goalCooldownRef.current = 0;

    setGameState({
      player1Score: 0,
      player2Score: 0,
      timeLeft: GAME_DURATION,
      gameRunning: true,
      gameOver: false,
      winner: null,
    });
  }, [resetBall]);

  const startGame = useCallback(async () => {
    if (stakeMode) {
      const success = await stakeForGameContract();
      if (!success) {
        return;
      }
    }

    resetGame();

    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }

    gameTimerRef.current = setInterval(() => {
      setGameState((prev) => {
        const newTimeLeft = prev.timeLeft - 1;
        if (newTimeLeft <= 0) {
          const winner =
            prev.player1Score > prev.player2Score
              ? "Player 1"
              : prev.player2Score > prev.player1Score
              ? "AI Player"
              : "Tie";
          return {
            ...prev,
            timeLeft: 0,
            gameRunning: false,
            gameOver: true,
            winner,
          };
        }
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);
  }, [resetGame, stakeMode, stakeForGameContract]);

  const stopGame = useCallback(() => {
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const updateAI = useCallback(() => {
    const ai = aiPlayerRef.current;
    const ball = ballRef.current;

    const predictedBallX = ball.x + ball.vx * 10;
    const distanceToBall = Math.abs(ai.x - predictedBallX);

    if (predictedBallX < ai.x - 20) {
      ai.vx = -MOVE_SPEED * 0.85;
    } else if (predictedBallX > ai.x + 20) {
      ai.vx = MOVE_SPEED * 0.85;
    } else {
      ai.vx *= 0.8;
    }

    if (
      distanceToBall < 80 &&
      ball.y < ai.y &&
      ai.onGround &&
      Math.random() < 0.3
    ) {
      ai.vy = JUMP_FORCE;
      ai.onGround = false;
    }
  }, []);

  const handleGoalPostCollision = useCallback((ball: Ball) => {
    const posts = goalPostsRef.current;

    const checkRectCollision = (
      rect: GoalPost,
      isVertical: boolean,
      isLeft: boolean
    ) => {
      const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.width));
      const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.height));

      const distanceX = ball.x - closestX;
      const distanceY = ball.y - closestY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      if (distance < ball.radius) {
        const overlap = ball.radius - distance;

        const isNearTopCorner =
          isVertical &&
          Math.abs(ball.y - rect.y) < ball.radius * 2 &&
          Math.abs(ball.x - (isLeft ? rect.x + rect.width : rect.x)) <
            ball.radius * 2;

        if (isNearTopCorner) {
          const angle = Math.atan2(distanceY, distanceX);
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

          const chaosAngle = angle + (Math.random() - 0.5) * 0.3;
          ball.vx = Math.cos(chaosAngle) * speed * POST_BOUNCE;
          ball.vy = Math.sin(chaosAngle) * speed * POST_BOUNCE;

          ball.x += Math.cos(angle) * (overlap + 1);
          ball.y += Math.sin(angle) * (overlap + 1);
        } else if (isVertical) {
          const normalX = distanceX / distance;
          const dotProduct = ball.vx * normalX + ball.vy * 0;

          ball.vx = (ball.vx - 2 * dotProduct * normalX) * POST_BOUNCE;
          ball.x += normalX * (overlap + 1);
        } else {
          const normalY = distanceY / distance;
          const dotProduct = ball.vx * 0 + ball.vy * normalY;

          ball.vy = (ball.vy - 2 * dotProduct * normalY) * POST_BOUNCE;

          if (ball.vy < 0 && ball.y > rect.y + rect.height) {
            ball.vy *= 1.2;
          }

          ball.y += normalY * (overlap + 1);
        }

        return true;
      }
      return false;
    };

    let collided = false;
    collided = checkRectCollision(posts.left.vertical, true, true) || collided;
    collided = checkRectCollision(posts.left.crossbar, false, true) || collided;
    collided =
      checkRectCollision(posts.right.vertical, true, false) || collided;
    collided =
      checkRectCollision(posts.right.crossbar, false, false) || collided;

    return collided;
  }, []);

  const capBallVelocity = useCallback((ball: Ball) => {
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed > MAX_BALL_VELOCITY) {
      const scale = MAX_BALL_VELOCITY / speed;
      ball.vx *= scale;
      ball.vy *= scale;
    }
  }, []);

  const updatePhysics = useCallback(() => {
    // Update clouds
    cloudsRef.current.forEach(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x > CANVAS_WIDTH + 50) {
        cloud.x = -50;
        cloud.y = Math.random() * (CANVAS_HEIGHT / 2);
      }
    });

    const player = playerRef.current;
    const aiPlayer = aiPlayerRef.current;
    const ball = ballRef.current;

    if (keysRef.current.has("a")) player.vx = -MOVE_SPEED;
    else if (keysRef.current.has("d")) player.vx = MOVE_SPEED;
    else player.vx *= 0.8;

    if (keysRef.current.has("w") && player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
    }

    updateAI();

    const players = [player, aiPlayer];
    players.forEach((p) => {
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      if (p.y + p.height >= CANVAS_HEIGHT - 20) {
        p.y = CANVAS_HEIGHT - 20 - p.height;
        p.vy = 0;
        p.onGround = true;
      }

      if (p.x < 0) p.x = 0;
      if (p.x + p.width > CANVAS_WIDTH) p.x = CANVAS_WIDTH - p.width;
    });

    ball.vy += GRAVITY * 0.3;
    ball.x += ball.vx;
    ball.y += ball.vy;

    capBallVelocity(ball);

    if (ball.y + ball.radius >= CANVAS_HEIGHT - 20) {
      ball.y = CANVAS_HEIGHT - 20 - ball.radius;
      ball.vy *= -BALL_BOUNCE;
      ball.vx *= 0.95;
    }

    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy *= -BALL_BOUNCE;
    }

    const isInLeftGoalArea =
      ball.x <= GOAL_WIDTH * 4 && ball.y >= CANVAS_HEIGHT - GOAL_HEIGHT - 20;
    const isInRightGoalArea =
      ball.x >= CANVAS_WIDTH - GOAL_WIDTH * 4 &&
      ball.y >= CANVAS_HEIGHT - GOAL_HEIGHT - 20;
    const isInGoalArea = isInLeftGoalArea || isInRightGoalArea;

    let hitPost = false;
    if (!isInGoalArea) {
      hitPost = handleGoalPostCollision(ball);
    }

    if (!hitPost && !isInGoalArea) {
      if (
        ball.x - ball.radius <= 0 &&
        ball.y < CANVAS_HEIGHT - GOAL_HEIGHT - 20
      ) {
        ball.vx *= -BALL_BOUNCE;
        ball.x = ball.radius;
      }
      if (
        ball.x + ball.radius >= CANVAS_WIDTH &&
        ball.y < CANVAS_HEIGHT - GOAL_HEIGHT - 20
      ) {
        ball.vx *= -BALL_BOUNCE;
        ball.x = CANVAS_WIDTH - ball.radius;
      }
    }

    players.forEach((p, index) => {
      const dx = ball.x - (p.x + p.width / 2);
      const dy = ball.y - (p.y + p.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < ball.radius + 25) {
        const angle = Math.atan2(dy, dx);
        const force = 8;
        ball.vx = Math.cos(angle) * force;
        ball.vy = Math.sin(angle) * force;

        const isSuperShot =
          (index === 0 && keysRef.current.has("w")) ||
          (index === 1 && Math.random() < 0.15);
        if (isSuperShot) {
          ball.vx *= 1.8;
          ball.vy *= 1.8;
        }
      }
    });

    const now = Date.now();
    const canScoreGoal = now - goalCooldownRef.current > GOAL_COOLDOWN;

    if (canScoreGoal) {
      if (
        ball.x - ball.radius <= GOAL_WIDTH &&
        ball.y >= CANVAS_HEIGHT - GOAL_HEIGHT - 20 &&
        ball.y <= CANVAS_HEIGHT - 20
      ) {
        setGameState((prev) => ({
          ...prev,
          player2Score: prev.player2Score + 1,
        }));
        goalCooldownRef.current = now;
        lastGoalEffectRef.current = { side: "left", time: now };
        resetBall();
      } else if (
        ball.x + ball.radius >= CANVAS_WIDTH - GOAL_WIDTH &&
        ball.y >= CANVAS_HEIGHT - GOAL_HEIGHT - 20 &&
        ball.y <= CANVAS_HEIGHT - 20
      ) {
        setGameState((prev) => ({
          ...prev,
          player1Score: prev.player1Score + 1,
        }));
        goalCooldownRef.current = now;
        lastGoalEffectRef.current = { side: "right", time: now };
        resetBall();
      }
    }
  }, [updateAI, handleGoalPostCollision, capBallVelocity, resetBall]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    backgroundGradient.addColorStop(0, "#1e3a8a");
    backgroundGradient.addColorStop(0.3, "#3b82f6");
    backgroundGradient.addColorStop(0.6, "#60a5fa");
    backgroundGradient.addColorStop(0.85, "#93c5fd");
    backgroundGradient.addColorStop(1, "#10b981");
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const sunX = CANVAS_WIDTH - 100;
    const sunY = 60;
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 40);
    sunGradient.addColorStop(0, "#fef08a");
    sunGradient.addColorStop(0.5, "#fbbf24");
    sunGradient.addColorStop(1, "rgba(251, 191, 36, 0)");
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
    ctx.fill();

    const drawCloud = (x: number, y: number, size: number) => {
      ctx.fillStyle = "rgba(100, 116, 139, 0.3)";
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, size, 0, Math.PI * 2);
      ctx.arc(x + size * 1.5 + 2, y + 2, size * 1.2, 0, Math.PI * 2);
      ctx.arc(x + size * 3 + 2, y + 2, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.arc(x + size * 1.5, y, size * 1.2, 0, Math.PI * 2);
      ctx.arc(x + size * 3, y, size, 0, Math.PI * 2);
      ctx.fill();
    };

    cloudsRef.current.forEach(cloud => {
      drawCloud(cloud.x, cloud.y, cloud.size);
    });

    const groundGradient = ctx.createLinearGradient(
      0,
      CANVAS_HEIGHT - 50,
      0,
      CANVAS_HEIGHT
    );
    groundGradient.addColorStop(0, "#059669");
    groundGradient.addColorStop(1, "#047857");
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);

    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.fillStyle =
        i % 80 === 0 ? "rgba(5, 150, 105, 0.3)" : "rgba(4, 120, 87, 0.3)";
      ctx.fillRect(i, CANVAS_HEIGHT - 20, 40, 20);
    }

    ctx.strokeStyle = "#065f46";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 20);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 20);
    ctx.stroke();

    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    const drawGoalPost = (isLeft: boolean) => {
      const posts = isLeft
        ? goalPostsRef.current.left
        : goalPostsRef.current.right;

      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(
        isLeft ? 0 : CANVAS_WIDTH - GOAL_WIDTH * 4,
        CANVAS_HEIGHT - GOAL_HEIGHT - 20,
        GOAL_WIDTH * 4,
        GOAL_HEIGHT
      );

      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      const netSpacing = 15;
      for (
        let y = CANVAS_HEIGHT - GOAL_HEIGHT - 20;
        y < CANVAS_HEIGHT - 20;
        y += netSpacing
      ) {
        ctx.beginPath();
        ctx.moveTo(isLeft ? 0 : CANVAS_WIDTH - GOAL_WIDTH * 4, y);
        ctx.lineTo(isLeft ? GOAL_WIDTH * 4 : CANVAS_WIDTH, y);
        ctx.stroke();
      }
      for (let x = 0; x < GOAL_WIDTH * 4; x += netSpacing) {
        ctx.beginPath();
        ctx.moveTo(
          isLeft ? x : CANVAS_WIDTH - GOAL_WIDTH * 4 + x,
          CANVAS_HEIGHT - GOAL_HEIGHT - 20
        );
        ctx.lineTo(
          isLeft ? x : CANVAS_WIDTH - GOAL_WIDTH * 4 + x,
          CANVAS_HEIGHT - 20
        );
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(
        posts.vertical.x + (isLeft ? 3 : -3),
        posts.vertical.y + 3,
        posts.vertical.width,
        posts.vertical.height
      );
      ctx.fillRect(
        posts.crossbar.x + (isLeft ? 3 : -3),
        posts.crossbar.y + 3,
        posts.crossbar.width,
        posts.crossbar.height
      );

      const postGradient = ctx.createLinearGradient(
        posts.vertical.x,
        0,
        posts.vertical.x + posts.vertical.width,
        0
      );
      postGradient.addColorStop(0, "#ffffff");
      postGradient.addColorStop(0.5, "#e5e5e5");
      postGradient.addColorStop(1, "#d4d4d4");

      ctx.fillStyle = postGradient;
      ctx.fillRect(
        posts.vertical.x,
        posts.vertical.y,
        posts.vertical.width,
        posts.vertical.height
      );
      ctx.fillRect(
        posts.crossbar.x,
        posts.crossbar.y,
        posts.crossbar.width,
        posts.crossbar.height
      );

      ctx.strokeStyle = "#a3a3a3";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        posts.vertical.x,
        posts.vertical.y,
        posts.vertical.width,
        posts.vertical.height
      );
      ctx.strokeRect(
        posts.crossbar.x,
        posts.crossbar.y,
        posts.crossbar.width,
        posts.crossbar.height
      );

      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillRect(
        posts.vertical.x + 2,
        posts.vertical.y,
        3,
        posts.vertical.height
      );
      ctx.fillRect(
        posts.crossbar.x + 2,
        posts.crossbar.y,
        posts.crossbar.width - 4,
        3
      );
    };

    drawGoalPost(true);
    drawGoalPost(false);

    const now = Date.now();
    if (
      lastGoalEffectRef.current.side &&
      now - lastGoalEffectRef.current.time < 1000
    ) {
      const progress = (now - lastGoalEffectRef.current.time) / 1000;
      const alpha = 1 - progress;
      const x =
        lastGoalEffectRef.current.side === "left"
          ? GOAL_WIDTH * 2
          : CANVAS_WIDTH - GOAL_WIDTH * 2;

      ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(
        x,
        CANVAS_HEIGHT - GOAL_HEIGHT / 2 - 20,
        50 + progress * 50,
        0,
        Math.PI * 2
      );
      ctx.fill();

      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const dist = progress * 100;
        const px = x + Math.cos(angle) * dist;
        const py =
          CANVAS_HEIGHT - GOAL_HEIGHT / 2 - 20 + Math.sin(angle) * dist;
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const drawPlayer = (player: Player) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(
        player.x + player.width / 2,
        CANVAS_HEIGHT - 22,
        player.width / 2,
        8,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      const bodyGradient = ctx.createLinearGradient(
        player.x,
        player.y,
        player.x + player.width,
        player.y
      );
      const baseColor = player.color;
      bodyGradient.addColorStop(0, baseColor);
      bodyGradient.addColorStop(0.5, baseColor);
      bodyGradient.addColorStop(1, baseColor + "cc");
      ctx.fillStyle = bodyGradient;
      ctx.fillRect(player.x, player.y + 30, player.width, player.height - 30);

      ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(player.x, player.y + 30, player.width, player.height - 30);

      const headGradient = ctx.createRadialGradient(
        player.x + player.width / 2 - 8,
        player.y + 12,
        0,
        player.x + player.width / 2,
        player.y + 20,
        25
      );
      headGradient.addColorStop(0, "#ffd4a3");
      headGradient.addColorStop(1, "#d4a373");
      ctx.fillStyle = headGradient;
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + 20, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#a0826d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + 20, 25, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(
        player.x + player.width / 2 - 8,
        player.y + 15,
        5,
        0,
        Math.PI * 2
      );
      ctx.arc(
        player.x + player.width / 2 + 8,
        player.y + 15,
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(
        player.x + player.width / 2 - 8,
        player.y + 15,
        3,
        0,
        Math.PI * 2
      );
      ctx.arc(
        player.x + player.width / 2 + 8,
        player.y + 15,
        3,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(
        player.x + player.width / 2 - 7,
        player.y + 14,
        1,
        0,
        Math.PI * 2
      );
      ctx.arc(
        player.x + player.width / 2 + 9,
        player.y + 14,
        1,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        player.x + player.width / 2,
        player.y + 22,
        8,
        0.2,
        Math.PI - 0.2
      );
      ctx.stroke();
    };

    drawPlayer(playerRef.current);
    drawPlayer(aiPlayerRef.current);

    const ball = ballRef.current;

    const shadowY = CANVAS_HEIGHT - 22;
    const shadowSize = Math.max(5, 20 - (shadowY - ball.y) / 10);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(ball.x, shadowY, shadowSize, shadowSize / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    const ballGradient = ctx.createRadialGradient(
      ball.x - 5,
      ball.y - 5,
      0,
      ball.x,
      ball.y,
      ball.radius
    );
    ballGradient.addColorStop(0, "#ffffff");
    ballGradient.addColorStop(0.7, "#f0f0f0");
    ballGradient.addColorStop(1, "#d0d0d0");
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const x = ball.x + Math.cos(angle) * 6;
      const y = ball.y + Math.sin(angle) * 6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const x = ball.x + Math.cos(angle) * 10;
      const y = ball.y + Math.sin(angle) * 10;
      ctx.strokeRect(x - 3, y - 3, 6, 6);
    }

    ctx.strokeStyle = "#404040";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  useEffect(() => {
    const gameLoop = () => {
      if (gameState.gameRunning) {
        updatePhysics();
      }
      render();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.gameRunning, updatePhysics, render]);

  useEffect(() => {
    return () => {
      stopGame();
    };
  }, [stopGame]);

  useEffect(() => {
    if (gameState.gameOver && !statsTrackedRef.current && gameState.winner) {
      statsTrackedRef.current = true;

      const playerWon = gameState.winner === "Player 1";
      const tie = gameState.winner === "Tie";

      updateStats({ playerWon, tie });

      if (stakeMode) {
        endGameWithResult(playerWon, tie);
      }
    }

    if (!gameState.gameOver && gameState.gameRunning) {
      statsTrackedRef.current = false;
    }
  }, [
    gameState.gameOver,
    gameState.winner,
    gameState.gameRunning,
    updateStats,
    stakeMode,
    endGameWithResult,
  ]);

  return {
    canvasRef,
    gameState,
    startGame,
    stopGame,
    stakeMode,
    setStakeMode,
    stakeAmount,
    reward,
    drawRefund,
    walletConnected,
    contractConfigured,
    isLoading,
    resetLocalGameState,
  };
}
