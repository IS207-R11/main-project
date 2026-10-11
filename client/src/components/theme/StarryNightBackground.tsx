"use client";

import React, { useEffect, useRef } from "react";
import Starback from "starback";
import { useTimeTheme } from "@/context/TimeThemeContext";

export const StarryNightBackground: React.FC = () => {
  const { colorTheme, isMounted } = useTimeTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isMounted || colorTheme !== "dark" || process.env.NODE_ENV === "test") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let starbackInstance: any = null;

    const initStarback = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Initialize Starback with realistic twinkling star dots (like Image 1)
      try {
        starbackInstance = new Starback(canvas, {
          type: "dot",
          width,
          height,
          quantity: 130,
          direction: 100,
          speed: [0.1, 0.45],
          starColor: "#ffffff",
          starSize: [0.5, 3],
          randomOpacity: [0.25, 1],
          backgroundColor: "transparent",
        });
      } catch (err) {
        console.warn("Starback initialization:", err);
      }
    };

    initStarback();

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [colorTheme, isMounted]);

  if (!isMounted || colorTheme !== "dark") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-700 opacity-100"
    >
      {/* Subtle Moon/Nebula Glow at top */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-b from-sky-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Starback Falling Stars Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};
