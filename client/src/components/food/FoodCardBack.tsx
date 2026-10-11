"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotate,
  faHeart,
  faThumbsDown,
  faUtensils,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import type { FoodItem, Rarity } from "@/types/food";
import { Badge } from "@/components/ui/badge";
import { stripFoodCode } from "@/lib/foodAdapter";
import { getCardRarityStyle } from "./rarityStyles";

interface FoodCardBackProps {
  food?: FoodItem | null;
  rarity?: Rarity;
  onFlip?: (e?: React.MouseEvent) => void;
  className?: string;
  size?: "sm" | "lg" | "auto";
}

export const FoodCardBack: React.FC<FoodCardBackProps> = ({
  food,
  rarity = food?.rarity || "C",
  onFlip,
  className = "",
  size = "auto",
}) => {
  const style = getCardRarityStyle(rarity);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFlip?.(e);
  };

  const isLarge = size === "lg";
  const cleanName = food ? stripFoodCode(food.name) || food.name : "Món ăn";

  return (
    <div
      onClick={handleClick}
      className={`relative w-full h-full select-none cursor-pointer rounded-3xl border-2 ${style.border} ${style.backGlow} bg-gradient-to-b from-[#421307] via-[#2c0b04] to-[#160501] text-white flex flex-col justify-between p-4 sm:p-5 overflow-hidden transition-all duration-300 group ${className}`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent group-hover:opacity-30 transition-opacity duration-500" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-gradient-to-r from-secondary/15 via-primary/10 to-transparent blur-2xl pointer-events-none" />

      {/* Decorative Ornate Inner Border */}
      <div
        className={`absolute inset-2 sm:inset-3 rounded-2xl border ${style.innerBorder} pointer-events-none flex flex-col justify-between p-1.5`}
      >
        <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
          <span className={`${style.cornerAccent} font-mono opacity-80`}>✦</span>
          <span className={`${style.cornerAccent} font-mono opacity-80`}>✦</span>
        </div>
        <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
          <span className={`${style.cornerAccent} font-mono opacity-80`}>✦</span>
          <span className={`${style.cornerAccent} font-mono opacity-80`}>✦</span>
        </div>
      </div>

      {/* 1. Header: Info Tag & Rarity Badge */}
      <div className="z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1.5 text-secondary">
          <FontAwesomeIcon icon={faCircleInfo} className="text-xs" />
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-200">
            Thông Tin Món Ăn
          </span>
        </div>
        <Badge
          className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm ${style.badge}`}
        >
          {rarity}
        </Badge>
      </div>

      {/* 2. Main Content Details */}
      <div className="z-10 flex-1 flex flex-col justify-around gap-2.5 py-2.5 overflow-hidden">
        {/* Dish Title */}
        <div>
          <h3
            className={`${
              isLarge ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
            } font-black text-white leading-tight tracking-tight drop-shadow-md line-clamp-1`}
          >
            {cleanName}
          </h3>
          <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
            Độ hiếm: {rarity} {food?.status === "PENDING" ? "• (Chờ duyệt)" : ""}
          </p>
        </div>

        {/* Description Box */}
        <div className="bg-black/35 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-justify">
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-200 block mb-1">
            Mô tả hương vị:
          </span>
          <p
            className={`${
              isLarge ? "text-xs sm:text-[13px] line-clamp-4" : "text-[11px] line-clamp-3"
            } text-white/90 leading-relaxed font-normal`}
          >
            {food?.description && food.description.trim() !== ""
              ? food.description
              : "Món ăn ngon và đặc sắc từ thực đơn hệ thống cộng đồng ẩm thực Ăn Gì."}
          </p>
        </div>

        {/* Community Stats Metrics */}
        {food && (
          <div className="grid grid-cols-3 gap-1.5 bg-black/25 p-2 rounded-xl border border-white/10 text-center">
            <div className="flex flex-col items-center justify-center p-1">
              <div className="flex items-center gap-1 text-rose-400 text-xs mb-0.5">
                <FontAwesomeIcon icon={faHeart} />
              </div>
              <span className="text-[10px] text-white/70">Yêu thích</span>
              <span className="text-xs font-black text-white">{food.favorites_count ?? 0} lượt</span>
            </div>

            <div className="flex flex-col items-center justify-center p-1 border-x border-white/10">
              <div className="flex items-center gap-1 text-sky-400 text-xs mb-0.5">
                <FontAwesomeIcon icon={faThumbsDown} />
              </div>
              <span className="text-[10px] text-white/70">Không thích</span>
              <span className="text-xs font-black text-white">{food.hated_count ?? 0} lượt</span>
            </div>

            <div className="flex flex-col items-center justify-center p-1">
              <div className="flex items-center gap-1 text-emerald-400 text-xs mb-0.5">
                <FontAwesomeIcon icon={faUtensils} />
              </div>
              <span className="text-[10px] text-white/70">Đã ăn</span>
              <span className="text-xs font-black text-white">{food.eaten_count ?? 0} lần</span>
            </div>
          </div>
        )}

        {/* External Quick Search Links */}
        <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(`Quán ${cleanName}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all shadow-xs"
            title={`Tìm quán ${cleanName} trên Google Maps`}
          >
            <img
              src="/other-images/googlemaps.webp"
              alt="Google Maps"
              className="w-3.5 h-3.5 object-contain"
            />
            <span className="truncate">Tìm Quán</span>
          </a>

          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
              `Công thức làm ${cleanName}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all shadow-xs"
            title={`Xem công thức nấu ${cleanName} trên YouTube`}
          >
            <img
              src="/other-images/youtube.webp"
              alt="YouTube"
              className="w-3.5 h-3.5 object-contain"
            />
            <span className="truncate">Công Thức</span>
          </a>
        </div>
      </div>

      {/* 3. Footer: Flip Back Action Button */}
      <div className="z-10 pt-1 flex items-center justify-center border-t border-white/10">
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white text-[11px] sm:text-xs font-bold transition-all shadow-md cursor-pointer"
          title="Lật lại mặt trước"
        >
          <FontAwesomeIcon icon={faRotate} className="text-[10px] text-secondary" />
          <span>Lật lại mặt trước</span>
        </button>
      </div>
    </div>
  );
};
