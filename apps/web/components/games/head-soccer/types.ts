export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  color: string;
  isAI: boolean;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface GameState {
  player1Score: number;
  player2Score: number;
  timeLeft: number;
  gameRunning: boolean;
  gameOver: boolean;
  winner: string | null;
}

export interface GoalPost {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -16;
export const MOVE_SPEED = 6;
export const BALL_BOUNCE = 0.85;
export const POST_BOUNCE = 0.9;
export const GOAL_WIDTH = 20;
export const GOAL_HEIGHT = 180;
export const CROSSBAR_HEIGHT = 10;
export const GAME_DURATION = 60;
export const GOAL_COOLDOWN = 1000; // 1 second cooldown after goal
export const MAX_BALL_VELOCITY = 30; // Prevent ball from moving too fast
