"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCompass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";

export interface GachaVortexProps {
  /** Optional custom headline message */
  title?: string;
  /** Optional callback to cancel gacha */
  onCancel?: () => void;
  /** Render mode: fixed overlay or in-place inline */
  overlay?: boolean;
}

const SUMMON_PHRASES = [
  "Đang khai mở cổng kết nối hương vị...",
  "Hội tụ tinh hoa ẩm thực từ muôn nơi...",
  "Đang tinh tuyển món ngon với độ hiếm đỉnh cao...",
  "Các vì tinh tú ẩm thực đang xoay chuyển...",
  "Chuẩn bị đón nhận món ăn định mệnh...",
];

export const GachaVortex: React.FC<GachaVortexProps> = ({
  title = "VÒNG XOÁY ẨM THỰC",
  onCancel,
  overlay = true,
}) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Cycle phrases while spinning
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % SUMMON_PHRASES.length);
    }, 1300);
    return () => clearInterval(interval);
  }, []);

  // Pre-generate 16 particles with stable deterministic random positions & colors
  const particles = useMemo(() => {
    const colors = [
      "bg-amber-400 shadow-[0_0_12px_#fbbf24]",
      "bg-purple-400 shadow-[0_0_12px_#c084fc]",
      "bg-cyan-400 shadow-[0_0_12px_#38bdf8]",
      "bg-rose-400 shadow-[0_0_12px_#fb7185]",
      "bg-emerald-400 shadow-[0_0_12px_#34d399]",
    ];
    return Array.from({ length: 16 }).map((_, i) => {
      const angle = (i * 360) / 16;
      const radius = 130 + (i % 4) * 35; // 130px to 235px
      const color = colors[i % colors.length];
      const size = (i % 3 === 0 ? 8 : i % 2 === 0 ? 6 : 5);
      const delay = (i * 0.15) % 1.8;
      const duration = 1.8 + (i % 3) * 0.4;
      return { id: i, angle, radius, color, size, delay, duration };
    });
  }, []);

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative flex flex-col items-center justify-center select-none overflow-hidden ${
        overlay
          ? "fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl text-white"
          : "w-full py-12 rounded-3xl bg-slate-950/70 border border-border/40 text-white"
      }`}
    >
      {/* Background ambient radial aura */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] rounded-full bg-gradient-to-r from-amber-500/20 via-purple-600/25 to-cyan-500/20 blur-3xl opacity-75 animate-pulse" />
      </div>

      {/* Main Vortex Canvas Area */}
      <div className="relative w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] flex items-center justify-center">
        {/* Layer 1: Outer Conic Swirl Spiral (Clockwise) */}
        <div
          className="absolute inset-0 rounded-full animate-vortex-clockwise opacity-70 pointer-events-none"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(245, 158, 11, 0.45) 45deg, transparent 80deg, rgba(168, 85, 247, 0.5) 130deg, transparent 170deg, rgba(14, 165, 233, 0.5) 220deg, transparent 260deg, rgba(244, 63, 94, 0.5) 310deg, transparent 350deg)",
            filter: "blur(4px)",
          }}
        />

        {/* Layer 2: Middle Counter-Rotating Spiral (Counter-Clockwise) */}
        <div
          className="absolute w-[85%] h-[85%] rounded-full animate-vortex-counter opacity-80 pointer-events-none"
          style={{
            background:
              "conic-gradient(from 180deg, transparent 0deg, rgba(56, 189, 248, 0.6) 60deg, transparent 110deg, rgba(251, 191, 36, 0.65) 170deg, transparent 220deg, rgba(216, 180, 254, 0.65) 280deg, transparent 340deg)",
            filter: "blur(2px)",
          }}
        />

        {/* Layer 3: Concentric Neon Orbital Rings */}
        <div className="absolute w-[98%] h-[98%] rounded-full border border-dashed border-amber-400/30 animate-vortex-clockwise pointer-events-none" />
        <div className="absolute w-[78%] h-[78%] rounded-full border border-dotted border-purple-400/40 animate-vortex-counter pointer-events-none" />
        <div className="absolute w-[58%] h-[58%] rounded-full border-2 border-cyan-400/40 animate-vortex-clockwise pointer-events-none" />

        {/* Layer 4: Inward Ingestion Particles (Vortex Suction) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const startX = Math.cos(rad) * p.radius;
            const startY = Math.sin(rad) * p.radius;

            return (
              <motion.div
                key={p.id}
                initial={{
                  x: startX,
                  y: startY,
                  scale: 1,
                  opacity: 0,
                }}
                animate={{
                  x: [startX, startX * 0.5, 0],
                  y: [startY, startY * 0.5, 0],
                  scale: [0.6, 1.2, 0],
                  opacity: [0, 0.9, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: p.delay,
                }}
                className={`absolute rounded-full ${p.color}`}
                style={{ width: p.size, height: p.size }}
              />
            );
          })}
        </div>

        {/* Layer 5: Pulsing Center Singularity Orb */}
        <motion.div
          animate={{
            scale: [0.92, 1.08, 0.95],
            rotate: 360,
          }}
          transition={{
            scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            rotate: { repeat: Infinity, duration: 10, ease: "linear" },
          }}
          className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center bg-radial from-white/90 via-amber-400/60 to-purple-600/40 animate-vortex-glow shadow-2xl"
        >
          {/* Internal Shimmering Light */}
          <div className="absolute inset-2 rounded-full bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden border border-amber-300/60 shadow-inner">
            <motion.div
              animate={{
                rotateY: [0, 180, 360],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                rotateY: { repeat: Infinity, duration: 3.5, ease: "easeInOut" },
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
              }}
              className="flex flex-col items-center justify-center gap-1.5"
            >
              <Image
                src="/logos/light-logo.png"
                alt="Vortex Singularity"
                width={56}
                height={56}
                draggable={false}
                className="w-12 sm:w-14 h-auto object-contain drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]"
              />
              <div className="flex items-center gap-1 text-[10px] font-black tracking-widest text-amber-300 uppercase">
                <FontAwesomeIcon icon={faStar} className="text-[8px] animate-spin" />
                <span>ANGI</span>
                <FontAwesomeIcon icon={faStar} className="text-[8px] animate-spin" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Vortex Status & Text Area */}
      <div className="mt-8 flex flex-col items-center text-center space-y-3 z-10 px-4 max-w-md">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 font-extrabold text-xs tracking-wider uppercase backdrop-blur-md shadow-lg shadow-amber-500/10">
          <FontAwesomeIcon icon={faCompass} className="text-xs animate-spin" />
          <span>{title}</span>
        </div>

        {/* Dynamic cycling flavor text */}
        <div className="h-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-cyan-200 tracking-wide drop-shadow-md text-center"
            >
              {SUMMON_PHRASES[phraseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-56 sm:w-64 h-1.5 rounded-full bg-white/10 overflow-hidden relative shadow-inner">
          <motion.div
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
            className="w-1/2 h-full rounded-full bg-gradient-to-r from-transparent via-amber-400 to-cyan-400"
          />
        </div>

        {/* Micro-hint */}
        <p className="text-[11px] text-white/50 font-mono tracking-wide">
          Hệ thống đang kết nối vũ trụ ẩm thực...
        </p>

        {/* Optional cancel button */}
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="mt-2 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-full gap-1.5 h-8 px-4 cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
            <span>Hủy bỏ</span>
          </Button>
        )}
      </div>
    </motion.div>
  );

  return overlay ? <AnimatePresence>{content}</AnimatePresence> : content;
};
