"use client";

import React, { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotate,
  faArrowLeft,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { foodsApi } from "@/api";
import { FoodCard } from "@/api/types";
import { Rarity } from "@/types/food";
import { mapFoodCardToFoodItem } from "@/lib/foodAdapter";
import { BoosterPack, RevealAnimation, GachaVortex } from "@/components/gacha";
import { FoodFlashCard } from "@/components/food/FoodFlashCard";
import { Button } from "@/components/ui/button";
import { useGameSettings } from "@/context/GameSettingsContext";
import { SlidersHorizontal } from "lucide-react";

type GachaState = "pack" | "vortex" | "opening" | "revealed";

export interface GachaGameProps {
  className?: string;
}

export const GachaGame: React.FC<GachaGameProps> = () => {
  const { gachaSettings } = useGameSettings();

  // UI state
  const [gachaState, setGachaState] = useState<GachaState>("pack");
  const [winnerFood, setWinnerFood] = useState<FoodCard | null>(null);
  const [isGachaLoading, setIsGachaLoading] = useState(false);

  const handleStartGacha = useCallback(async () => {
    try {
      setIsGachaLoading(true);
      // 1. Tạo hiệu ứng vòng xoáy song song với fetch API
      setGachaState("vortex");
      setWinnerFood(null);

      // Đảm bảo thời gian hiển thị vòng xoáy đủ mượt mà (tối thiểu 1.6s)
      const minVortexDuration = 1600;
      const vortexTimer = new Promise((resolve) => setTimeout(resolve, minVortexDuration));

      const [res] = await Promise.all([
        foodsApi.gacha({
          numberOfExcludedEaten:
            gachaSettings.numberOfExcludedEaten > 0
              ? gachaSettings.numberOfExcludedEaten
              : undefined,
          typeOfExcludedEaten: gachaSettings.typeOfExcludedEaten,
          excludedGachaSet: gachaSettings.excludedGachaSet,
          foodSet:
            gachaSettings.foodSet.length > 0 ? gachaSettings.foodSet : undefined,
        }),
        vortexTimer,
      ]);

      if (!res?.data) {
        throw new Error("Không tìm thấy món ăn phù hợp với bộ lọc gacha hiện tại!");
      }

      // 2. Khi có response rồi thì hiển thị hiệu ứng đã gacha xong (RevealAnimation)
      setWinnerFood(res.data);
      setGachaState("opening");
    } catch (err: unknown) {
      // 3. Nếu fail thì có thông báo bằng toastify và giao diện quay lại như lúc chưa gacha
      const msg =
        (err as { message?: string })?.message ||
        "Không tìm thấy món ăn phù hợp cho gacha!";
      toast.error(msg);
      setGachaState("pack");
      setWinnerFood(null);
    } finally {
      setIsGachaLoading(false);
    }
  }, [gachaSettings]);

  const handleCancelGacha = useCallback(() => {
    setGachaState("pack");
    setIsGachaLoading(false);
    setWinnerFood(null);
  }, []);

  const handleRevealFinished = useCallback(() => {
    setGachaState("revealed");
  }, []);

  const handleResetToPack = useCallback(() => {
    setGachaState("pack");
  }, []);

  const hasCustomSettings =
    gachaSettings.numberOfExcludedEaten > 0 ||
    gachaSettings.excludedGachaSet ||
    gachaSettings.foodSet.length > 0;

  const currentRarity: Rarity =
    (winnerFood?.food_rank?.toUpperCase() as Rarity) || "C";

  return (
    <div className="w-full">
      {/* 1. Vòng xoáy gacha song song với fetch API */}
      {gachaState === "vortex" && (
        <GachaVortex onCancel={handleCancelGacha} />
      )}

      {/* 2. Hiệu ứng đã gacha xong (khi có response) */}
      {gachaState === "opening" && (
        <RevealAnimation
          highestRarity={currentRarity}
          foodName={winnerFood?.name}
          onFinish={handleRevealFinished}
        />
      )}

      {/* 3. Gacha Booster Pack Visual (Lúc chưa gacha hoặc khi reset/fail) */}
      {(gachaState === "pack" || gachaState === "vortex") && (
        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          {hasCustomSettings && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Đang áp dụng cài đặt tùy chỉnh</span>
            </div>
          )}

          <BoosterPack
            onOpen={handleStartGacha}
            count={1}
            isOpening={isGachaLoading}
          />
        </div>
      )}

      {/* 4. Gacha Revealed Single Winner Food */}
      {gachaState === "revealed" && winnerFood && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6 max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-card text-card-foreground border border-border shadow-md">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-black text-secondary uppercase tracking-widest flex items-center gap-1.5 justify-center sm:justify-start">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-secondary" />
                Kết Quả Gacha Xuất Sắc Nhất
              </span>
              <h3 className="text-xl font-bold text-foreground">
                Đã chọn món ăn điểm cao nhất cho bạn
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartGacha}
                className="rounded-full text-xs font-bold gap-1.5 border-border bg-card text-foreground hover:bg-muted"
              >
                <FontAwesomeIcon icon={faRotate} className="text-xs text-primary" />
                <span>Quay Lại</span>
              </Button>
            </div>
          </div>

          {/* Flashcard presentation */}
          <div className="flex justify-center">
            <FoodFlashCard food={mapFoodCardToFoodItem(winnerFood)} />
          </div>

          <div className="text-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToPack}
              className="rounded-full px-6 text-xs font-bold border-border bg-card text-foreground hover:bg-muted gap-1.5 cursor-pointer"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Quay Lại Vòng Quay</span>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
