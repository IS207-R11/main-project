"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimeTheme } from "@/context/TimeThemeContext";
import type { FoodItem } from "@/types/food";
import { allFoods as defaultFoods } from "@/lib/foodData";
import {
  TinderFilterBar,
  type TinderFilterState,
} from "@/components/tinder/TinderFilterBar";
import { TinderCardStack } from "@/components/tinder/TinderCardStack";

interface TinderGameProps {
  allFoods?: FoodItem[];
  initialMode?: "filter" | "swiping";
}

export const TinderGame: React.FC<TinderGameProps> = ({
  allFoods = defaultFoods,
  initialMode = "filter",
}) => {
  const { recommendedSession } = useTimeTheme();

  // Filters state
  const [filters, setFilters] = useState<TinderFilterState>({
    diet: "all",
    price: "all",
    session: "auto",
    maxDishes: 20,
  });

  // Current view mode
  const [mode, setMode] = useState<"filter" | "swiping">(initialMode);
  // Prepared deck of dishes for Tinder
  const [deck, setDeck] = useState<FoodItem[]>([]);

  // Effective meal session
  const effectiveSession =
    filters.session === "auto" ? recommendedSession : filters.session;

  // Filter candidate pool
  const candidatePool = useMemo(() => {
    return allFoods.filter((food) => {
      // Session matching
      if (
        effectiveSession !== "all" &&
        !food.sessions.includes(effectiveSession)
      ) {
        return false;
      }

      // Dietary filter
      if (filters.diet === "veg" && !food.veg) return false;
      if (filters.diet === "meat" && food.veg) return false;

      // Price filter
      if (filters.price === "under_50" && food.price >= 50) return false;
      if (
        filters.price === "50_80" &&
        (food.price < 50 || food.price > 80)
      ) {
        return false;
      }
      if (
        filters.price === "80_120" &&
        (food.price <= 80 || food.price > 120)
      ) {
        return false;
      }
      if (filters.price === "above_120" && food.price <= 120) return false;

      return true;
    });
  }, [allFoods, effectiveSession, filters.diet, filters.price]);

  // Safe fallback if pool is too small
  const safePool = useMemo(() => {
    if (candidatePool.length >= 3) return candidatePool;
    const relaxed = allFoods.filter((f) =>
      effectiveSession !== "all" ? f.sessions.includes(effectiveSession) : true
    );
    return relaxed.length >= 3 ? relaxed : allFoods;
  }, [allFoods, candidatePool, effectiveSession]);

  // Handle filter changes
  const handleFilterChange = (updated: Partial<TinderFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      diet: "all",
      price: "all",
      session: "auto",
      maxDishes: 20,
    });
  };

  // Generate randomized deck and start Tinder swiping
  const handleStartTinder = useCallback(() => {
    const pool = [...safePool];
    // Fisher-Yates shuffle algorithm
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const selectedDeck = pool.slice(0, filters.maxDishes);
    setDeck(selectedDeck);
    setMode("swiping");
  }, [safePool, filters.maxDishes]);

  // Restart Tinder with fresh shuffle
  const handleRestart = useCallback(() => {
    handleStartTinder();
  }, [handleStartTinder]);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {mode === "filter" ? (
          <motion.div
            key="filter-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full py-4"
          >
            <TinderFilterBar
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              onStartTinder={handleStartTinder}
              matchingCount={safePool.length}
              recommendedSession={recommendedSession}
            />
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
              onOpenFilters={() => setMode("filter")}
              onRestartAll={handleRestart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
