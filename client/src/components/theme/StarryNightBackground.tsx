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
    let spawnTimer: NodeJS.Timeout | null = null;
    let twinTimer: NodeJS.Timeout | null = null;
    let isDisposed = false;

    // Shooting Star state
    interface ShootingStar {
      x: number;
      y: number;
      startX: number;
      startY: number;
      length: number;
      speed: number;
      angle: number;
      maxDistance: number;
      distanceTraveled: number;
      size: number;
      color: string;
      glowColor: string;
    }

    const shootingStars: ShootingStar[] = [];

    const createShootingStar = () => {
      if (isDisposed || !canvas) return;
      const width = canvas.width || window.innerWidth;
      const height = canvas.height || window.innerHeight;

      // Start somewhere along the top or upper-right
      const startX = Math.random() * (width * 0.85);
      const startY = Math.random() * (height * 0.35);

      // Trajectory angle: ~35 to ~48 degrees (streaking down-right)
      const angle = (35 + Math.random() * 14) * (Math.PI / 180);
      const speed = 14 + Math.random() * 10;
      const maxDistance = 450 + Math.random() * 450;
      const length = 130 + Math.random() * 120;
      const size = 1.6 + Math.random() * 1.2;

      // Celestial hues: dazzling white, slight cyan or subtle gold
      const hues = [
        { color: "#ffffff", glow: "rgba(186, 230, 253, 0.9)" }, // celestial ice blue
        { color: "#ffffff", glow: "rgba(255, 255, 255, 0.95)" }, // pure radiant white
        { color: "#fef08a", glow: "rgba(253, 224, 71, 0.8)" },  // warm starlight gold
      ];
      const selectedHue = hues[Math.floor(Math.random() * hues.length)];

      shootingStars.push({
        x: startX,
        y: startY,
        startX,
        startY,
        length,
        speed,
        angle,
        maxDistance,
        distanceTraveled: 0,
        size,
        color: selectedHue.color,
        glowColor: selectedHue.glow,
      });
    };

    // Schedule next shooting star ("lâu lâu có vài cái sao băng")
    const scheduleNextShootingStar = (initialDelay = false) => {
      if (isDisposed) return;

      // First one comes quick (1.5s), subsequent stars every 4s - 8s
      const delay = initialDelay ? 1500 : 4000 + Math.random() * 4500;

      spawnTimer = setTimeout(() => {
        if (isDisposed) return;
        createShootingStar();

        // 35% chance to spawn a "twin" meteor shortly after (300-700ms)
        if (Math.random() < 0.35) {
          twinTimer = setTimeout(() => {
            if (!isDisposed) createShootingStar();
          }, 350 + Math.random() * 450);
        }

        // Keep the cycle going
        scheduleNextShootingStar(false);
      }, delay);
    };

    const initStarback = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

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

        // Add shooting star rendering into Starback's frame loop
        starbackInstance.addToFront((ctx: CanvasRenderingContext2D) => {
          if (shootingStars.length === 0) return;

          for (let i = shootingStars.length - 1; i >= 0; i--) {
            const s = shootingStars[i];

            s.x += Math.cos(s.angle) * s.speed;
            s.y += Math.sin(s.angle) * s.speed;
            s.distanceTraveled += s.speed;

            const progress = s.distanceTraveled / s.maxDistance;

            if (progress >= 1) {
              shootingStars.splice(i, 1);
              continue;
            }

            // Opacity curve: fade in (0-15%), brilliant (15-70%), fade out (70-100%)
            let alpha = 1;
            if (progress < 0.15) {
              alpha = progress / 0.15;
            } else if (progress > 0.7) {
              alpha = (1 - progress) / 0.3;
            }
            alpha = Math.max(0, Math.min(1, alpha));

            // Tail coordinates
            const tailX = s.x - Math.cos(s.angle) * s.length;
            const tailY = s.y - Math.sin(s.angle) * s.length;

            ctx.save();

            // Draw glowing tail gradient
            const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
            grad.addColorStop(0, "rgba(255, 255, 255, 0)");
            grad.addColorStop(0.65, `rgba(224, 242, 254, ${alpha * 0.35})`);
            grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.95})`);

            ctx.beginPath();
            ctx.strokeStyle = grad;
            ctx.lineWidth = s.size;
            ctx.lineCap = "round";
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(s.x, s.y);
            ctx.stroke();

            // Draw radiant star head
            ctx.shadowColor = s.glowColor;
            ctx.shadowBlur = 10;
            ctx.fillStyle = s.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 1.1, 0, Math.PI * 2);
            ctx.fill();

            // Extra inner sparkle at head
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        });

        // Start shooting star cycle
        scheduleNextShootingStar(true);
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
      isDisposed = true;
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
      if (spawnTimer) clearTimeout(spawnTimer);
      if (twinTimer) clearTimeout(twinTimer);
      shootingStars.length = 0;
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
