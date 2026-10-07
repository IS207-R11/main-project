"use client";

import React, { useState, useEffect, memo, useCallback } from "react";
import { toast } from "react-toastify";
import { Image } from "@/components/ui/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faHeart,
  faThumbsDown,
  faUtensils,
  faRotate,
  faPlus,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import type { FoodItem } from "@/types/food";
import { Badge } from "@/components/ui/badge";
import { foodsApi } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { FoodCardBack } from "./FoodCardBack";
import { getCardRarityStyle } from "./rarityStyles";

export interface FoodFlashCardProps {
  food: FoodItem;
  className?: string;
  autoFlipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
}

const FoodFlashCardComponent: React.FC<FoodFlashCardProps> = ({
  food,
  className = "",
  autoFlipped = false,
  onFlipChange,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(Boolean(autoFlipped));

  // Sync autoFlipped if changed externally
  useEffect(() => {
    setIsFlipped(Boolean(autoFlipped));
  }, [autoFlipped]);

  // States for the 3 actions and their counts
  const [isFavorited, setIsFavorited] = useState<boolean>(!!food.is_favorited);
  const [isHated, setIsHated] = useState<boolean>(!!food.is_hated);
  const [isEaten, setIsEaten] = useState<boolean>(!!food.is_eaten);

  const [favoritesCount, setFavoritesCount] = useState<number>(food.favorites_count ?? 0);
  const [hatedCount, setHatedCount] = useState<number>(food.hated_count ?? 0);
  const [eatenCount, setEatenCount] = useState<number>(food.eaten_count ?? 0);

  const foodId = food.food_id || food.id;

  useEffect(() => {
    setIsFavorited(!!food.is_favorited);
    setFavoritesCount(food.favorites_count ?? 0);
  }, [food.is_favorited, food.favorites_count]);

  useEffect(() => {
    setIsHated(!!food.is_hated);
    setHatedCount(food.hated_count ?? 0);
  }, [food.is_hated, food.hated_count]);

  useEffect(() => {
    setIsEaten(!!food.is_eaten);
    setEatenCount(food.eaten_count ?? 0);
  }, [food.is_eaten, food.eaten_count]);

  const rarityStyle = getCardRarityStyle(food.rarity);

  // Image src path fallback
  const imageSrc =
    imgError || !food.imagePath ? "/logos/main-logo.png" : food.imagePath;

  // Toggle card flip
  const handleToggleFlip = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }
      setIsFlipped((prev) => {
        const next = !prev;
        onFlipChange?.(next);
        return next;
      });
    },
    [onFlipChange]
  );

  // 1. Handle Favorite Toggle
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    const prevFavorited = isFavorited;
    const prevHated = isHated;
    const prevFavCount = favoritesCount;
    const prevHatedCount = hatedCount;

    // Optimistic update: favorite toggles, and turning favorite ON automatically turns hated OFF
    const nextFavorited = !prevFavorited;
    setIsFavorited(nextFavorited);
    setFavoritesCount((prev) => Math.max(0, prev + (nextFavorited ? 1 : -1)));

    if (nextFavorited && prevHated) {
      setIsHated(false);
      setHatedCount((prev) => Math.max(0, prev - 1));
    }

    try {
      if (nextFavorited) {
        await foodsApi.addFavorite({ food_id: foodId });
        if (prevHated) {
          await foodsApi.removeHated(foodId).catch(() => {});
        }
      } else {
        await foodsApi.removeFavorite(foodId);
      }
    } catch (err: unknown) {
      // Rollback on failure
      setIsFavorited(prevFavorited);
      setIsHated(prevHated);
      setFavoritesCount(prevFavCount);
      setHatedCount(prevHatedCount);
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể cập nhật danh sách yêu thích";
      toast.error(message);
    }
  };

  // 2. Handle Hated Toggle
  const handleToggleHated = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    const prevFavorited = isFavorited;
    const prevHated = isHated;
    const prevFavCount = favoritesCount;
    const prevHatedCount = hatedCount;

    // Optimistic update: hated toggles, and turning hated ON automatically turns favorite OFF
    const nextHated = !prevHated;
    setIsHated(nextHated);
    setHatedCount((prev) => Math.max(0, prev + (nextHated ? 1 : -1)));

    if (nextHated && prevFavorited) {
      setIsFavorited(false);
      setFavoritesCount((prev) => Math.max(0, prev - 1));
    }

    try {
      if (nextHated) {
        await foodsApi.addHated({ food_id: foodId });
        if (prevFavorited) {
          await foodsApi.removeFavorite(foodId).catch(() => {});
        }
      } else {
        await foodsApi.removeHated(foodId);
      }
    } catch (err: unknown) {
      // Rollback on failure
      setIsFavorited(prevFavorited);
      setIsHated(prevHated);
      setFavoritesCount(prevFavCount);
      setHatedCount(prevHatedCount);
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể cập nhật danh sách không thích";
      toast.error(message);
    }
  };

  // 3. Handle Eaten Action (Always records a new eaten entry)
  const handleRecordEaten = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    const prevEaten = isEaten;
    const prevEatenCount = eatenCount;

    // Optimistic update: always add 1 to eaten count
    setIsEaten(true);
    setEatenCount((prev) => prev + 1);

    try {
      await foodsApi.recordEaten({ food_id: foodId });
    } catch (err: unknown) {
      // Rollback on failure
      setIsEaten(prevEaten);
      setEatenCount(prevEatenCount);
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể ghi nhận món đã ăn";
      toast.error(message);
    }
  };

  // 4. Handle Remove Most Recent Eaten Action
  const handleRemoveNearlyEaten = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    if (eatenCount <= 0) {
      toast.info("Chưa có lượt ăn nào của món này để bỏ");
      return;
    }

    const prevEaten = isEaten;
    const prevEatenCount = eatenCount;

    // Optimistic update: decrease count by 1
    const nextCount = Math.max(0, prevEatenCount - 1);
    setEatenCount(nextCount);
    if (nextCount === 0) {
      setIsEaten(false);
    }

    try {
      await foodsApi.deleteNearlyEaten(foodId);
    } catch (err: unknown) {
      // Rollback on failure
      setIsEaten(prevEaten);
      setEatenCount(prevEatenCount);
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Không thể bỏ lần ăn gần nhất";
      toast.error(message);
    }
  };


  return (
    <div
      className={`w-[235px] sm:w-[255px] h-[345px] sm:h-[360px] select-none group shrink-0 perspective-1000 ${className}`}
    >
      <div
        className={`relative w-full h-full duration-500 preserve-3d transition-transform ease-out rounded-3xl transform-gpu ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* ================= FRONT SIDE ================= */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden rounded-3xl border ${rarityStyle.border} ${rarityStyle.glow} bg-card text-card-foreground flex flex-col overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1 ${
            isFlipped ? "pointer-events-none" : "pointer-events-auto"
          }`}
        >
          {/* Dish Image Container */}
          <div className="relative h-[145px] sm:h-[160px] w-full overflow-hidden bg-muted/80 shrink-0">
            <Image
              src={imageSrc}
              alt={food.name}
              fill
              unoptimized
              draggable={false}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108 select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

            {/* Top Badges Over Image */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5">
                <Badge
                  className={`px-2.5 py-0.5 text-[9.5px] font-black rounded-full uppercase tracking-wider shadow-sm ${rarityStyle.badge}`}
                >
                  {food.rarity}
                </Badge>
                {food.status === "PENDING" && (
                  <Badge className="bg-amber-500/90 text-white text-[9.5px] px-2 py-0.5 rounded-full shadow-sm">
                    Chờ duyệt
                  </Badge>
                )}
                {food.status === "DISABLED" && (
                  <Badge className="bg-destructive/90 text-white text-[9.5px] px-2 py-0.5 rounded-full shadow-sm">
                    Đang ngưng
                  </Badge>
                )}
              </div>

              {/* Status pill on image if marked + Quick Flip Button */}
              <div className="flex items-center gap-1.5">
                {isFavorited && (
                  <span className="h-5.5 w-5.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10.5px] shadow-sm animate-in fade-in zoom-in duration-200">
                    <FontAwesomeIcon icon={faHeart} />
                  </span>
                )}
                {isHated && (
                  <span className="h-5.5 w-5.5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10.5px] shadow-sm animate-in fade-in zoom-in duration-200">
                    <FontAwesomeIcon icon={faThumbsDown} />
                  </span>
                )}
                {isEaten && (
                  <span className="h-5.5 w-5.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10.5px] shadow-sm animate-in fade-in zoom-in duration-200">
                    <FontAwesomeIcon icon={faUtensils} />
                  </span>
                )}

                {/* Flip Button */}
                <button
                  type="button"
                  onClick={handleToggleFlip}
                  className="h-6 w-6 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white flex items-center justify-center text-[11px] backdrop-blur-xs transition-colors shadow-sm cursor-pointer"
                  title="Lật thẻ"
                >
                  <FontAwesomeIcon icon={faRotate} className="text-[10px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between gap-2 relative">
            <div className="space-y-1">
              <h3 className="text-[14.5px] sm:text-[15.5px] font-bold text-foreground leading-tight truncate group-hover:text-secondary transition-colors">
                {food.name}
              </h3>

              <p className="text-[11.5px] sm:text-xs text-muted-foreground text-justify leading-relaxed line-clamp-2">
                {food.description || "Món ngon hấp dẫn từ cộng đồng ẩm thực AnGi."}
              </p>
            </div>

            {/* Real Status / Engagement Row with mini Maps & YouTube shortcuts */}
            <div className="flex items-center justify-between text-[10px] py-1.5 px-2.5 bg-muted/60 rounded-xl border border-border/50 font-medium">
              <span className="text-muted-foreground flex items-center gap-1">
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="text-secondary text-[9px]"
                />
                <span>
                  {food.status === "ACTIVE"
                    ? "Đã duyệt"
                    : food.status === "PENDING"
                    ? "Chờ duyệt"
                    : "Đang ngưng"}
                </span>
              </span>

              <div className="flex items-center gap-1.5">
                {/* Compact Google Maps shortcut */}
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(
                    `Quán ${food.name}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="size-5.5 rounded-md bg-background hover:bg-muted border border-border/70 hover:border-emerald-500/60 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                  title={`Tìm quán ${food.name} trên Google Maps`}
                >
                  <Image
                    src="other-images/googlemaps.webp"
                    alt="Maps"
                    className="size-3.5 object-contain"
                  />
                </a>

                {/* Compact YouTube recipe shortcut */}
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    `Công thức làm ${food.name}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="size-5.5 rounded-md bg-background hover:bg-muted border border-border/70 hover:border-red-500/60 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                  title={`Xem công thức nấu ${food.name} trên YouTube`}
                >
                  <Image
                    src="other-images/youtube.webp"
                    alt="YouTube"
                    className="size-3.5 object-contain"
                  />
                </a>
              </div>
            </div>

            {/* 3 Action Buttons: Yêu thích, Ghét, Đã ăn - only icon & count */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {/* 1. Yêu thích */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`h-7.5 sm:h-8 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                  isFavorited
                    ? "bg-rose-500 text-white border-rose-500 shadow-rose-500/20 shadow-xs"
                    : "bg-background hover:bg-muted text-muted-foreground hover:text-rose-500 border-border"
                }`}
                title={isFavorited ? "Bỏ yêu thích" : "Yêu thích món này"}
              >
                <FontAwesomeIcon
                  icon={faHeart}
                  className={`text-[11px] ${
                    isFavorited ? "text-white" : "text-rose-500"
                  }`}
                />
                <span className="font-bold tabular-nums">{favoritesCount}</span>
              </button>

              {/* 2. Ghét */}
              <button
                type="button"
                onClick={handleToggleHated}
                className={`h-7.5 sm:h-8 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                  isHated
                    ? "bg-slate-700 dark:bg-slate-600 text-white border-slate-700 shadow-slate-700/20 shadow-xs"
                    : "bg-background hover:bg-muted text-muted-foreground hover:text-slate-700 dark:hover:text-slate-300 border-border"
                }`}
                title={isHated ? "Bỏ ghét" : "Ghét món này"}
              >
                <FontAwesomeIcon
                  icon={faThumbsDown}
                  className={`text-[11px] ${
                    isHated ? "text-white" : "text-muted-foreground"
                  }`}
                />
                <span className="font-bold tabular-nums">{hatedCount}</span>
              </button>

              {/* 3. Đã ăn with Hover Tooltip Action Bar */}
              <div className="relative group/eaten">
                {/* Floating Tooltip Action Bar on hover */}
                <div className="absolute bottom-full mb-2 right-0 z-40 opacity-0 invisible group-hover/eaten:opacity-100 group-hover/eaten:visible transition-all duration-200 pointer-events-none group-hover/eaten:pointer-events-auto shadow-xl rounded-xl bg-popover/95 backdrop-blur-md border border-border p-1 min-w-[145px] flex flex-col gap-0.5 text-[10.5px]">
                  {/* Action 1: Đánh dấu đã ăn */}
                  <button
                    type="button"
                    onClick={(e) => handleRecordEaten(e)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-foreground hover:bg-emerald-500/15 hover:text-emerald-600 transition-colors text-left font-bold cursor-pointer"
                    title="Đánh dấu đã ăn (+1)"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-emerald-600 text-[9.5px]" />
                    <span>Đánh dấu đã ăn</span>
                  </button>

                  {/* Action 2: Bỏ lần ăn gần nhất */}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveNearlyEaten(e)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-foreground hover:bg-rose-500/15 hover:text-rose-500 transition-colors text-left font-bold cursor-pointer"
                    title="Bỏ lần ăn gần nhất"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} className="text-rose-500 text-[9.5px]" />
                    <span>Bỏ lần ăn gần nhất</span>
                  </button>

                  {/* Arrow pointer */}
                  <div className="absolute top-full right-4 -mt-px border-4 border-transparent border-t-popover pointer-events-none" />
                </div>

                {/* Main Eaten Button */}
                <button
                  type="button"
                  onClick={handleRecordEaten}
                  className={`w-full h-7.5 sm:h-8 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                    isEaten
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20 shadow-xs"
                      : "bg-background hover:bg-muted text-muted-foreground hover:text-emerald-600 border-border"
                  }`}
                  title="Đánh dấu đã ăn"
                >
                  <FontAwesomeIcon
                    icon={faUtensils}
                    className={`text-[11px] ${
                      isEaten ? "text-white" : "text-emerald-600"
                    }`}
                  />
                  <span className="font-bold tabular-nums">{eatenCount}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BACK SIDE (COLLECTIBLE CARD BACK) ================= */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl overflow-hidden ${
            !isFlipped ? "pointer-events-none" : "pointer-events-auto"
          }`}
        >
          <FoodCardBack
            rarity={food.rarity}
            onFlip={handleToggleFlip}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};

export const FoodFlashCard = memo(FoodFlashCardComponent);
