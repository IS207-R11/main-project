"use client";

import React from "react";
import type { FoodItem } from "@/types/food";
import { FoodFlashCard } from "@/components/food/FoodFlashCard";

interface VirtualGridCardProps {
  food: FoodItem;
  cardRef?: React.Ref<HTMLDivElement>;
}

const CARD_HEIGHT = 360;

/**
 * High-performance virtualized card container.
 * Uses native CSS content-visibility and contain-intrinsic-size for 0-JS CPU overhead off-screen culling.
 * Keeps React component instances intact to eliminate DOM thrashing, garbage collection, and image reloads during scroll.
 */
const VirtualGridCard = React.memo<VirtualGridCardProps>(({ food, cardRef }) => {
  return (
    <div
      ref={cardRef}
      className="flex justify-center w-full min-h-[345px] sm:min-h-[360px]"
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: `260px ${CARD_HEIGHT}px`,
      }}
    >
      <FoodFlashCard food={food} />
    </div>
  );
});

VirtualGridCard.displayName = "VirtualGridCard";

export interface VirtualMasonryGridProps {
  foods: FoodItem[];
  className?: string;
  sentinelRef?: React.Ref<HTMLDivElement>;
  sentinelIndex?: number;
}

/**
 * Responsive Food Cards Grid with hardware-accelerated CSS Grid layout.
 * Eliminates JavaScript layout churn and window-based column mismatches.
 * Responsiveness:
 *  - Mobile (<640px): 1 column (centered)
 *  - Small Tablet (640px - 879px): 2 columns
 *  - Tablet / Laptop (880px - 1199px): 3 columns
 *  - Desktop / Widescreen (>=1200px): 4 columns (perfect 1:1 match with container max-w-6xl)
 */
export const VirtualMasonryGrid: React.FC<VirtualMasonryGridProps> = React.memo(
  ({ foods, className = "", sentinelRef, sentinelIndex }) => {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 justify-items-center w-full ${className}`}
      >
        {foods.map((food, index) => (
          <VirtualGridCard
            key={food.id}
            food={food}
            cardRef={index === sentinelIndex ? sentinelRef : undefined}
          />
        ))}
      </div>
    );
  }
);

VirtualMasonryGrid.displayName = "VirtualMasonryGrid";
