"use client";

import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faSun,
  faMoon,
  faCloudSun,
  faCloudSunRain,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import { useTimeTheme } from "@/context/TimeThemeContext";
import type { ThemeMode } from "@/context/TimeThemeContext";

const periodGreetings: Record<string, { title: string; desc: string }> = {
  morning: {
    title: "Chào Buổi Sáng Tươi Mới!",
    desc: "Khởi đầu ngày mới với bữa ăn thanh lành và nguồn năng lượng tích cực.",
  },
  midday: {
    title: "Nạp Năng Lượng Buổi Trưa!",
    desc: "Bữa trưa đủ chất giúp tái tạo năng lượng và nâng cao hiệu suất.",
  },
  afternoon: {
    title: "Thư Thái Buổi Chiều!",
    desc: "Thưởng thức món ăn nhẹ nhàng, cân bằng vị giác và tinh thần.",
  },
  night: {
    title: "Buổi Tối Ấm Cúng & Nhẹ Bụng!",
    desc: "Thực đơn dinh dưỡng dịu lành nuôi dưỡng cơ thể và cho giấc ngủ sâu.",
  },
};

const periodLabels: Record<string, string> = {
  morning: "Sáng",
  midday: "Trưa",
  afternoon: "Chiều",
  night: "Tối",
};

const periodIcons: Record<string, typeof faSun> = {
  morning: faSun,
  midday: faCloudSun,
  afternoon: faCloudSunRain,
  night: faMoon,
};

export const TimeGreetingBar: React.FC = () => {
  const { currentTime, currentDate, period, themeMode, setThemeMode } = useTimeTheme();
  const currentGreeting = periodGreetings[period] || periodGreetings.morning;
  const PeriodIcon = periodIcons[period] || faSun;

  return (
    <section className="border-b border-border/80 bg-card/75 backdrop-blur-md py-4 px-4 sm:px-6 transition-colors duration-500">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-3.5">
        {/* Current Greeting & Live Clock */}
        <div className="flex items-center gap-3.5 text-center md:text-left">
          <motion.div
            key={period}
            initial={{ scale: 0.8, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            className="h-11 w-11 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center shrink-0 border border-secondary/30 shadow-xs"
          >
            <FontAwesomeIcon icon={PeriodIcon} className="text-lg" />
          </motion.div>
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span
                suppressHydrationWarning
                className="text-xs uppercase tracking-wider text-foreground font-bold"
              >
                {currentGreeting.title}
              </span>
              <span
                suppressHydrationWarning
                className="text-[11px] text-muted-foreground font-mono bg-muted/80 px-2.5 py-0.5 rounded-full border border-border/40 inline-flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faClock} className="text-[10px] text-secondary" />
                {currentTime}
              </span>
              <span
                suppressHydrationWarning
                className="text-[11px] text-muted-foreground hidden sm:inline-flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full"
              >
                <FontAwesomeIcon icon={faCalendarDays} className="text-[9px] text-secondary" />
                {currentDate}
              </span>
            </div>
            <p
              suppressHydrationWarning
              className="text-xs text-muted-foreground font-medium mt-0.5"
            >
              {currentGreeting.desc}
            </p>
          </div>
        </div>

        {/* Quick Time Theme Selector */}
        <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-full border border-border/60">
          <button
            onClick={() => setThemeMode("auto")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              themeMode === "auto"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tự Động
          </button>
          {(["morning", "midday", "afternoon", "night"] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setThemeMode(mode)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all capitalize cursor-pointer ${
                themeMode === mode
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodLabels[mode]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
