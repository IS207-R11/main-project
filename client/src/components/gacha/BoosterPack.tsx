"use client";

import React from "react";
import { Image } from "@/components/ui/image";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faWandMagicSparkles, faStar } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";

interface BoosterPackProps {
  onOpen: () => void;
  isOpening?: boolean;
  count?: number;
}

export const BoosterPack: React.FC<BoosterPackProps> = ({
  onOpen,
  isOpening = false,
  count = 3,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 select-none">
      {/* 2D Foil Booster Pack Container with Framer Motion */}
      <motion.div
        onClick={!isOpening ? onOpen : undefined}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={!isOpening ? { scale: 1.03, y: -6 } : {}}
        whileTap={!isOpening ? { scale: 0.98 } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`relative w-72 sm:w-80 h-[430px] sm:h-[475px] rounded-3xl cursor-pointer transition-all duration-300 group ${
          isOpening ? "scale-95 opacity-50 blur-xs rotate-2 pointer-events-none" : ""
        }`}
        style={{ perspective: "1000px" }}
      >
        {/* Glow ambient background aura */}
        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-secondary via-primary to-secondary opacity-35 blur-xl group-hover:opacity-70 transition-opacity duration-500 -z-10 animate-pulse" />

        {/* Foil Pouch Body */}
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-2 border-border bg-card flex flex-col justify-between">
          {/* Hologram Foil Sheen Overlay */}
          <div className="absolute inset-0 opacity-40 bg-gradient-to-tr from-rose-400/20 via-amber-300/25 via-emerald-400/25 to-sky-400/20 pointer-events-none animate-holo mix-blend-overlay" />

          {/* Diagonal Foil Reflection Highlight */}
          <div className="absolute -inset-full w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-45 pointer-events-none group-hover:translate-x-full transition-transform duration-1000" />

          {/* Top Crimped / Zigzag Edge */}
          <div className="h-6 w-full bg-muted/90 flex items-center justify-center border-b border-border/60 relative">
            <div className="flex gap-1">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="w-2.5 h-1.5 bg-secondary/40 rounded-xs" />
              ))}
            </div>
            {/* Tear Notch Indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[8.5px] font-black text-foreground tracking-wider">
              <div className="w-2 h-0.5 bg-secondary" />
            </div>
          </div>

          {/* Pack Center Branding & Graphics */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
            {/* Emblem Logo */}
            <div className="relative flex justify-center">
              <motion.div
                whileHover={{ rotate: 4, scale: 1.06 }}
                className="relative"
              >
                <Image
                  src="/logos/main-logo.png"
                  alt="Logo Ăn gì?"
                  width={90}
                  height={110}
                  draggable={false}
                  className="h-28 sm:h-32 w-auto object-contain select-none"
                />
              </motion.div>
              <div className="absolute -bottom-2 -right-1 bg-secondary text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                x{count} món
              </div>
            </div>

            {/* Pack Title */}
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                ĂN GÌ? • PHIÊN BẢN HÔM NAY
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Gói Gợi Ý Món Ăn
              </h3>
              <p className="text-xs text-muted-foreground font-medium max-w-[240px] mx-auto line-clamp-2">
                Khám phá món ngon phù hợp theo khẩu vị, thời gian và chỉ số dinh dưỡng.
              </p>
            </div>

            {/* Rarity Chance Teaser */}
            <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/40">
              <span className="text-amber-500 font-black">SSR</span>
              <span>•</span>
              <span className="text-purple-500 font-black">SR</span>
              <span>•</span>
              <span className="text-sky-500 font-black">UC</span>
              <span>•</span>
              <span className="text-secondary font-black">C</span>
            </div>
          </div>

          {/* Bottom Crimped Edge */}
          <div className="h-6 w-full bg-muted/90 flex items-center justify-center border-t border-border/60 relative">
            <div className="flex gap-1">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="w-2.5 h-1.5 bg-secondary/40 rounded-xs" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Button Under Pack */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 flex flex-col items-center gap-2"
      >
        <Button
          size="lg"
          onClick={onOpen}
          disabled={isOpening}
          className="rounded-full px-8 py-6 text-base font-bold bg-primary text-primary-foreground shadow-lg hover:brightness-105 active:scale-98 transition-all cursor-pointer"
        >
          <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2 text-secondary" />
          <span>{isOpening ? "Đang Mở Gói..." : "Mở Gói Khám Phá Ngay"}</span>
        </Button>
      </motion.div>
    </div>
  );
};
