"use client";

import React from "react";
import { Image } from "@/components/ui/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import type { Rarity } from "@/types/food";
import { getCardRarityStyle } from "./rarityStyles";

interface FoodCardBackProps {
  rarity?: Rarity;
  onFlip?: (e?: React.MouseEvent) => void;
  className?: string;
  size?: "sm" | "lg" | "auto";
}

export const FoodCardBack: React.FC<FoodCardBackProps> = ({
  rarity = "C",
  onFlip,
  className = "",
  size = "auto",
}) => {
  const style = getCardRarityStyle(rarity);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFlip?.(e);
  };

  // Determine logo size based on card size
  const isLarge = size === "lg";

  return (
    <div
      onClick={handleClick}
      className={`relative w-full h-full select-none cursor-pointer rounded-3xl border-2 ${style.border} ${style.backGlow} bg-gradient-to-b from-neutral-900 via-slate-950 to-neutral-950 text-white flex flex-col items-center justify-between p-4 sm:p-5 overflow-hidden transition-all duration-300 group ${className}`}
    >
      {/* Background Holographic Ambient Aura */}
      <div className="absolute inset-0 opacity-25 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent group-hover:opacity-40 transition-opacity duration-500" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-gradient-to-r from-secondary/15 via-primary/10 to-transparent blur-2xl pointer-events-none" />

      {/* Decorative Ornate Inner Frame */}
      <div
        className={`absolute inset-2.5 sm:inset-3.5 rounded-2xl border ${style.innerBorder} pointer-events-none flex flex-col justify-between p-2`}
      >
        {/* Top 2 Corner Accents */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs">
          <span className={`${style.cornerAccent} font-mono opacity-80`}>✦</span>
          <span className={`${style.cornerAccent} font-mono opacity-80`}>✦</span>
        </div>

        {/* Bottom 2 Corner Accents */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs">
          <span className={`${style.cornerAccent} font-mono opacity-80`}>✦</span>
          <span className={`${style.cornerAccent} font-mono opacity-80`}>✦</span>
        </div>
      </div>

      {/* Top Branding Tag */}
      <div className="z-10 pt-1 flex items-center justify-center">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-white/60 group-hover:text-white/90 transition-colors">
          ĂN GÌ? • CARD
        </span>
      </div>

      {/* Centerpiece: Light Logo */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center px-4 w-full">
        <div className="relative flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
          <Image
            src="/logos/light-logo.png"
            alt="AnGi Logo"
            width={isLarge ? 220 : 150}
            height={isLarge ? 220 : 150}
            priority
            unoptimized
            draggable={false}
            className={`object-contain select-none drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)] ${
              isLarge
                ? "w-44 sm:w-56 max-h-56"
                : "w-28 sm:w-34 max-h-36"
            }`}
          />
        </div>
      </div>

      {/* Bottom Flip Back Action Button */}
      <div className="z-10 pb-1">
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white/90 hover:text-white text-[11px] sm:text-xs font-bold transition-all shadow-md cursor-pointer"
          title="Lật lại mặt trước"
        >
          <FontAwesomeIcon icon={faRotate} className="text-[10px] sm:text-xs text-secondary" />
          <span>Lật lại mặt trước</span>
        </button>
      </div>
    </div>
  );
};
