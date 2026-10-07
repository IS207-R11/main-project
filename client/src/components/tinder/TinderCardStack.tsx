"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faArrowLeft,
  faVolumeHigh,
  faVolumeXmark,
  faKeyboard,
  faRotateRight,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { FoodItem } from "@/types/food";
import { TinderCard, type TinderCardHandle } from "@/components/tinder/TinderCard";
import { TinderControls } from "@/components/tinder/TinderControls";
import { TinderMatchModal } from "@/components/tinder/TinderMatchModal";
import { tinderSounds } from "@/lib/tinderSound";
import { Button } from "@/components/ui/button";

interface TinderCardStackProps {
  foods: FoodItem[];
  onOpenFilters: () => void;
  onRestartAll: () => void;
}

export const TinderCardStack: React.FC<TinderCardStackProps> = ({
  foods,
  onOpenFilters,
  onRestartAll,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ food: FoodItem; action: "left" | "right" | "up" }[]>([]);
  const [matchedFood, setMatchedFood] = useState<FoodItem | null>(null);
  const [isSuperMatch, setIsSuperMatch] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);

  // Top card ref for programmatic swipe animation and flip
  const topCardRef = useRef<TinderCardHandle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSwipingRef = useRef(false);

  const currentFood = foods[currentIndex] || null;
  const isDeckFinished = currentIndex >= foods.length;

  // Toggle sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    tinderSounds.enabled = next;
  };

  // Main swipe action handler (called when card fly-away animation finishes)
  const handleSwipe = useCallback(
    (direction: "left" | "right" | "up", food: FoodItem) => {
      isSwipingRef.current = false;

      // 1. Right swipe (Like) or Up (Super Like) -> CHỐT NGAY LẬP TỨC
      if (direction === "right" || direction === "up") {
        setHistory((prev) => [...prev, { food, action: direction }]);
        setMatchedFood(food);
        setIsSuperMatch(direction === "up");
        setIsModalOpen(true);
        return;
      }

      // 2. Left swipe (Nope) -> Loại món và chuyển sang món tiếp theo
      setHistory((prev) => [...prev, { food, action: "left" }]);
      setCurrentIndex((prev) => prev + 1);
    },
    []
  );

  // Controls button actions & Keyboard triggers (with smooth fly-away animation)
  const handleLike = useCallback(async () => {
    if (!currentFood || isSwipingRef.current) return;
    isSwipingRef.current = true;
    tinderSounds.triggerHaptic("medium");
    tinderSounds.playLike();

    if (topCardRef.current) {
      await topCardRef.current.swipe("right");
    } else {
      handleSwipe("right", currentFood);
    }
  }, [currentFood, handleSwipe]);

  const handleNope = useCallback(async () => {
    if (!currentFood || isSwipingRef.current) return;
    isSwipingRef.current = true;
    tinderSounds.triggerHaptic("light");
    tinderSounds.playNope();

    if (topCardRef.current) {
      await topCardRef.current.swipe("left");
    } else {
      handleSwipe("left", currentFood);
    }
  }, [currentFood, handleSwipe]);

  const handleSuperLike = useCallback(async () => {
    if (!currentFood || isSwipingRef.current) return;
    isSwipingRef.current = true;
    tinderSounds.triggerHaptic("heavy");
    tinderSounds.playSuperLike();

    if (topCardRef.current) {
      await topCardRef.current.swipe("up");
    } else {
      handleSwipe("up", currentFood);
    }
  }, [currentFood, handleSwipe]);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || currentIndex === 0 || isSwipingRef.current) return;
    tinderSounds.triggerHaptic("light");
    tinderSounds.playUndo();
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, [history.length, currentIndex]);

  const handleInfo = useCallback(() => {
    if (!currentFood || isSwipingRef.current) return;
    // Simulate click on flip button of the active card
    tinderSounds.playFlip();
    const flipBtn = containerRef.current?.querySelector(
      'button[title="Lật thẻ xem dinh dưỡng & nguyên liệu"]'
    ) as HTMLButtonElement | null;
    if (flipBtn) flipBtn.click();
  }, [currentFood]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (isModalOpen) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleLike();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleNope();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleSuperLike();
      } else if (e.key === "z" || e.key === "Z" || e.key === "Backspace") {
        e.preventDefault();
        handleUndo();
      } else if (e.key === " " || e.key === "i" || e.key === "I") {
        e.preventDefault();
        handleInfo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleLike, handleNope, handleSuperLike, handleUndo, handleInfo, isModalOpen]);

  // Restart after match
  const handleRestartAfterMatch = () => {
    setIsModalOpen(false);
    setMatchedFood(null);
    onRestartAll();
  };

  // Stack cards to display (top 3)
  const visibleCards = foods.slice(currentIndex, currentIndex + 3);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-between w-full max-w-lg mx-auto min-h-[580px] sm:min-h-[640px] px-2"
    >
      {/* ================= TOP TINDER HEADER & STATUS BAR ================= */}
      <div className="w-full flex items-center justify-between px-2 sm:px-4 py-2 text-xs font-bold">
        {/* Brand / Mode Indicator */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-xs">
            <FontAwesomeIcon icon={faFire} className="text-xs" />
          </div>
          <span className="font-extrabold tracking-tight text-foreground text-sm">
            Tinder Ẩm Thực
          </span>
        </div>

        {/* Progress Badge */}
        {!isDeckFinished && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/80 border border-border/60 text-muted-foreground text-[11px] font-semibold">
            <span>Món</span>
            <strong className="text-foreground">{currentIndex + 1}</strong>
            <span>/</span>
            <span>{foods.length}</span>
          </div>
        )}

        {/* Action Controls (Sound & Filters) */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleToggleSound}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
            title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            <FontAwesomeIcon
              icon={soundEnabled ? faVolumeHigh : faVolumeXmark}
              className="text-xs"
            />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowKeyboardHint(!showKeyboardHint)}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hidden sm:flex cursor-pointer"
            title="Xem phím tắt bàn phím"
          >
            <FontAwesomeIcon icon={faKeyboard} className="text-xs" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenFilters}
            className="h-8 rounded-full text-xs font-bold gap-1.5 border-border bg-card hover:bg-muted text-foreground cursor-pointer"
            title="Quay lại màn hình chính"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-[11px] text-secondary" />
            <span className="hidden sm:inline">Quay lại</span>
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint Bar (Desktop) */}
      <AnimatePresence>
        {showKeyboardHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full px-4 py-2 mb-2 bg-muted/70 rounded-2xl border border-border/60 text-[11px] text-muted-foreground flex items-center justify-between overflow-hidden"
          >
            <span>
              Phím tắt: <strong>←</strong> Bỏ qua | <strong>→</strong> Chốt ngay | <strong>↑</strong> Siêu thích | <strong>Z</strong> Hoàn tác | <strong>Space</strong> Lật thẻ
            </span>
            <button
              onClick={() => setShowKeyboardHint(false)}
              className="font-bold text-foreground hover:underline ml-2"
            >
              Đóng
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= CARD STACK CONTAINER ================= */}
      <div className="relative w-full h-[550px] sm:h-[595px] flex items-center justify-center">
        {!isDeckFinished ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Render cards from bottom to top so top card is on top */}
            {visibleCards
              .map((food, i) => {
                const stackIndex = i;
                const isFront = stackIndex === 0;

                return (
                  <TinderCard
                    key={food.id}
                    ref={isFront ? topCardRef : undefined}
                    food={food}
                    isFront={isFront}
                    stackIndex={stackIndex}
                    onSwipe={handleSwipe}
                  />
                );
              })
              .reverse()}
          </div>
        ) : (
          /* ================= DECK EMPTY STATE ================= */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-[360px] sm:max-w-[380px] p-7 rounded-3xl border border-border bg-card text-card-foreground shadow-xl text-center space-y-4 my-auto"
          >
            <div className="h-16 w-16 mx-auto rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
              <FontAwesomeIcon icon={faListCheck} className="text-2xl" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-foreground">
                Đã Duyệt Hết Các Món!
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bạn đã lướt qua tất cả {foods.length} món trong danh sách gợi ý mà chưa chọn món nào. Hãy thử quẹt lại hoặc nới lỏng bộ lọc nhé!
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <Button
                type="button"
                onClick={onRestartAll}
                className="w-full rounded-2xl text-xs font-bold py-2.5 bg-primary text-primary-foreground hover:brightness-105 shadow-md gap-2 cursor-pointer"
              >
                <FontAwesomeIcon icon={faRotateRight} />
                <span>Quẹt Lại Từ Đầu</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onOpenFilters}
                className="w-full rounded-2xl text-xs font-bold py-2.5 border-border bg-card hover:bg-muted text-foreground gap-2 cursor-pointer"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-secondary" />
                <span>Quay Lại</span>
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ================= BOTTOM TINDER BUTTONS ================= */}
      {!isDeckFinished && (
        <TinderControls
          canUndo={history.length > 0 && currentIndex > 0}
          onUndo={handleUndo}
          onNope={handleNope}
          onSuperLike={handleSuperLike}
          onLike={handleLike}
          onInfo={handleInfo}
          disabled={!currentFood}
        />
      )}

      {/* ================= MATCH MODAL OVERLAY ================= */}
      <TinderMatchModal
        food={matchedFood}
        isSuperMatch={isSuperMatch}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRestart={handleRestartAfterMatch}
        onChangeFilter={() => {
          setIsModalOpen(false);
          onOpenFilters();
        }}
      />
    </div>
  );
};
