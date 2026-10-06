"use client";

import React, { useState, memo } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faRotate,
  faCheck,
  faHeart,
  faUtensils,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { FoodItem, Rarity } from "@/types/food";
import { useSavedFoods } from "@/context/SavedFoodsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FoodFlashCardProps {
  food: FoodItem;
  className?: string;
  autoFlipped?: boolean;
}

const rarityColors: Record<
  Rarity,
  {
    badge: string;
    border: string;
    glow: string;
  }
> = {
  SSR: {
    badge: "bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black",
    border: "border-amber-400/90 hover:border-amber-300",
    glow: "shadow-[0_4px_16px_rgba(251,191,36,0.25)]",
  },
  SR: {
    badge: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold",
    border: "border-purple-400/80 hover:border-purple-300",
    glow: "shadow-[0_4px_14px_rgba(168,85,247,0.2)]",
  },
  UC: {
    badge: "bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold",
    border: "border-sky-400/70 hover:border-sky-300",
    glow: "shadow-[0_4px_12px_rgba(14,165,233,0.15)]",
  },
  C: {
    badge: "bg-secondary text-white font-semibold",
    border: "border-border hover:border-secondary/60",
    glow: "shadow-sm",
  },
};

const FoodFlashCardComponent: React.FC<FoodFlashCardProps> = ({
  food,
  className = "",
  autoFlipped = false,
}) => {
  const { isSaved, toggleSaveFood } = useSavedFoods();
  const [isFlipped, setIsFlipped] = useState(autoFlipped);
  const [imgError, setImgError] = useState(false);

  const saved = isSaved(food.id);
  const rarityStyle = rarityColors[food.rarity] || rarityColors.C;

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaveFood(food);
  };

  // Image src path fallback
  const imageSrc = imgError || !food.imagePath
    ? "/logos/main-logo.png"
    : food.imagePath;

  return (
    <div
      className={`perspective-1000 w-[210px] sm:w-[225px] h-[305px] sm:h-[320px] select-none cursor-pointer group shrink-0 ${className}`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`relative w-full h-full duration-500 preserve-3d transition-transform ease-out rounded-2xl transform-gpu will-change-transform ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* ================= FRONT SIDE ================= */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl border ${
            rarityStyle.border
          } ${rarityStyle.glow} bg-card text-card-foreground flex flex-col overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1 ${
            isFlipped ? "pointer-events-none" : "pointer-events-auto"
          }`}
        >
          {/* Dish Image Container with Badges Overlaid */}
          <div className="relative h-[120px] sm:h-[130px] w-full overflow-hidden bg-muted/80 shrink-0">
            <Image
              src={imageSrc}
              alt={food.name}
              fill
              unoptimized
              draggable={false}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108 select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

            {/* Top Badges Over Image */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5">
                <Badge
                  className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider shadow-sm ${rarityStyle.badge}`}
                >
                  {food.rarity}
                </Badge>
                {food.status === "PENDING" && (
                  <Badge className="bg-amber-500/90 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-sm">
                    Chờ duyệt
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                className={`h-6 w-6 rounded-full backdrop-blur-md transition-all shrink-0 ${
                  saved
                    ? "text-white bg-primary shadow-sm"
                    : "text-white/90 bg-black/50 hover:text-white hover:bg-black/75"
                }`}
                title={saved ? "Đã lưu" : "Lưu món"}
              >
                <FontAwesomeIcon
                  icon={saved ? faCheck : faBookmark}
                  className="text-[11px]"
                />
              </Button>
            </div>

            {/* Bottom Real Stats Over Image */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white font-semibold drop-shadow-xs">
              <div className="flex items-center gap-1 bg-black/65 backdrop-blur-md px-2 py-0.5 rounded-full border border-rose-500/30 text-rose-300">
                <FontAwesomeIcon icon={faHeart} className="text-[9px]" />
                <span>{food.favorite_count || 0}</span>
              </div>

              <div className="flex items-center gap-1 bg-black/65 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-300">
                <FontAwesomeIcon icon={faUtensils} className="text-[9px]" />
                <span>{food.eaten_count || 0} đã ăn</span>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden gap-1.5">
            <div className="space-y-0.5">
              <h3 className="text-[13.5px] sm:text-[14px] font-bold text-foreground leading-tight truncate group-hover:text-secondary transition-colors">
                {food.name}
              </h3>

              <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
                {food.description || "Món ngon hấp dẫn từ cộng đồng ẩm thực AnGi."}
              </p>
            </div>

            {/* Real Status / Engagement Row */}
            <div className="flex items-center justify-between text-[9.5px] py-1 px-2 bg-muted/60 rounded-xl border border-border/50 font-medium">
              <span className="text-muted-foreground flex items-center gap-1">
                <FontAwesomeIcon icon={faCircleCheck} className="text-secondary text-[8.5px]" />
                <span>{food.status === "ACTIVE" ? "Đã kiểm duyệt" : "Đang chờ duyệt"}</span>
              </span>
              <span className="text-foreground font-bold">
                #Món {food.food_id || food.id}
              </span>
            </div>

            {/* Quick Action Links: Maps & Công thức */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(`Quán ${food.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="h-6.5 px-2 rounded-xl bg-background hover:bg-muted border border-border hover:border-emerald-500/50 flex items-center justify-center gap-1.5 text-[10px] font-bold text-foreground hover:text-emerald-500 transition-all shadow-2xs group/btn cursor-pointer"
                title={`Tìm quán ${food.name} trên Google Maps`}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg"
                  referrerPolicy="no-referrer"
                  alt="Maps"
                  className="w-3.5 h-3.5 object-contain shrink-0"
                />
                <span className="truncate">Maps</span>
              </a>

              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`Công thức làm ${food.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="h-6.5 px-2 rounded-xl bg-background hover:bg-muted border border-border hover:border-red-500/50 flex items-center justify-center gap-1.5 text-[10px] font-bold text-foreground hover:text-red-500 transition-all shadow-2xs group/btn cursor-pointer"
                title={`Xem công thức làm ${food.name} trên YouTube`}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png"
                  referrerPolicy="no-referrer"
                  alt="Công thức"
                  className="w-3.5 h-3.5 object-contain shrink-0"
                />
                <span className="truncate">Công thức</span>
              </a>
            </div>

            {/* Compact Flip Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleFlip}
              className="w-full h-6 text-[10px] font-bold rounded-xl border-border bg-muted/30 text-foreground hover:bg-muted hover:border-secondary/40 gap-1.5 px-2 transition-all cursor-pointer"
            >
              <FontAwesomeIcon icon={faRotate} className="text-[9px] text-secondary" />
              <span>Chi Tiết Món Ăn</span>
            </Button>
          </div>
        </div>

        {/* ================= BACK SIDE (DETAILS FLASHCARD) ================= */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl border ${
            rarityStyle.border
          } ${rarityStyle.glow} bg-card text-card-foreground flex flex-col p-3 overflow-hidden shadow-md ${
            !isFlipped ? "pointer-events-none" : "pointer-events-auto"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
            <div className="overflow-hidden">
              <span className="text-[8px] uppercase font-bold tracking-wider text-secondary block">
                Thông Tin Món Ăn
              </span>
              <h4 className="text-[12px] font-bold text-foreground truncate">{food.name}</h4>
            </div>
            <Badge className={`px-1.5 py-0.5 text-[9px] font-black rounded-lg uppercase ${rarityStyle.badge}`}>
              {food.rarity}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-1.5 py-1.5 text-[9px]">
            <div className="flex justify-between bg-muted/50 p-1 px-1.5 rounded-lg">
              <span className="text-muted-foreground">Yêu thích:</span>
              <span className="font-bold text-rose-500">
                {food.favorite_count || 0} lượt
              </span>
            </div>
            <div className="flex justify-between bg-muted/50 p-1 px-1.5 rounded-lg">
              <span className="text-muted-foreground">Đã ăn:</span>
              <span className="font-bold text-amber-500">
                {food.eaten_count || 0} lượt
              </span>
            </div>
            <div className="flex justify-between bg-muted/50 p-1 px-1.5 rounded-lg">
              <span className="text-muted-foreground">Trạng thái:</span>
              <span className="font-bold text-foreground">
                {food.status === "ACTIVE" ? "Khả dụng" : food.status}
              </span>
            </div>
            <div className="flex justify-between bg-muted/50 p-1 px-1.5 rounded-lg">
              <span className="text-muted-foreground">Độ hiếm:</span>
              <span className="font-bold text-foreground">
                {food.rarity}
              </span>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 border-t border-border/50 pt-1">
            <span className="text-[8px] font-bold text-muted-foreground block mb-0.5">
              Mô tả món ăn:
            </span>
            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 text-[8.5px]">
              <div className="p-1.5 rounded-md bg-muted/40 text-foreground leading-relaxed">
                {food.description && food.description.trim() !== ""
                  ? food.description
                  : "Chưa có mô tả chi tiết cho món ăn này. Món ăn đã được thêm vào hệ thống Ăn Gì."}
              </div>

              {food.contributor?.username && (
                <div className="text-[8px] text-muted-foreground pt-0.5">
                  Đóng góp bởi: <span className="font-bold text-foreground">{food.contributor.username}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Links on Back */}
          <div className="grid grid-cols-2 gap-1.5 pt-1.5">
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(`Quán ${food.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="h-6.5 px-2 rounded-xl bg-background hover:bg-muted border border-border hover:border-emerald-500/50 flex items-center justify-center gap-1.5 text-[9.5px] font-bold text-foreground hover:text-emerald-500 transition-all shadow-2xs group/btn cursor-pointer"
              title={`Tìm quán ${food.name} trên Google Maps`}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg"
                referrerPolicy="no-referrer"
                alt="Maps"
                className="w-3 h-3 object-contain shrink-0"
              />
              <span className="truncate">Maps</span>
            </a>

            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`Công thức làm ${food.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="h-6.5 px-2 rounded-xl bg-background hover:bg-muted border border-border hover:border-red-500/50 flex items-center justify-center gap-1.5 text-[9.5px] font-bold text-foreground hover:text-red-500 transition-all shadow-2xs group/btn cursor-pointer"
              title={`Xem công thức làm ${food.name} trên YouTube`}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png"
                referrerPolicy="no-referrer"
                alt="Công thức"
                className="w-3 h-3 object-contain shrink-0"
              />
              <span className="truncate">Công thức</span>
            </a>
          </div>

          {/* Back button */}
          <div className="pt-1.5 border-t border-border/60 flex gap-1.5 mt-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFlip}
              className="flex-1 h-6 text-[9.5px] font-bold rounded-xl border-border text-foreground hover:bg-muted gap-1 px-2 cursor-pointer"
            >
              <FontAwesomeIcon icon={faRotate} className="text-[8.5px]" />
              <span>Quay Lại</span>
            </Button>
            <Button
              variant={saved ? "default" : "secondary"}
              size="sm"
              onClick={handleSave}
              className={`h-6 rounded-xl px-2.5 text-[9.5px] font-bold cursor-pointer ${
                saved ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              <FontAwesomeIcon
                icon={saved ? faCheck : faBookmark}
                className="text-[9px]"
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FoodFlashCard = memo(FoodFlashCardComponent);
