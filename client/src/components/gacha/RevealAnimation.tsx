"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { Rarity } from "@/types/food";

interface RevealAnimationProps {
  highestRarity: Rarity;
  onFinish: () => void;
  foodName?: string;
}

export const RevealAnimation: React.FC<RevealAnimationProps> = ({
  highestRarity,
  onFinish,
  foodName,
}) => {
  useEffect(() => {
    // Fire confetti blast
    try {
      const colors =
        highestRarity === "SSR"
          ? ["#f59e0b", "#fbbf24", "#f4a261", "#e76f51"]
          : highestRarity === "SR"
          ? ["#a855f7", "#8b5cf6", "#6366f1", "#ec4899"]
          : highestRarity === "UC"
          ? ["#0ea5e9", "#38bdf8", "#06b6d4", "#3b82f6"]
          : ["#10b981", "#34d399", "#14b8a6", "#22c55e"];

      confetti({
        particleCount:
          highestRarity === "SSR"
            ? 120
            : highestRarity === "SR"
            ? 80
            : highestRarity === "UC"
            ? 60
            : 40,
        spread: 90,
        origin: { y: 0.6 },
        colors,
      });
    } catch (e) {
      console.error(e);
    }

    const timer = setTimeout(() => {
      onFinish();
    }, 2400);

    return () => clearTimeout(timer);
  }, [highestRarity, onFinish]);

  const rarityColorClasses: Record<Rarity, { text: string; bg: string }> = {
    SSR: {
      text: "from-amber-200 via-yellow-400 to-amber-500",
      bg: "from-amber-950/80 via-slate-950 to-black",
    },
    SR: {
      text: "from-purple-200 via-purple-400 to-indigo-500",
      bg: "from-indigo-950/80 via-slate-950 to-black",
    },
    UC: {
      text: "from-cyan-200 via-sky-400 to-blue-500",
      bg: "from-sky-950/80 via-slate-950 to-black",
    },
    C: {
      text: "from-emerald-200 via-teal-400 to-emerald-500",
      bg: "from-emerald-950/80 via-slate-950 to-black",
    },
  };

  const currentRarityStyle = rarityColorClasses[highestRarity] || rarityColorClasses.C;

  return (
    <AnimatePresence>
      <motion.div
        onClick={onFinish}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b ${currentRarityStyle.bg} text-white cursor-pointer select-none overflow-hidden`}
      >
        {/* Radiant Rotating Beams */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div
            className="w-[1300px] h-[1300px] rounded-full animate-radiant-spin"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.2) 15deg, transparent 30deg, transparent 45deg, rgba(255,255,255,0.2) 60deg, transparent 75deg, transparent 90deg, rgba(255,255,255,0.25) 105deg, transparent 120deg, transparent 135deg, rgba(255,255,255,0.2) 150deg, transparent 165deg, transparent 180deg, rgba(255,255,255,0.25) 195deg, transparent 210deg, transparent 225deg, rgba(255,255,255,0.2) 240deg, transparent 255deg, transparent 270deg, rgba(255,255,255,0.25) 285deg, transparent 300deg, transparent 315deg, rgba(255,255,255,0.2) 330deg, transparent 345deg)",
            }}
          />
        </div>

        {/* Center glowing ring circles */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative flex flex-col items-center justify-center z-10"
        >
          {/* Decorative thin concentric lines */}
          <div className="absolute -inset-20 sm:-inset-28 rounded-full border border-white/20 pointer-events-none animate-pulse" />
          <div className="absolute -inset-32 sm:-inset-44 rounded-full border border-white/10 pointer-events-none" />

          {/* Small Discovery Tag */}
          <motion.span
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-xs sm:text-sm tracking-widest uppercase text-white/80 mb-2 font-bold"
          >
            KHÁM PHÁ MỚI
          </motion.span>

          {/* Big Radiant Rarity Typography */}
          <motion.h1
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.15, 1], opacity: 1 }}
            transition={{ duration: 0.6, times: [0, 0.7, 1] }}
            className={`text-8xl sm:text-9xl font-black tracking-normal uppercase bg-gradient-to-b ${currentRarityStyle.text} bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(255,255,255,0.7)] my-2`}
          >
            {highestRarity}
          </motion.h1>

          {/* Discovered Subtitle with Stars */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 mt-4"
          >
            <span className="text-xs text-secondary">✦</span>
            <span className="text-base sm:text-xl tracking-wider uppercase text-white font-extrabold drop-shadow-md">
              ĐÃ XUẤT HIỆN
            </span>
            <span className="text-xs text-secondary">✦</span>
          </motion.div>

          {/* Food Name Highlight */}
          {foodName && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-base sm:text-lg font-bold text-white shadow-xl"
            >
              {foodName}
            </motion.div>
          )}

          {/* Skip Hint */}
          <motion.span
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-xs text-white/60 mt-8 font-mono tracking-wider"
          >
            (Chạm vào màn hình để xem thẻ bài)
          </motion.span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
