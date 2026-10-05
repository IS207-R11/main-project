"use client";

import React, {
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
} from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faTag,
  faLeaf,
  faRotate,
  faCheck,
  faBookmark,
  faHeart,
  faXmark,
  faStar,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import type { FoodItem, Rarity } from "@/types/food";
import { formatPrice } from "@/lib/foodData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tinderSounds } from "@/lib/tinderSound";

export interface TinderCardHandle {
  swipe: (direction: "left" | "right" | "up") => Promise<void>;
}

interface TinderCardProps {
  food: FoodItem;
  isFront: boolean;
  stackIndex: number;
  onSwipe: (direction: "left" | "right" | "up", food: FoodItem) => void;
  isSaved?: boolean;
  onToggleSave?: (food: FoodItem) => void;
}

const rarityStyles: Record<
  Rarity,
  {
    badge: string;
    border: string;
    glow: string;
    text: string;
  }
> = {
  SSR: {
    badge: "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black",
    border: "border-amber-400/80 shadow-[0_8px_30px_rgba(251,191,36,0.3)]",
    glow: "ring-2 ring-amber-400/40",
    text: "text-amber-500",
  },
  SR: {
    badge: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold",
    border: "border-purple-400/80 shadow-[0_8px_25px_rgba(168,85,247,0.25)]",
    glow: "ring-2 ring-purple-400/40",
    text: "text-purple-400",
  },
  UC: {
    badge: "bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold",
    border: "border-sky-400/80 shadow-[0_8px_20px_rgba(14,165,233,0.2)]",
    glow: "ring-2 ring-sky-400/30",
    text: "text-sky-400",
  },
  C: {
    badge: "bg-secondary text-white font-semibold",
    border: "border-border shadow-lg",
    glow: "",
    text: "text-secondary",
  },
};

export const TinderCard = forwardRef<TinderCardHandle, TinderCardProps>(
  (
    {
      food,
      isFront,
      stackIndex,
      onSwipe,
      isSaved = false,
      onToggleSave,
    },
    ref
  ) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [forcedStamp, setForcedStamp] = useState<"left" | "right" | "up" | null>(null);

    const isFlyingRef = useRef(false);

    // Motion values for gesture physics
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const cardOpacity = useMotionValue(1);

    // Dynamic transforms based on drag and swipe
    const rotate = useTransform(x, [-320, 0, 320], [-22, 0, 22], { clamp: true });
    const likeOpacity = useTransform(x, [20, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-20, -100], [0, 1]);
    const superLikeOpacity = useTransform(y, [-20, -90], [0, 1]);

    const rarity = rarityStyles[food.rarity] || rarityStyles.C;
    const imageSrc = imgError
      ? "/logos/main-logo.png"
      : food.imagePath || `/data/images/${food.id}.webp`;

    const hasCalories = food.macros?.calories > 0;
    const hasPrice = food.price && food.price > 0;
    const formattedPrice = hasPrice ? formatPrice(food.price) : "";

    // Stack styling (depth & scale)
    const stackScale = Math.max(0.88, 1 - stackIndex * 0.05);
    const stackTranslateY = stackIndex * 12;
    const stackOpacity = Math.max(0.6, 1 - stackIndex * 0.2);

    // Programmatic and gesture fly-away animation
    const flyAway = useCallback(
      async (direction: "left" | "right" | "up") => {
        if (isFlyingRef.current) return;
        isFlyingRef.current = true;
        setForcedStamp(direction);

        const currentX = x.get();
        const currentY = y.get();

        const flyDistanceX = typeof window !== "undefined" ? window.innerWidth * 0.9 : 650;
        const targetX =
          direction === "right"
            ? Math.max(600, flyDistanceX)
            : direction === "left"
            ? -Math.max(600, flyDistanceX)
            : currentX;

        const targetY = direction === "up" ? -650 : currentY;

        const animX = new Promise<void>((resolve) => {
          animate(x, [currentX, targetX], {
            duration: 0.32,
            ease: [0.22, 1, 0.36, 1],
          }).then(() => resolve());
        });

        const animY = new Promise<void>((resolve) => {
          animate(y, [currentY, targetY], {
            duration: 0.32,
            ease: [0.22, 1, 0.36, 1],
          }).then(() => resolve());
        });

        const animOpacity = new Promise<void>((resolve) => {
          animate(cardOpacity, [1, 0], {
            duration: 0.28,
            delay: 0.04,
            ease: "easeOut",
          }).then(() => resolve());
        });

        await Promise.all([animX, animY, animOpacity]);
        onSwipe(direction, food);
      },
      [food, onSwipe, x, y, cardOpacity]
    );

    // Expose swipe method to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        swipe: flyAway,
      }),
      [flyAway]
    );

    // Handle Drag End with gesture thresholds
    const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (!isFront || isFlyingRef.current) return;

      const threshold = 100;
      const velocityThreshold = 350;

      // Swipe Right (Like / Chốt ngay)
      if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
        tinderSounds.triggerHaptic("medium");
        tinderSounds.playLike();
        flyAway("right");
        return;
      }

      // Swipe Left (Nope / Bỏ qua)
      if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
        tinderSounds.triggerHaptic("light");
        tinderSounds.playNope();
        flyAway("left");
        return;
      }

      // Swipe Up (Super Like)
      if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
        tinderSounds.triggerHaptic("heavy");
        tinderSounds.playSuperLike();
        flyAway("up");
        return;
      }
    };

    const toggleFlip = (e: React.MouseEvent) => {
      e.stopPropagation();
      tinderSounds.playFlip();
      setIsFlipped(!isFlipped);
    };

    const handleSaveClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onToggleSave) onToggleSave(food);
    };

    return (
      <motion.div
        style={{
          x: isFront ? x : 0,
          y: isFront ? y : 0,
          rotate: isFront ? rotate : 0,
          opacity: isFront ? cardOpacity : stackOpacity,
          scale: stackScale,
          translateY: stackTranslateY,
          zIndex: 50 - stackIndex,
        }}
        animate={{
          scale: stackScale,
          translateY: stackTranslateY,
        }}
        transition={{
          duration: 0.25,
          ease: "easeOut",
        }}
        drag={isFront && !isFlipped && !isFlyingRef.current ? true : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.85}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: "grabbing" }}
        className={`absolute inset-x-0 mx-auto w-full max-w-[360px] sm:max-w-[400px] h-[510px] sm:h-[550px] select-none touch-none transform-gpu will-change-transform ${
          isFront ? "cursor-grab" : "pointer-events-none"
        }`}
      >
        <div className="relative w-full h-full perspective-1000">
          <div
            className={`relative w-full h-full duration-500 preserve-3d transition-transform ease-out rounded-3xl transform-gpu ${
              isFlipped ? "rotate-y-180" : ""
            }`}
          >
            {/* ================= FRONT SIDE (TINDER MAIN CARD) ================= */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden rounded-3xl border-2 ${
                rarity.border
              } ${rarity.glow} bg-card text-card-foreground flex flex-col overflow-hidden shadow-2xl transition-shadow ${
                isFlipped ? "pointer-events-none" : "pointer-events-auto"
              }`}
            >
              {/* Top Stamps (LIKE / NOPE / SUPER LIKE) Overlay */}
              {isFront && (
                <>
                  {/* LIKE STAMP (Quẹt phải) */}
                  <motion.div
                    style={{
                      opacity: forcedStamp === "right" ? 1 : likeOpacity,
                    }}
                    className="absolute top-8 left-6 z-30 pointer-events-none transform -rotate-15 border-4 border-emerald-500 text-emerald-500 bg-emerald-500/15 backdrop-blur-md px-4 py-1.5 rounded-xl font-black text-2xl sm:text-3xl tracking-widest uppercase shadow-lg shadow-emerald-500/25"
                  >
                    <div className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faHeart} className="text-xl" />
                      <span>CHỐT LIỀN</span>
                    </div>
                  </motion.div>

                  {/* NOPE STAMP (Quẹt trái) */}
                  <motion.div
                    style={{
                      opacity: forcedStamp === "left" ? 1 : nopeOpacity,
                    }}
                    className="absolute top-8 right-6 z-30 pointer-events-none transform rotate-15 border-4 border-rose-500 text-rose-500 bg-rose-500/15 backdrop-blur-md px-4 py-1.5 rounded-xl font-black text-2xl sm:text-3xl tracking-widest uppercase shadow-lg shadow-rose-500/25"
                  >
                    <div className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faXmark} className="text-xl" />
                      <span>BỎ QUA</span>
                    </div>
                  </motion.div>

                  {/* SUPER LIKE STAMP (Quẹt lên) */}
                  <motion.div
                    style={{
                      opacity: forcedStamp === "up" ? 1 : superLikeOpacity,
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none border-4 border-sky-400 text-sky-400 bg-sky-500/20 backdrop-blur-md px-6 py-2 rounded-2xl font-black text-2xl sm:text-3xl tracking-widest uppercase shadow-xl shadow-sky-500/35 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faStar} className="text-amber-400 animate-spin-slow" />
                    <span>SIÊU THÍCH</span>
                  </motion.div>
                </>
              )}

              {/* Food Image with Cinematic Gradient */}
              <div className="relative h-[62%] sm:h-[64%] w-full overflow-hidden bg-muted/80 shrink-0">
                <Image
                  src={imageSrc}
                  alt={food.name}
                  fill
                  priority={isFront}
                  unoptimized
                  draggable={false}
                  sizes="(max-width: 640px) 90vw, 400px"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover transition-transform duration-700 select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-black/30 to-black/50" />

                {/* Top Floating Badges */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider shadow-md ${rarity.badge}`}
                    >
                      {food.rarity}
                    </Badge>
                    {food.veg && (
                      <Badge className="bg-emerald-600/95 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                        <FontAwesomeIcon icon={faLeaf} className="text-[9px]" />
                        <span>Ăn Chay</span>
                      </Badge>
                    )}
                    {food.sessions && food.sessions.length > 0 && (
                      <Badge className="bg-black/60 backdrop-blur-md text-white/90 border border-white/15 text-[10px] px-2 py-0.5 rounded-full">
                        {food.sessions[0]}
                      </Badge>
                    )}
                  </div>

                  {/* Bookmark / Quick Save Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveClick}
                    className={`h-8 w-8 rounded-full backdrop-blur-md transition-all shadow-md shrink-0 cursor-pointer ${
                      isSaved
                        ? "text-white bg-primary ring-2 ring-primary/40"
                        : "text-white bg-black/50 hover:bg-black/75 hover:scale-105"
                    }`}
                    title={isSaved ? "Đã lưu vào thực đơn" : "Lưu món"}
                  >
                    <FontAwesomeIcon
                      icon={isSaved ? faCheck : faBookmark}
                      className="text-xs"
                    />
                  </Button>
                </div>

                {/* Price and Calories Pill at Image Bottom */}
                <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs text-white font-bold drop-shadow-md">
                  {hasPrice ? (
                    <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/40 text-amber-300 font-extrabold flex items-center gap-1.5 shadow-md">
                      <FontAwesomeIcon icon={faTag} className="text-[10px]" />
                      {formattedPrice}
                    </span>
                  ) : (
                    <span />
                  )}

                  {hasCalories && (
                    <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white font-extrabold flex items-center gap-1.5 shadow-md">
                      <FontAwesomeIcon icon={faFire} className="text-secondary text-[11px]" />
                      <span>{food.macros.calories} kcal</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Food Info & Quick Actions (Bottom Half) */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between overflow-hidden gap-2 bg-gradient-to-b from-card to-card/95">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-foreground leading-tight tracking-tight line-clamp-1">
                      {food.name}
                    </h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleFlip}
                      className="h-7 px-2 rounded-full text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/60 gap-1 shrink-0 cursor-pointer"
                      title="Lật thẻ xem dinh dưỡng & nguyên liệu"
                    >
                      <FontAwesomeIcon icon={faRotate} className="text-[10px] text-secondary" />
                      <span>Dinh dưỡng</span>
                    </Button>
                  </div>

                  {food.sub && food.sub.trim() !== "" ? (
                    <p className="text-xs text-secondary font-semibold line-clamp-1 mt-0.5">
                      {food.sub}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {food.name_en || "Món ngon dinh dưỡng truyền thống"}
                    </p>
                  )}
                </div>

                {/* Macro Pills Row */}
                <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 bg-muted/60 rounded-2xl border border-border/50 text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-medium">Đạm</span>
                    <span className="text-xs font-black text-primary">
                      {food.macros?.protein || 0}g
                    </span>
                  </div>
                  <div className="flex flex-col border-x border-border/50">
                    <span className="text-[10px] text-muted-foreground font-medium">Carbs</span>
                    <span className="text-xs font-black text-secondary">
                      {food.macros?.carbs || 0}g
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-medium">Chất Béo</span>
                    <span className="text-xs font-black text-foreground">
                      {food.macros?.fat || 0}g
                    </span>
                  </div>
                </div>

                {/* Swipe Guidance Helper Text */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 font-medium">
                  <span className="flex items-center gap-1 text-rose-500 font-semibold">
                    <FontAwesomeIcon icon={faXmark} className="text-xs" /> Quẹt trái: Bỏ qua
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    Quẹt phải: Chốt ngay <FontAwesomeIcon icon={faHeart} className="text-xs" />
                  </span>
                </div>
              </div>
            </div>

            {/* ================= BACK SIDE (NUTRITION & INGREDIENTS) ================= */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl border-2 ${
                rarity.border
              } ${rarity.glow} bg-card text-card-foreground flex flex-col p-5 overflow-hidden shadow-2xl ${
                !isFlipped ? "pointer-events-none" : "pointer-events-auto"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-secondary flex items-center gap-1">
                    <FontAwesomeIcon icon={faUtensils} className="text-[9px]" />
                    Thông Số Dinh Dưỡng
                  </span>
                  <h3 className="text-lg font-black text-foreground line-clamp-1">
                    {food.name}
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleFlip}
                  className="h-8 rounded-full text-xs font-bold gap-1.5 border-border bg-card hover:bg-muted cursor-pointer"
                >
                  <FontAwesomeIcon icon={faRotate} className="text-xs text-secondary" />
                  <span>Quay lại</span>
                </Button>
              </div>

              {/* Nutrition Breakdown Grid */}
              <div className="my-3 space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/50 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Tổng Calo:</span>
                    <span className="font-black text-secondary">
                      {food.macros?.calories || 0} kcal
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/50 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Chất đạm:</span>
                    <span className="font-black text-primary">
                      {food.macros?.protein || 0} g
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/50 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Carbohydrate:</span>
                    <span className="font-black text-foreground">
                      {food.macros?.carbs || 0} g
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/50 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Chất béo:</span>
                    <span className="font-black text-foreground">
                      {food.macros?.fat || 0} g
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/50 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Chất xơ:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {food.macros?.fiber || 0} g
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/50 flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Natri (Sodium):</span>
                    <span className="font-black text-foreground">
                      {food.macros?.sodium || 0} mg
                    </span>
                  </div>
                </div>

                {/* Ingredients List */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Thành phần chính:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {food.ingredients && food.ingredients.length > 0 ? (
                      food.ingredients.map((ing, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-foreground/90 border border-border/40 font-medium"
                        >
                          {ing}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Đang cập nhật nguyên liệu
                      </span>
                    )}
                  </div>
                </div>

                {food.quip && (
                  <div className="p-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-xs italic text-foreground/90">
                    &ldquo;{food.quip}&rdquo;
                  </div>
                )}
              </div>

              {/* Action Bar on Back */}
              <div className="pt-2 border-t border-border/80 flex gap-2">
                <Button
                  type="button"
                  onClick={toggleFlip}
                  className="w-full rounded-2xl text-xs font-bold py-2 bg-primary text-primary-foreground hover:brightness-105 cursor-pointer"
                >
                  Tiếp Tục Quẹt Món Này
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

TinderCard.displayName = "TinderCard";
