import { motion, AnimatePresence } from "motion/react";
import React from "react";

export const GameButton = ({
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
  const baseStyles = "relative overflow-hidden rounded-xl font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "bg-gradient-to-br from-yellow-400 to-orange-600 text-white border-b-4 border-orange-700 hover:brightness-110",
    secondary: "bg-slate-700 text-slate-200 border-b-4 border-slate-900 hover:bg-slate-600",
    outline: "bg-transparent border-2 border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white",
    danger: "bg-gradient-to-br from-red-500 to-rose-700 text-white border-b-4 border-rose-900 hover:brightness-110",
    success: "bg-gradient-to-br from-emerald-400 to-green-600 text-white border-b-4 border-green-800 hover:brightness-110",
    warning: "bg-gradient-to-br from-amber-400 to-yellow-600 text-white border-b-4 border-yellow-800 hover:brightness-110",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

export const Modal = ({ isOpen, title, children }: { isOpen: boolean; title?: React.ReactNode; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Decorative header bar */}
          <div className="h-2 w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
          
          <div className="p-8">
            {title && (
              <h2 className="text-3xl font-black text-center mb-6 text-white uppercase tracking-tight drop-shadow-md">
                {title}
              </h2>
            )}
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${className}`}>
    {children}
  </div>
);
