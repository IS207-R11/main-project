"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import type { TimePeriod, MealSession } from "@/types/food";

export type ThemeMode = "system" | "light" | "dark";
export type ColorTheme = "light" | "dark";

interface TimeThemeContextType {
  currentTime: string;
  currentDate: string;
  period: TimePeriod;
  themeMode: ThemeMode;
  colorTheme: ColorTheme;
  setThemeMode: (mode: ThemeMode) => void;
  recommendedSession: MealSession;
  isMounted: boolean;
}

const THEME_STORAGE_KEY = "an_gi_theme_mode";

const TimeThemeContext = createContext<TimeThemeContextType | undefined>(undefined);

export const TimeThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [systemIsDark, setSystemIsDark] = useState<boolean>(false);
  const [dateObj, setDateObj] = useState<Date>(() => new Date());
  const [isMounted, setIsMounted] = useState(false);

  // Initialize theme mode and system preference on client mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (stored === "system" || stored === "light" || stored === "dark") {
        setThemeModeState(stored);
      }
    } catch (e) {
      console.warn("Failed to read theme mode from localStorage", e);
    }

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemIsDark(mql.matches);

    const handleSystemChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mql.addEventListener("change", handleSystemChange);
    return () => mql.removeEventListener("change", handleSystemChange);
  }, []);

  // Update clock periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setDateObj(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Resolved active color theme
  const colorTheme: ColorTheme = useMemo(() => {
    if (themeMode === "light") return "light";
    if (themeMode === "dark") return "dark";
    return systemIsDark ? "dark" : "light";
  }, [themeMode, systemIsDark]);

  // Backward compatibility: morning/night mapped to light/dark
  const activePeriod: TimePeriod = colorTheme === "dark" ? "night" : "morning";

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn("Failed to save theme mode to localStorage", e);
    }
  }, []);

  // Sync HTML root attributes and classes
  useEffect(() => {
    const root = document.documentElement;
    const isDark = colorTheme === "dark";
    root.setAttribute("data-theme", colorTheme);
    root.setAttribute("data-time-theme", isDark ? "night" : "morning");
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [colorTheme]);

  const currentTime = useMemo(() => {
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }, [dateObj]);

  const currentDate = useMemo(() => {
    return dateObj.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "numeric",
    });
  }, [dateObj]);

  const realHour = dateObj.getHours();
  const recommendedSession = useMemo((): MealSession => {
    if (realHour >= 5 && realHour < 11) return "Sáng sớm";
    if (realHour >= 11 && realHour < 14) return "Giữa trưa";
    if (realHour >= 14 && realHour < 18) return "Chiều";
    return "Tối";
  }, [realHour]);

  const value = useMemo(
    () => ({
      currentTime,
      currentDate,
      period: activePeriod,
      themeMode,
      colorTheme,
      setThemeMode,
      recommendedSession,
      isMounted,
    }),
    [currentTime, currentDate, activePeriod, themeMode, colorTheme, setThemeMode, recommendedSession, isMounted]
  );

  return <TimeThemeContext.Provider value={value}>{children}</TimeThemeContext.Provider>;
};

export const useTimeTheme = () => {
  const context = useContext(TimeThemeContext);
  if (!context) {
    throw new Error("useTimeTheme must be used within a TimeThemeProvider");
  }
  return context;
};
