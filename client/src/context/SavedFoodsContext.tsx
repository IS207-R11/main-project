'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { FoodItem } from '@/types/food';
import { useAuth } from './AuthContext';
import { foodsApi } from '@/api';
import { mapFoodCardToFoodItem } from '@/lib/foodAdapter';

interface SavedFoodsContextType {
  savedFoods: FoodItem[];
  saveFood: (food: FoodItem) => Promise<void>;
  removeFood: (id: number | string) => Promise<void>;
  toggleSaveFood: (food: FoodItem) => Promise<boolean>;
  isSaved: (id: number | string) => boolean;
  saveMultiple: (foods: FoodItem[]) => Promise<void>;
  clearSaved: () => void;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalCost: number;
}

const STORAGE_KEY = 'an_gi_saved_meals_v1';

const SavedFoodsContext = createContext<SavedFoodsContextType | undefined>(undefined);

export const SavedFoodsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [savedFoods, setSavedFoods] = useState<FoodItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync favorites from API if authenticated, else from localStorage
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (isAuthenticated && user?.user_id) {
        try {
          const res = await foodsApi.getFavorites(user.user_id, { pageSize: 50 });
          if (isMounted && res.data) {
            const apiItems = res.data.map(mapFoodCardToFoodItem);
            setSavedFoods(apiItems);
            setIsInitialized(true);
            return;
          }
        } catch (err) {
          console.warn('Could not fetch server favorites, fallback to local:', err);
        }
      }

      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && isMounted) {
            setSavedFoods(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load saved foods from localStorage', e);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.user_id]);

  // Persist to localStorage for offline cache
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFoods));
    } catch (e) {
      console.error('Failed to save foods to localStorage', e);
    }
  }, [savedFoods, isInitialized]);

  const isSaved = useCallback(
    (id: number | string) =>
      savedFoods.some((item) => item.id === Number(id) || String(item.id) === String(id)),
    [savedFoods]
  );

  const saveFood = useCallback(
    async (food: FoodItem) => {
      setSavedFoods((prev) => {
        if (prev.some((item) => item.id === food.id)) return prev;
        return [food, ...prev];
      });

      if (isAuthenticated && user?.user_id) {
        try {
          await foodsApi.addFavorite({ food_id: food.id });
        } catch (err) {
          console.error('Failed to sync favorite to server:', err);
        }
      }
    },
    [isAuthenticated, user?.user_id]
  );

  const removeFood = useCallback(
    async (id: number | string) => {
      const numId = Number(id);
      setSavedFoods((prev) =>
        prev.filter((item) => item.id !== numId && String(item.id) !== String(id))
      );

      if (isAuthenticated && user?.user_id) {
        try {
          await foodsApi.removeFavorite(numId);
        } catch (err) {
          console.error('Failed to remove favorite from server:', err);
        }
      }
    },
    [isAuthenticated, user?.user_id]
  );

  const toggleSaveFood = useCallback(
    async (food: FoodItem): Promise<boolean> => {
      const exists = isSaved(food.id);
      if (exists) {
        await removeFood(food.id);
        return false;
      } else {
        await saveFood(food);
        return true;
      }
    },
    [isSaved, removeFood, saveFood]
  );

  const saveMultiple = useCallback(
    async (foods: FoodItem[]) => {
      setSavedFoods((prev) => {
        const map = new Map<number | string, FoodItem>();
        foods.forEach((f) => map.set(f.id, f));
        prev.forEach((f) => {
          if (!map.has(f.id)) map.set(f.id, f);
        });
        return Array.from(map.values());
      });

      if (isAuthenticated && user?.user_id) {
        for (const food of foods) {
          try {
            await foodsApi.addFavorite({ food_id: food.id });
          } catch {
            // continue
          }
        }
      }
    },
    [isAuthenticated, user?.user_id]
  );

  const clearSaved = useCallback(() => {
    setSavedFoods([]);
  }, []);

  const totals = useMemo(() => {
    return savedFoods.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.macros?.calories || 0),
        protein: acc.protein + (item.macros?.protein || 0),
        carbs: acc.carbs + (item.macros?.carbs || 0),
        fat: acc.fat + (item.macros?.fat || 0),
        cost: acc.cost + (item.price || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 }
    );
  }, [savedFoods]);

  const value = useMemo(
    () => ({
      savedFoods,
      saveFood,
      removeFood,
      toggleSaveFood,
      isSaved,
      saveMultiple,
      clearSaved,
      totalCalories: Math.round(totals.calories),
      totalProtein: Math.round(totals.protein * 10) / 10,
      totalCarbs: Math.round(totals.carbs * 10) / 10,
      totalFat: Math.round(totals.fat * 10) / 10,
      totalCost: totals.cost,
    }),
    [savedFoods, saveFood, removeFood, toggleSaveFood, isSaved, saveMultiple, clearSaved, totals]
  );

  return <SavedFoodsContext.Provider value={value}>{children}</SavedFoodsContext.Provider>;
};

export const useSavedFoods = () => {
  const context = useContext(SavedFoodsContext);
  if (!context) {
    throw new Error('useSavedFoods must be used within a SavedFoodsProvider');
  }
  return context;
};
