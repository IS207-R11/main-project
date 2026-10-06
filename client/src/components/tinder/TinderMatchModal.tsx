"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faStar,
  faBookmark,
  faCheck,
  faRotate,
  faShareNodes,
  faUtensils,
  faSliders,
} from "@fortawesome/free-solid-svg-icons";
import type { FoodItem, Rarity } from "@/types/food";
import { useSavedFoods } from "@/context/SavedFoodsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TinderMatchModalProps {
  food: FoodItem | null;
  isSuperMatch?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  onChangeFilter: () => void;
}

const rarityGlows: Record<Rarity, string> = {
  SSR: "from-amber-500/30 via-yellow-400/20 to-amber-600/30 border-amber-400/80 shadow-[0_0_50px_rgba(251,191,36,0.35)]",
  SR: "from-purple-500/30 via-indigo-500/20 to-purple-600/30 border-purple-400/80 shadow-[0_0_45px_rgba(168,85,247,0.3)]",
  UC: "from-sky-500/30 via-blue-500/20 to-cyan-600/30 border-sky-400/80 shadow-[0_0_40px_rgba(14,165,233,0.25)]",
  C: "from-emerald-500/30 via-teal-500/20 to-emerald-600/30 border-emerald-500/70 shadow-[0_0_35px_rgba(16,185,129,0.25)]",
};

export const TinderMatchModal: React.FC<TinderMatchModalProps> = ({
  food,
  isSuperMatch = false,
  isOpen,
  onClose,
  onRestart,
  onChangeFilter,
}) => {
  const { isSaved, toggleSaveFood, saveFood } = useSavedFoods();
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Trigger grand confetti celebration on open
  useEffect(() => {
    if (!isOpen || !food) return;

    // Automatically ensure the matched food is saved to recent choices
    saveFood(food);

    const count = 200;
    const defaults = {
      origin: { y: 0.65 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ["#10b981", "#f59e0b", "#ec4899", "#3b82f6"],
    });
    fire(0.2, {
      spread: 60,
      colors: ["#10b981", "#f43f5e", "#8b5cf6"],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      colors: ["#fbbf24", "#34d399", "#60a5fa"],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, [isOpen, food, saveFood]);

  const handleShare = useCallback(() => {
    if (!food) return;
    const text = `🎉 Tôi vừa chốt món "${food.name}" cho bữa hôm nay trên Ứng Dụng Ăn Gì!`;
    if (navigator.share) {
      navigator
        .share({
          title: `Ăn gì hôm nay: ${food.name}`,
          text,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  }, [food]);

  if (!isOpen || !food) return null;

  const saved = isSaved(food.id);
  const glowStyle = rarityGlows[food.rarity] || rarityGlows.C;
  const imageSrc = imgError || !food.imagePath
    ? "/logos/main-logo.png"
    : food.imagePath;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop with dark blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.82, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`relative z-10 w-full max-w-lg rounded-2xl border-2 bg-gradient-to-b ${glowStyle} bg-popover text-popover-foreground p-5 sm:p-7 shadow-2xl overflow-hidden`}
        >
          {/* Top Celebration Title */}
          <div className="text-center space-y-2 mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest"
            >
              <FontAwesomeIcon
                icon={isSuperMatch ? faStar : faHeart}
                className={isSuperMatch ? "text-amber-400" : "text-rose-500"}
              />
              <span>{isSuperMatch ? "SUPER MATCH!" : "IT'S A MATCH!"}</span>
            </motion.div>

            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Món Ăn Định Mệnh Của Bạn!
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Bạn đã chọn món này để thưởng thức. Chúc bạn có một bữa ăn ngon miệng và tràn đầy năng lượng!
            </p>
          </div>

          {/* Matched Dish Card Display */}
          <div className="rounded-2xl border border-border/80 bg-background/80 overflow-hidden shadow-lg mb-5">
            <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-muted">
              <Image
                src={imageSrc}
                alt={food.name}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 500px"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              {/* Rarity & Status over image */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <Badge className="px-2.5 py-1 text-xs font-black rounded-full bg-primary text-primary-foreground shadow-md">
                  {food.rarity}
                </Badge>
                {food.status === "PENDING" && (
                  <Badge className="bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full shadow-md">
                    Chờ duyệt
                  </Badge>
                )}
              </div>

              {/* Dish Name & Price at bottom of image */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black drop-shadow-md leading-tight">
                      {food.name}
                    </h3>
                    <p className="text-xs text-amber-300 font-semibold drop-shadow-sm mt-0.5">
                      #{food.food_id || food.id} • {food.rarity}
                    </p>
                  </div>
                  <Badge className="shrink-0 bg-primary text-primary-foreground font-black px-2.5 py-1 rounded-full text-xs shadow-md">
                    {food.status === "ACTIVE" ? "Đã duyệt" : food.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Real Details in Modal */}
            <div className="p-4 space-y-3">
              {/* Engagement Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-muted/60 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block font-medium">
                    Yêu Thích
                  </span>
                  <span className="text-xs sm:text-sm font-black text-rose-500 flex items-center justify-center gap-1">
                    <FontAwesomeIcon icon={faHeart} className="text-[10px]" />
                    {food.favorite_count || 0}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-muted/60 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block font-medium">
                    Đã Ăn
                  </span>
                  <span className="text-xs sm:text-sm font-black text-amber-500 flex items-center justify-center gap-1">
                    <FontAwesomeIcon icon={faUtensils} className="text-[10px]" />
                    {food.eaten_count || 0}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-muted/60 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block font-medium">
                    Phân Hạng
                  </span>
                  <span className="text-xs sm:text-sm font-black text-foreground">
                    {food.rarity}
                  </span>
                </div>
              </div>

              {/* Description preview */}
              <div className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-2xl border border-border/40">
                <span className="font-bold text-foreground block mb-0.5">Mô tả:</span>
                {food.description && food.description.trim() !== ""
                  ? food.description
                  : "Món ăn ngon và hấp dẫn từ thực đơn hệ thống Ăn Gì."}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => toggleSaveFood(food)}
                className={`rounded-2xl text-xs font-bold gap-1.5 py-2.5 border-border transition-all cursor-pointer ${
                  saved
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-muted text-foreground"
                }`}
              >
                <FontAwesomeIcon icon={saved ? faCheck : faBookmark} className="text-xs" />
                <span>{saved ? "Đã Trong Thực Đơn" : "Lưu Vào Thực Đơn"}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleShare}
                className="rounded-2xl text-xs font-bold gap-1.5 py-2.5 border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faShareNodes} className="text-xs text-secondary" />
                <span>{copied ? "Đã Sao Chép!" : "Chia Sẻ Món"}</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="default"
                onClick={onRestart}
                className="rounded-2xl text-xs font-bold gap-1.5 py-2.5 bg-primary text-primary-foreground hover:brightness-105 shadow-md cursor-pointer"
              >
                <FontAwesomeIcon icon={faRotate} className="text-xs" />
                <span>Chơi Lại / Quẹt Tiếp</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={onChangeFilter}
                className="rounded-2xl text-xs font-bold gap-1.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <FontAwesomeIcon icon={faSliders} className="text-xs" />
                <span>Đổi Bộ Lọc Món</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
