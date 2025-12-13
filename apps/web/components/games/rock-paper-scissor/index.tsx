"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useStakeGame } from "@/hooks/use-stake-game";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Skull, Handshake, Info, ArrowLeft, Gamepad2 } from "lucide-react";

// --- Custom UI Components ---

const GameButton = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "warning";
  className?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const baseStyles = "relative overflow-hidden rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 border border-indigo-400/20",
    secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700",
    outline: "bg-transparent border-2 border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white",
    danger: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40",
    success: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40",
    warning: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

const GameCard = ({ children, className = "", title }: { children: React.ReactNode; className?: string; title?: string }) => (
  <div className={`bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl ${className}`}>
    {title && <h3 className="text-xl font-bold text-slate-200 mb-4 text-center">{title}</h3>}
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose?: () => void; title?: React.ReactNode; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {title && (
            <div className="bg-slate-800/50 p-6 border-b border-slate-700/50 text-center">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>
          )}
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Icons ---

const RockIcon = () => (
  <svg viewBox="0 0 309.274 282.945" className="w-full h-full drop-shadow-lg">
    <path
      d="M274.085,123.143c-2.976-11.404-7.057-22.556-11.228-33.537c-2.789-7.34-5.713-14.627-8.475-21.98 c-0.385-1.024-0.791-2.045-1.191-3.066c-2.01-1.381-3.938-2.896-5.791-4.482c-7.007-4.258-13.768-8.834-21.1-12.621 c-9.2-4.752-18.252-9.584-27.888-13.422c-13.671-5.445-28.599-9.875-43.546-11.748c0.018-0.005,0.036-0.008,0.055-0.012 c-0.365-0.047-0.73-0.093-1.095-0.139c-3.302,0.229-6.676,0.841-10.009,0.803c-0.162,0.051-0.324,0.094-0.486,0.146 c-0.779,0.246-1.561,0.488-2.342,0.728c-0.816,0.16-1.629,0.335-2.434,0.546c-2.658,0.699-5.27,1.576-7.85,2.535 c-2.545,0.777-5.08,1.589-7.596,2.486c-2.974,1.061-5.942,2.295-8.652,3.926c-0.384,0.23-0.764,0.508-1.143,0.81 c-0.785,0.369-1.574,0.735-2.347,1.129c-1.886,0.957-3.677,1.976-5.506,3.016c-1.637,0.928-2.372,2.989-3.39,4.45 C90.282,59.617,80.513,77.49,72.122,96.288c-4.256,9.536-8.756,18.917-12.242,28.776c-0.881,2.492-1.629,5.028-2.337,7.573 c-0.563,2.023-1.343,3.656-1.258,5.78c0.059,1.488,0.778,2.899,1.353,4.242c1.242,2.903,2.686,5.693,3.82,8.65 c1.725,4.49,3.205,8.773,5.467,13.022c2.499,4.694,5.213,9.275,7.684,13.982c2.158,4.109,4.158,8.031,6.895,11.795 c2.473,3.402,4.197,6.496,7.715,8.92c2.375,1.636,4.496,3.618,6.746,5.42c2.568,2.053,5.464,3.684,8.205,5.493 c5.732,3.782,11.178,7.83,16.553,12.105c9.818,7.813,20.291,14.984,30.879,21.764c1.907,0.524,3.748,1.369,5.475,2.246 c0.604,0.307,1.201,0.625,1.793,0.95c0.756-0.188,1.49-0.388,2.182-0.62c4.195-1.416,8.299-3.123,12.441-4.688 c8.129-3.068,16.268-6.092,24.266-9.48c3.873-1.643,7.879-2.959,11.689-4.729c3.83-1.778,7.668-3.577,11.564-5.2 c3.805-1.585,7.596-3.186,11.318-4.957c3.862-1.835,7.355-4.249,11.131-6.212c2.633-1.367,5.592-2.651,7.125-5.359 c1.693-2.99,2.536-6.691,3.563-9.957c2.76-8.782,5.019-17.742,7.746-26.544c2.627-8.474,5.528-16.849,8.408-25.239 c0.74-2.158,1.463-4.403,2.207-6.672c0.787-2.829,1.851-5.588,2.678-8.41C274.676,127.024,274.271,125.094,274.085,123.143z"
      fill="currentColor"
      className="text-slate-400"
    />
  </svg>
);

const PaperIcon = () => (
  <svg viewBox="0 0 765 990" className="w-full h-full drop-shadow-lg">
    <path
      d="m11.084 72.444v969.55h699.16c27.525 0 49.597-21.711 49.597-48.663v-872.23c0-26.952-22.072-48.663-49.597-48.663h-699.16z"
      className="fill-slate-200 stroke-slate-400"
      strokeWidth="20"
    />
    {[182, 229, 277, 324, 372, 420, 468, 516, 563, 611, 659, 707, 755, 802, 850, 898, 946, 993].map((y, i) => (
      <path
        key={i}
        d={`m10.143 ${y}.56h750.64`}
        className="stroke-blue-400/50"
        strokeWidth="10"
      />
    ))}
  </svg>
);

const ScissorsIcon = () => (
  <svg
    aria-label="Scissors Icon"
    style={{ background: "new 0 0 2122 2122" }}
    viewBox="0 0 2122 2122"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Scissors Icon</title>
    <g>
      <path
        d="M809.446,1224.667c-10.28-20.243-26.041-41.598-39.552-63.893
		c-117.091,138.042-211.927,310.679-281.676,467.488c-29.023,65.325-53.091,133.077-68.424,202.938
		c-7.445,34.007-43.035,158.772,29.213,114.879l0.176-0.088c60.019-36.619,103.805-98.212,150.869-150.353
		c52.96-58.641,105.871-117.257,158.83-175.893c40.326-44.662,80.663-89.359,120.989-134.017
		c-4.867-24.068-7.191-48.867-10.904-73.232C859.093,1347.547,839.22,1283.328,809.446,1224.667z"
        style={{ fill: "#91A9D8" }}
      />
      <path
        d="M975.643,1223.386c-11.24,2.943-22.611,3.235-33.481-0.969
		c-13.179-5.077-25.174-13.613-36.312-24.151c-32.526-30.772-41.403-77.252-64.75-114.027
		c-24.57,23.951-48.321,49.568-71.206,76.536c13.51,22.295,29.271,43.649,39.552,63.893c29.773,58.661,49.647,122.879,59.523,187.83
		c3.712,24.365,6.036,49.164,10.904,73.232c54.095-59.907,108.19-119.815,162.28-179.722
		c-12.365-15.099-24.736-30.198-37.101-45.296C995.77,1249.374,985.66,1236.819,975.643,1223.386z"
        style={{ fill: "#7594C6" }}
      />
      <path
        d="M1767.093,400.834c-25.843-94.243-104.968-163.191-190.58-203.752
		c-73.838-35.023-162.443-38.266-237.029-8.731c-86.51,34.275-150.12,109.06-185.392,192.676
		c-35.323,83.616-44.952,175.813-46.698,266.863c-0.698,38.914-0.25,78.927-14.668,114.897
		c-8.581,21.403-21.703,39.812-37.168,56.725c41.009,46.298,97.436,83.816,126.821,138.396c8.033,14.867,13.969,31.83,10.626,48.493
		c-1.446,7.134-4.49,13.77-8.231,20.106c9.43,7.833,18.509,16.065,27.29,24.446c14.669,14.069,28.987,28.787,42.956,44.053
		c30.682-38.964,122.78-118.539,163.691-138.595C1611.885,861.721,1832.999,641.256,1767.093,400.834z M1220.346,601.293
		c-8.233-76.532,9.129-160.198,56.126-220.315c59.169-75.484,167.033-96.438,254.191-61.465
		c112.951,45.25,145.33,168.729,102.175,277.141c-26.692,67.003-83.566,135.602-153.163,159.898
		C1356.595,799.557,1232.019,709.406,1220.346,601.293z"
        style={{ fill: "#C11833" }}
      />
      <path
        d="M1575.292,1648.964c-62.105-159.985-148.506-336.993-258.806-480.521
		c-14.568,21.617-31.338,42.183-42.587,61.91c-32.57,57.154-55.512,120.346-68.511,184.74c-4.882,24.156-8.4,48.818-14.421,72.619
		c38.129,46.558,76.263,93.145,114.387,139.697c50.07,61.126,100.098,122.222,150.168,183.347
		c44.497,54.349,85.262,117.983,143.44,157.457l0.171,0.092c70.051,47.328,40.516-79.011,34.723-113.335
		C1621.908,1784.448,1601.133,1715.619,1575.292,1648.964z"
        style={{ fill: "#B5C5E7" }}
      />
      <path
        d="M1273.899,1230.353c11.25-19.727,28.019-40.292,42.587-61.91
		c-19.718-25.642-40.205-50.192-61.447-73.413c-13.997-15.294-28.307-30.022-42.971-44.051
		c-8.794-8.412-17.886-16.619-27.279-24.453c-2.543,4.358-5.389,8.587-8.273,12.726c-42.168,60.392-94.388,114.375-153.997,159.135
		c-13.929,10.456-30.256,20.648-46.874,24.999c10.017,13.432,20.127,25.988,29.408,37.325
		c12.365,15.098,24.736,30.197,37.101,45.296c49.608,60.57,99.211,121.14,148.814,181.705c6.022-23.801,9.54-48.463,14.421-72.619
		C1218.386,1350.699,1241.329,1287.508,1273.899,1230.353z"
        style={{ fill: "#91A9D8" }}
      />
      <path
        d="M1182.379,957.909c-29.385-54.58-85.811-92.098-126.821-138.396
		c-17.412-19.657-32.03-40.91-40.612-65.755c-12.672-36.57-10.277-76.532-9.129-115.446c2.693-91.05-2.495-183.596-33.726-268.809
		c-31.231-85.213-91.2-162.992-175.913-201.357c-73.09-33.127-161.695-34.175-237.179-2.794
		c-87.458,36.42-169.827,101.527-200.21,194.373C281.41,596.703,491.647,827.546,680.033,931.468
		c41.06,22.65,133.207,110.856,159.15,149.771c0.7,0.948,1.298,1.996,1.897,2.993c23.348,36.769,32.229,83.267,64.757,114.049
		c11.175,10.527,23.149,19.058,36.321,24.147c10.876,4.191,22.251,3.891,33.476,0.948c16.614-4.34,32.977-14.518,46.896-24.995
		c59.62-44.752,111.805-98.733,153.962-159.15c2.893-4.141,5.737-8.332,8.282-12.722c3.742-6.336,6.786-12.971,8.231-20.106
		C1196.348,989.739,1190.412,972.777,1182.379,957.909z M895.26,586.326C878.448,693.74,749.63,777.755,628.746,728.913
		c-68.299-27.639-121.832-98.883-145.231-167.133c-37.916-110.357,0.35-232.14,115.347-271.902
		c88.755-30.683,195.52-4.59,250.949,73.688C893.913,425.879,907.184,510.293,895.26,586.326z"
        style={{ fill: "#E51C37" }}
      />
      <path
        d="M922.956,1007.813c11.435,39.6,52.804,62.429,92.404,50.994
		c39.601-11.435,62.431-52.806,50.991-92.404c-11.435-39.6-52.804-62.431-92.404-50.993
		C934.347,926.843,911.517,968.215,922.956,1007.813z"
        style={{ fill: "#577FBD" }}
      />
      <path
        d="M657.938,840.327c-79.166-56.312-152.287-111.383-210.406-190.136
		c-3.693-5.004-11.493-0.762-8.487,4.96c40.614,77.262,119.756,131.206,189.023,180.541c78.48,55.896,153.696,110.991,209.88,190.49
		c2.256,3.196,7.084,0.467,5.281-3.087C803.527,944.736,727.77,890.003,657.938,840.327z"
        style={{ fill: "#1A1A1A" }}
      />
      <path
        d="M707.8,196.155c29.408,11.583,60.511,13.805,89.666,28.192
		c27.036,13.345,51.727,31.513,72.517,53.338c44.687,46.913,68.399,109.342,75.176,173.093c0.248,2.331,3.616,2.434,3.708,0
		c2.607-67.566-23.83-132.785-70.241-181.737c-23.274-24.548-51.411-44.675-82.095-58.913
		c-26.085-12.109-59.522-26.029-88.73-21.839C703.342,188.927,704.569,194.883,707.8,196.155z"
        style={{ fill: "#1A1A1A" }}
      />
      <path
        d="M1550.848,826.035c-2.67,1.917-0.36,6.132,2.621,4.482
		c68.049-37.678,119.488-100.475,150.933-171.081c29.578-66.414,46.358-150.618,25.534-221.834
		c-1.198-4.095-7.868-3.476-7.649,1.035c3.65,75.198,0.541,144.611-29.559,214.962
		C1662.702,723.777,1612.587,781.706,1550.848,826.035z"
        style={{ fill: "#1A1A1A" }}
      />
      <path
        d="M1264.276,307.039c26.748-15.486,48.555-36.92,76.901-50.38
		c31.722-15.057,66.441-23.52,101.539-24.643c68.268-2.18,129.198,24.87,182.406,65.715c2.324,1.786,4.902-1.944,3.031-3.929
		c-47.674-50.628-120.468-76.704-189.461-74.504c-59.951,1.912-146.743,27.659-179.362,82.794
		C1257.475,305.222,1261.158,308.845,1264.276,307.039z"
        style={{ fill: "#1A1A1A" }}
      />
      <path
        d="M1111.126,929.06c13.559,15.695,53.34,47.851,43.586,70.926
		c-4.668,11.043-18.913,22.606-26.845,31.637c-8.365,9.532-16.736,19.067-25.106,28.599c-14.914,16.992-29.778,33.941-42.134,52.919
		c-1.949,2.996,2.222,5.637,4.662,3.596c25.481-21.335,46.777-47.396,68.896-72.081c12.673-14.139,37.306-33.252,36.745-54.753
		c-0.482-18.575-21.817-35.406-32.735-47.856c-20.575-23.469-39.854-50.848-64.745-69.876c-2.572-1.966-5.554,1.737-4.185,4.185
		C1080.208,895.932,1096.54,912.166,1111.126,929.06z"
        style={{ fill: "#1A1A1A" }}
      />
      <path
        d="M740.964,1264.093c-88.238,96.964-155.166,210.533-210.728,328.827
		c-2.562,5.457,5.462,10.266,8.166,4.775c57.578-117.004,131.152-224.448,207.805-329.559
		C748.443,1265.072,743.493,1261.311,740.964,1264.093z"
        style={{ fill: "#1A1A1A" }}
      />
      <path
        d="M508.945,1653.617c-21.92,34.406-38.913,73.028-47.766,112.969c-0.385,1.735,2.27,3.113,3.05,1.286
		c15.995-37.51,32.409-74.216,51.284-110.421C517.773,1653.11,511.581,1649.476,508.945,1653.617z"
        style={{ fill: "#1A1A1A" }}
      />
      <path
        d="M1435.019,1424.239c-3.727-6.002-12.677-0.726-9.447,5.525
		c34.397,66.46,69.184,131.43,96.853,201.184c26.655,67.206,44.424,136.706,67.678,204.94c1.486,4.356,7.513,2.558,6.797-1.875
		c-11.858-73.17-39.508-145.846-67.186-214.348C1502.819,1553.111,1472.958,1485.31,1435.019,1424.239z"
        style={{ fill: "#1A1A1A" }}
      />
      <path
        d="M1402.649,1370.197c1.213,2.07,4.287,0.243,3.201-1.871c-9.301-18.11-18.212-36.434-27.742-54.421
		c-8.2-15.479-15.391-33.525-27.693-46.134c-1.267-1.296-3.342,0.044-2.948,1.715c4.053,17.165,15.488,32.965,24.166,48.205
		C1381.689,1335.347,1392.364,1352.667,1402.649,1370.197z"
        style={{ fill: "#1A1A1A" }}
      />
      <path
        d="M455.035,359.151c24.702-54.441,64.623-92.158,105.364-134.219
		c10.49-10.833-2.689-24.971-15.118-19.595c-58.46,25.298-101.983,85.942-125.798,143.089
		c-27.016,64.83-37.349,149.724-12.112,216.911c6.996,18.633,31.835,11.072,29.242-8.061
		C427.264,488.218,425.432,424.391,455.035,359.151z"
        style={{ fill: "#FFFFFF" }}
      />
      <path
        d="M796.789,1507.303c-47.98,43.269-86.656,100.677-127.225,150.821
		c-41.466,51.249-82.943,102.48-123.912,154.129c-7.103,8.95,5.262,21.798,12.774,12.775
		c43.192-51.874,85.837-104.181,128.526-156.473c40.282-49.344,87.829-98.271,119.975-153.432
		C810.708,1508.633,802.153,1502.47,796.789,1507.303z"
        style={{ fill: "#FFFFFF" }}
      />
      <path
        d="M1487.521,1774.669c-23.05-31.488-46.845-62.509-70.909-93.232
		c-25.457-32.502-51.366-64.657-77.437-96.662c-14.041-17.237-28.161-34.407-42.358-51.517
		c-11.177-13.467-20.278-27.703-37.218-33.715c-4.317-1.53-7.381,2.996-6.748,6.748c3.035,17.842,16.428,29.671,27.688,43.245
		c12.17,14.665,24.283,29.374,36.336,44.131c27.128,33.203,53.914,66.674,80.511,100.302c25.578,32.341,50.976,64.842,76.735,97.037
		c23.757,29.681,46.27,68.658,76.551,91.717c2.948,2.246,7.552-1.491,6.319-4.857
		C1543.491,1840.964,1510.644,1806.255,1487.521,1774.669z"
        style={{ fill: "#FFFFFF" }}
      />
    </g>
  </svg>
);

// --- Game Logic & Main Component ---

type Choice = "rock" | "paper" | "scissors";
type GameResult = "win" | "lose" | "tie";
type GameState =
  | "waiting"
  | "staking"
  | "ready"
  | "playing"
  | "result"
  | "contract_ready";

type GameStats = {
  playerWins: number;
  aiWins: number;
  ties: number;
};

const choices: Choice[] = ["rock", "paper", "scissors"];

export default function StakingRockPaperScissorsGame() {
  const { address: activeAddress } = useAccount();

  const [gameState, setGameState] = useState<GameState>("waiting");
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showStakeDialog, setShowStakeDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [message, setMessage] = useState("Connect wallet to start staking!");
  const [isInitializing, setIsInitializing] = useState(true);

  const [stats, setStats] = useState<GameStats>({
    playerWins: 0,
    aiWins: 0,
    ties: 0,
  });

  const {
    stakeAmount,
    reward,
    contractConfigured,
    walletConnected,
    contractState,
    isStaked,
    gameActive,
    stakeForGame,
    endGameWithResult,
    updateContractState,
    resetLocalGameState,
    isLoading,
    MONAD_TO_WEI,
  } = useStakeGame("rock-paper-scissor");

  const getWinner = (player: Choice, computer: Choice): GameResult => {
    if (player === computer) return "tie";
    if (
      (player === "rock" && computer === "scissors") ||
      (player === "paper" && computer === "rock") ||
      (player === "scissors" && computer === "paper")
    ) {
      return "win";
    }
    return "lose";
  };

  const playGame = async (playerChoice: Choice) => {
    if (gameState !== "contract_ready" || isAnimating) return;

    setIsAnimating(true);
    setPlayerChoice(playerChoice);
    setGameState("playing");

    setTimeout(() => {
      const computerChoice = choices[Math.floor(Math.random() * choices.length)]!;
      const gameResult = getWinner(playerChoice, computerChoice);

      setComputerChoice(computerChoice);
      setResult(gameResult);
      setIsAnimating(false);
      setGameState("result");

      setStats((prev) => {
        if (gameResult === "win") return { ...prev, playerWins: prev.playerWins + 1 };
        if (gameResult === "lose") return { ...prev, aiWins: prev.aiWins + 1 };
        return { ...prev, ties: prev.ties + 1 };
      });

      setTimeout(() => {
        setShowResultDialog(true);
      }, 1000);
    }, 1500);
  };

  const claimReward = useCallback(async () => {
    if (!result) return;
    const isDraw = result === "tie";
    const humanWon = result === "win";

    try {
      await endGameWithResult(humanWon, isDraw);
    } catch (error) {
      console.error("Error claiming reward:", error);
    } finally {
      resetLocalGameState();
      setPlayerChoice(null);
      setComputerChoice(null);
      setResult(null);
      setShowResultDialog(false);
      setGameState("staking");
      setMessage("Stake 1 MONAD to play again!");
      setShowStakeDialog(true);
    }
  }, [result, endGameWithResult, resetLocalGameState]);

  const resetGame = useCallback(() => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setIsAnimating(false);
    setGameState("staking");
    setMessage("Stake 1 MONAD to play against 1 AI bot!");
    setShowResultDialog(false);
  }, []);

  const getResultMessage = () => {
    if (!result) return message;
    switch (result) {
      case "win": return "🎉 You Win!";
      case "lose": return "💻 AI Wins!";
      case "tie": return "🤝 It's a Tie!";
      default: return message;
    }
  };

  useEffect(() => {
    if (walletConnected && contractConfigured) {
      updateContractState();
    }
  }, [walletConnected, contractConfigured, updateContractState]);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!activeAddress) {
      setMessage("Connect wallet to start staking!");
      setGameState("waiting");
      return;
    }

    if (contractState.gameStatus === BigInt(0)) {
      if (isStaked) {
        setMessage("Game ready! Make your choice!");
        setGameState("contract_ready");
      } else {
        setMessage("Stake 1 MONAD to play against 1 AI bot!");
        setGameState("staking");
      }
    } else if (contractState.gameStatus === BigInt(1)) {
      setMessage("Previous game in progress - make your choice or forfeit!");
      setGameState("contract_ready");
    } else if (contractState.gameStatus === BigInt(2)) {
      setMessage("Game finished! Check results.");
    }
  }, [activeAddress, contractState.gameStatus, isStaked]);

  const handleStake = async () => {
    const success = await stakeForGame();
    if (success) {
      setShowStakeDialog(false);
      setGameState("contract_ready");
      setMessage("Make your choice!");
    }
  };

  const ChoiceButton = ({ choice, selected, onClick, disabled }: { choice: Choice; selected: boolean; onClick: () => void; disabled: boolean }) => (
    <motion.button
      whileHover={!disabled ? { scale: 1.1, rotate: 5 } : {}}
      whileTap={!disabled ? { scale: 0.9 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`relative group p-4 rounded-3xl transition-all duration-300 ${
        selected
          ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/50 ring-4 ring-white/20"
          : disabled
          ? "bg-slate-800/50 opacity-50 cursor-not-allowed"
          : "bg-slate-800 hover:bg-slate-700 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20"
      }`}
    >
      <div className="w-16 h-16 sm:w-24 sm:h-24">
        {choice === "rock" && <RockIcon />}
        {choice === "paper" && <PaperIcon />}
        {choice === "scissors" && <ScissorsIcon />}
      </div>
      <p className="mt-4 text-center font-bold text-lg text-slate-200 capitalize tracking-wider">{choice}</p>
    </motion.button>
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black p-2 sm:p-4 font-sans text-slate-200">
      
      {/* Instructions Modal */}
      <Modal
        isOpen={showInstructions}
        title={
          <div className="flex items-center justify-center gap-2">
            <Info className="w-6 h-6 text-indigo-400" />
            <span>How to Play</span>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-3 text-slate-300">
            <p className="flex items-center gap-2"><span className="text-indigo-400 font-bold">1.</span> Stake {stakeAmount} MONAD to challenge the AI.</p>
            <p className="flex items-center gap-2"><span className="text-indigo-400 font-bold">2.</span> Choose Rock, Paper, or Scissors.</p>
            <p className="flex items-center gap-2"><span className="text-indigo-400 font-bold">3.</span> Win {(stakeAmount * 1.8).toFixed(2)} MONAD if you beat the bot!</p>
            <p className="flex items-center gap-2"><span className="text-indigo-400 font-bold">4.</span> Ties get {(stakeAmount * 0.9).toFixed(2)} MONAD back (10% fee).</p>
          </div>

          <div className="bg-indigo-900/30 border border-indigo-500/30 p-4 rounded-xl">
            <p className="text-center font-bold text-indigo-300">
              💰 Stake: {stakeAmount} MONAD | Win: {(stakeAmount * 1.8).toFixed(2)} MONAD
            </p>
          </div>

          {!walletConnected && (
            <div className="bg-amber-900/30 border border-amber-500/30 p-4 rounded-xl text-amber-200 text-sm text-center">
              ⚠️ Please connect your wallet to play.
            </div>
          )}

          <div className="flex flex-col gap-3">
            <GameButton
              onClick={() => {
                if (walletConnected && contractConfigured) {
                  setShowInstructions(false);
                  if (!gameActive) setShowStakeDialog(true);
                } else if (!walletConnected) {
                  setShowInstructions(false);
                }
              }}
              disabled={isInitializing || (!walletConnected && !contractConfigured)}
              variant="primary"
              className="w-full"
            >
              {isInitializing ? "Loading..." : walletConnected ? "Start Game" : "Close & Connect Wallet"}
            </GameButton>
            <Link href="/games" className="w-full">
              <GameButton variant="secondary" className="w-full">Back to Games</GameButton>
            </Link>
          </div>
        </div>
      </Modal>

      {/* Staking Modal */}
      <Modal
        isOpen={showStakeDialog}
        title={
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">💰</span>
            <span>Stake to Play</span>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-4 rounded-xl space-y-2 border border-slate-700">
            <div className="flex justify-between text-slate-300">
              <span>Your Stake</span>
              <span className="font-bold text-white">{stakeAmount} MONAD</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>AI Stake</span>
              <span className="font-bold text-white">{stakeAmount} MONAD</span>
            </div>
            <div className="h-px bg-slate-700 my-2" />
            <div className="flex justify-between text-emerald-400 font-bold text-lg">
              <span>Win Prize (90%)</span>
              <span>{(stakeAmount * 1.8).toFixed(2)} MONAD</span>
            </div>
          </div>

          {contractState.gamePool > BigInt(0) && (
             <div className="text-center text-xs text-slate-500">
               Pool Balance: {(Number(contractState.gamePool) / Number(MONAD_TO_WEI)).toFixed(1)} MONAD
             </div>
          )}

          <div className="flex flex-col gap-3">
            <GameButton
              onClick={handleStake}
              disabled={isLoading || !walletConnected}
              variant="success"
              className="w-full"
            >
              {isLoading ? "Staking..." : `Stake ${stakeAmount} MONAD & Play`}
            </GameButton>
            <Link href="/games" className="w-full">
              <GameButton variant="secondary" className="w-full">Back to Games</GameButton>
            </Link>
          </div>
        </div>
      </Modal>

      {/* Result Modal */}
      <Modal
        isOpen={showResultDialog}
        title={
          <div className="flex items-center justify-center gap-2">
            {result === "win" && <Trophy className="text-yellow-400 w-8 h-8" />}
            {result === "lose" && <Skull className="text-red-500 w-8 h-8" />}
            {result === "tie" && <Handshake className="text-blue-400 w-8 h-8" />}
            <span>{result === "win" ? "Victory!" : result === "lose" ? "Defeat" : "It's a Tie!"}</span>
          </div>
        }
      >
        <div className="space-y-6 text-center">
          <p className="text-2xl font-bold text-white">{getResultMessage()}</p>
          
          {result === "win" && (
            <div className="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-xl">
              <p className="text-emerald-300 font-bold">You won {(stakeAmount * 1.8).toFixed(2)} MONAD!</p>
            </div>
          )}
          
          {result === "lose" && (
            <div className="bg-rose-900/30 border border-rose-500/30 p-4 rounded-xl">
              <p className="text-rose-300">Better luck next time!</p>
            </div>
          )}

          {result === "tie" && (
            <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl">
              <p className="text-blue-300">Draw - {(stakeAmount * 0.9).toFixed(2)} MONAD returned (10% fee).</p>
            </div>
          )}

          <GameButton
            onClick={claimReward}
            disabled={isLoading}
            variant={result === "win" ? "success" : result === "tie" ? "warning" : "primary"}
            className="w-full"
          >
            {isLoading ? "Processing..." : result === "win" ? "Claim Reward" : result === "tie" ? "Claim Refund" : "Continue"}
          </GameButton>
        </div>
      </Modal>

      {/* Main Game Interface */}
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-lg">
            ROCK PAPER SCISSORS
          </h1>
          <p className="text-slate-400 font-medium tracking-wide">STAKE • PLAY • WIN</p>
        </div>

        {/* Scoreboard */}
        <GameCard className="w-full max-w-3xl bg-slate-900/80">
          <div className="flex justify-between items-center px-4 md:px-12">
            <div className="text-center">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">You</p>
              <p className="text-4xl font-black text-indigo-400">{stats.playerWins}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-slate-600">VS</span>
              <div className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400 font-mono">
                Ties: {stats.ties}
              </div>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">AI</p>
              <p className="text-4xl font-black text-rose-400">{stats.aiWins}</p>
            </div>
          </div>
        </GameCard>

        {/* Game Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
          
          {/* Player Side */}
          <div className="space-y-6">
             <div className="flex items-center justify-center gap-2 text-indigo-300 font-bold text-xl">
               <Gamepad2 className="w-6 h-6" />
               <span>Your Choice</span>
             </div>
             <div className="flex justify-center gap-4 flex-wrap">
               {choices.map((choice) => (
                 <ChoiceButton
                   key={choice}
                   choice={choice}
                   selected={playerChoice === choice}
                   disabled={gameState !== "contract_ready" || isAnimating}
                   onClick={() => playGame(choice)}
                 />
               ))}
             </div>
          </div>

          {/* AI Side */}
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-rose-300 font-bold text-xl">
               <Skull className="w-6 h-6" />
               <span>AI Choice</span>
            </div>
            <div className="flex justify-center items-center h-full min-h-[160px]">
              <AnimatePresence mode="wait">
                {computerChoice ? (
                  <motion.div
                    key="choice"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="p-6 bg-slate-800 rounded-3xl shadow-xl ring-4 ring-rose-500/20"
                  >
                    <div className="w-24 h-24">
                      {computerChoice === "rock" && <RockIcon />}
                      {computerChoice === "paper" && <PaperIcon />}
                      {computerChoice === "scissors" && <ScissorsIcon />}
                    </div>
                    <p className="mt-4 text-center font-bold text-lg text-rose-300 capitalize">{computerChoice}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-32 h-32 rounded-full border-4 border-dashed border-slate-700 flex items-center justify-center bg-slate-900/50"
                  >
                    <span className="text-4xl text-slate-600 font-black">?</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-4 mt-4">
           <Link href="/games">
             <GameButton variant="outline" size="sm" className="gap-2">
               <ArrowLeft className="w-4 h-4" /> Back to Games
             </GameButton>
           </Link>
        </div>

      </div>
    </div>
  );
}
