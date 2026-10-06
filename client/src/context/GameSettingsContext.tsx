"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ExclusionType } from "@/api/types";

export interface GachaSettings {
  numberOfExcludedEaten: number;
  typeOfExcludedEaten: ExclusionType;
  excludedGachaSet: boolean;
  foodSet: number[];
}

export interface TinderSettings {
  numberOfResult: number;
  numberOfExcludedEaten: number;
  typeOfExcludedEaten: ExclusionType;
  excludedGachaSet: boolean;
  foodSet: number[];
}

export const DEFAULT_GACHA_SETTINGS: GachaSettings = {
  numberOfExcludedEaten: 0,
  typeOfExcludedEaten: "newest",
  excludedGachaSet: false,
  foodSet: [],
};

export const DEFAULT_TINDER_SETTINGS: TinderSettings = {
  numberOfResult: 15,
  numberOfExcludedEaten: 0,
  typeOfExcludedEaten: "newest",
  excludedGachaSet: false,
  foodSet: [],
};

const GACHA_KEY = "an_gi_gacha_settings_v1";
const TINDER_KEY = "an_gi_tinder_settings_v1";

interface GameSettingsContextType {
  gachaSettings: GachaSettings;
  tinderSettings: TinderSettings;
  updateGachaSettings: (partial: Partial<GachaSettings>) => void;
  updateTinderSettings: (partial: Partial<TinderSettings>) => void;
  resetGachaSettings: () => void;
  resetTinderSettings: () => void;
}

const GameSettingsContext = createContext<GameSettingsContextType | undefined>(undefined);

export const GameSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gachaSettings, setGachaSettings] = useState<GachaSettings>(DEFAULT_GACHA_SETTINGS);
  const [tinderSettings, setTinderSettings] = useState<TinderSettings>(DEFAULT_TINDER_SETTINGS);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const storedGacha = localStorage.getItem(GACHA_KEY);
      if (storedGacha) {
        const parsed = JSON.parse(storedGacha);
        setGachaSettings({
          ...DEFAULT_GACHA_SETTINGS,
          ...parsed,
          numberOfExcludedEaten: Math.max(0, Number(parsed.numberOfExcludedEaten) || 0),
          foodSet: Array.isArray(parsed.foodSet) ? parsed.foodSet : [],
        });
      }

      const storedTinder = localStorage.getItem(TINDER_KEY);
      if (storedTinder) {
        const parsed = JSON.parse(storedTinder);
        setTinderSettings({
          ...DEFAULT_TINDER_SETTINGS,
          ...parsed,
          numberOfResult: Math.max(1, Math.min(50, Number(parsed.numberOfResult) || 15)),
          numberOfExcludedEaten: Math.max(0, Number(parsed.numberOfExcludedEaten) || 0),
          foodSet: Array.isArray(parsed.foodSet) ? parsed.foodSet : [],
        });
      }
    } catch (e) {
      console.warn("Failed to read game settings from localStorage", e);
    }
  }, []);

  // Update & persist Gacha settings
  const updateGachaSettings = useCallback((partial: Partial<GachaSettings>) => {
    setGachaSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(GACHA_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to save gacha settings to localStorage", e);
      }
      return next;
    });
  }, []);

  // Update & persist Tinder settings
  const updateTinderSettings = useCallback((partial: Partial<TinderSettings>) => {
    setTinderSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(TINDER_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to save tinder settings to localStorage", e);
      }
      return next;
    });
  }, []);

  const resetGachaSettings = useCallback(() => {
    setGachaSettings(DEFAULT_GACHA_SETTINGS);
    try {
      localStorage.setItem(GACHA_KEY, JSON.stringify(DEFAULT_GACHA_SETTINGS));
    } catch (e) {
      console.warn("Failed to reset gacha settings", e);
    }
  }, []);

  const resetTinderSettings = useCallback(() => {
    setTinderSettings(DEFAULT_TINDER_SETTINGS);
    try {
      localStorage.setItem(TINDER_KEY, JSON.stringify(DEFAULT_TINDER_SETTINGS));
    } catch (e) {
      console.warn("Failed to reset tinder settings", e);
    }
  }, []);

  return (
    <GameSettingsContext.Provider
      value={{
        gachaSettings,
        tinderSettings,
        updateGachaSettings,
        updateTinderSettings,
        resetGachaSettings,
        resetTinderSettings,
      }}
    >
      {children}
    </GameSettingsContext.Provider>
  );
};

export const useGameSettings = () => {
  const context = useContext(GameSettingsContext);
  if (!context) {
    throw new Error("useGameSettings must be used within a GameSettingsProvider");
  }
  return context;
};
