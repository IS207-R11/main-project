"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faBolt } from "@fortawesome/free-solid-svg-icons";
import { SlidersHorizontal } from "lucide-react";
import type { FoodItem } from "@/types/food";
import { foodsApi } from "@/api";
import { mapFoodCardToFoodItem } from "@/lib/foodAdapter";
import { resolveEligibleFoodIds } from "@/lib/foodFilter";
import { useGameSettings } from "@/context/GameSettingsContext";
import { TinderCardStack } from "@/components/tinder/TinderCardStack";
import { Button } from "@/components/ui/button";

interface TinderGameProps {
  allFoods?: FoodItem[];
  initialMode?: "ready" | "swiping";
}

export const TinderGame: React.FC<TinderGameProps> = ({
  allFoods: propFoods,
  initialMode = "ready",
}) => {
  const { tinderSettings } = useGameSettings();
  const [apiFoods, setApiFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"ready" | "swiping">(initialMode);
  const [deck, setDeck] = useState<FoodItem[]>([]);

  const loadTinderFoods = useCallback(async () => {
    if (propFoods && propFoods.length > 0) return;
    try {
      setIsLoading(true);
      const eligibleFoodIds = await resolveEligibleFoodIds({
        dietary: tinderSettings.dietary,
        allergies: tinderSettings.allergies,
        mealSession: tinderSettings.mealSession,
        foodSet: tinderSettings.foodSet,
      });

      const res = await foodsApi.tinder({
        numberOfResult: tinderSettings.numberOfResult,
        numberOfExcludedEaten:
          tinderSettings.numberOfExcludedEaten > 0
            ? tinderSettings.numberOfExcludedEaten
            : undefined,
        typeOfExcludedEaten: tinderSettings.typeOfExcludedEaten,
        excludedGachaSet: tinderSettings.excludedGachaSet,
        foodSet: eligibleFoodIds,
      });
      if (res.data) {
        setApiFoods(res.data.map(mapFoodCardToFoodItem));
      }
    } catch (err) {
      console.error("Lỗi khi tải món ăn cho Tinder:", err);
    } finally {
      setIsLoading(false);
    }
  }, [propFoods, tinderSettings]);

  useEffect(() => {
    loadTinderFoods();
  }, [loadTinderFoods]);

  const allFoods = useMemo(() => {
    return propFoods && propFoods.length > 0 ? propFoods : apiFoods;
  }, [propFoods, apiFoods]);

  const hasCustomSettings =
    tinderSettings.numberOfExcludedEaten > 0 ||
    tinderSettings.excludedGachaSet ||
    tinderSettings.foodSet.length > 0 ||
    (tinderSettings.dietary && tinderSettings.dietary !== "all") ||
    (tinderSettings.allergies && tinderSettings.allergies.length > 0) ||
    (tinderSettings.mealSession && tinderSettings.mealSession !== "all");

  // Generate randomized deck and start Tinder swiping
  const handleStartTinder = useCallback(() => {
    if (allFoods.length === 0) return;
    const pool = [...allFoods];
    // Fisher-Yates shuffle algorithm
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    setDeck(pool);
    setMode("swiping");
  }, [allFoods]);

  // Restart Tinder with fresh fetch & shuffle
  const handleRestart = useCallback(async () => {
    await loadTinderFoods();
    handleStartTinder();
  }, [loadTinderFoods, handleStartTinder]);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {mode === "ready" ? (
          <motion.div
            key="ready-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full py-4 flex flex-col items-center justify-center space-y-5"
          >
            {hasCustomSettings && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Đang áp dụng cài đặt tùy chỉnh</span>
              </div>
            )}

            {/* Tinder Stack Visual Card */}
            <motion.div
              onClick={!isLoading && allFoods.length > 0 ? handleStartTinder : undefined}
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              whileHover={!isLoading && allFoods.length > 0 ? { scale: 1.02, y: -4 } : {}}
              whileTap={!isLoading && allFoods.length > 0 ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative w-72 sm:w-80 h-[380px] sm:h-[420px] rounded-3xl cursor-pointer transition-all duration-300 group"
            >
              {/* Ambient Glow */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 opacity-30 blur-xl group-hover:opacity-60 transition-opacity duration-500 -z-10 animate-pulse" />

              {/* Stack Card Body */}
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-2 border-border bg-card flex flex-col justify-between p-6 text-center">
                <div className="flex justify-center pt-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                    ĂN GÌ? • TINDER QUẸT MÓN
                  </span>
                </div>

                <div className="space-y-3 flex flex-col items-center justify-center my-auto">
                  <div className="size-24 sm:size-28 rounded-full bg-gradient-to-tr from-rose-500/20 via-orange-500/20 to-amber-500/20 flex items-center justify-center border border-rose-500/30 text-rose-500 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <FontAwesomeIcon
                      icon={faFire}
                      className="text-5xl sm:text-6xl text-rose-500 drop-shadow-md animate-bounce"
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                      Quẹt Món Yêu Thích
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Khám phá món ăn ngẫu nhiên theo phong cách quẹt thẻ tương tác.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground bg-muted/60 px-3.5 py-1 rounded-full border border-border/40">
                    <span>
                      {isLoading
                        ? "Đang tải dữ liệu món ăn..."
                        : allFoods.length > 0
                        ? `${allFoods.length} món ăn đã sẵn sàng`
                        : "Chưa có món ăn khả dụng"}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground/80 font-mono tracking-wider">
                  ← BỎ QUA • CHỐT MÓN →
                </div>
              </div>
            </motion.div>

            {/* Prominent CTA Button: Quẹt Ngay! */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col items-center gap-2"
            >
              <Button
                size="lg"
                onClick={handleStartTinder}
                disabled={isLoading || allFoods.length === 0}
                className="rounded-full px-10 py-6 text-base font-black bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-xl shadow-orange-500/25 hover:shadow-orange-500/35 transition-all duration-300 transform hover:scale-103 active:scale-98 cursor-pointer gap-2.5"
              >
                <FontAwesomeIcon icon={faFire} className="text-yellow-200 text-lg animate-pulse" />
                <span>{isLoading ? "Đang Tải Món..." : "Quẹt Ngay!"}</span>
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="swiping-view"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="w-full py-2"
          >
            <TinderCardStack
              key={deck.map((d) => d.id).join("-")}
              foods={deck}
              onOpenFilters={() => setMode("ready")}
              onRestartAll={handleRestart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
