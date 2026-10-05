"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import type { TimePeriod, MealSession } from "@/types/food";
import { periodToSession } from "@/lib/foodData";

export type ThemeMode = "auto" | TimePeriod;

interface TimeThemeContextType {
  currentTime: string;
  currentDate: string;
  period: TimePeriod;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  recommendedSession: MealSession;
  isMounted: boolean;
}

const TimeThemeContext = createContext<TimeThemeContextType | undefined>(undefined);

/**
 * Determines the time period based on hour:
 * - 05:00 - 10:59: Morning (Buổi sáng)
 * - 11:00 - 13:59: Midday / Lunch (Buổi trưa)
 * - 14:00 - 17:59: Afternoon (Buổi chiều)
 * - 18:00 - 04:59: Evening / Night (Buổi tối)
 */
export function getPeriodFromHour(hour: number): TimePeriod {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 14) return "midday";
  if (hour >= 14 && hour < 18) return "afternoon";
  return "night";
}

export const TimeThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
  const [dateObj, setDateObj] = useState<Date>(() => new Date());
  const [isMounted, setIsMounted] = useState(false);

  // Mark mounted on client (NO localStorage persistence per requirements)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update clock periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setDateObj(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const realHour = dateObj.getHours();
  const autoPeriod = useMemo(() => getPeriodFromHour(realHour), [realHour]);

  const activePeriod: TimePeriod = themeMode === "auto" ? autoPeriod : themeMode;

  // Determine if current route supports full 4-theme system (/ and /tinder)
  // Other routes only use morning and night themes
  const isFourThemePage = useMemo(() => {
    return pathname === "/" || pathname === "/tinder";
  }, [pathname]);

  const effectivePeriod: TimePeriod = useMemo(() => {
    if (isFourThemePage) {
      return activePeriod;
    }
    // For other pages: only "morning" (daytime) and "night" (nighttime)
    if (themeMode !== "auto") {
      return themeMode === "morning" || themeMode === "midday" ? "morning" : "night";
    }
    return realHour >= 6 && realHour < 18 ? "morning" : "night";
  }, [isFourThemePage, activePeriod, themeMode, realHour]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    // In-memory state only - no localStorage
    setThemeModeState(mode);
  }, []);

  // Sync data-time-theme on root HTML for instant CSS styling
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-time-theme", effectivePeriod);
  }, [effectivePeriod]);

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

  const recommendedSession = useMemo(() => {
    return periodToSession(activePeriod);
  }, [activePeriod]);

  const value = useMemo(
    () => ({
      currentTime,
      currentDate,
      period: effectivePeriod,
      themeMode,
      setThemeMode,
      recommendedSession,
      isMounted,
    }),
    [currentTime, currentDate, effectivePeriod, themeMode, setThemeMode, recommendedSession, isMounted]
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
