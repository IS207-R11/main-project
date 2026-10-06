"use client";

import React, { useRef, useState, useEffect } from "react";
import Masonry from "react-layout-masonry";
import type { FoodItem } from "@/types/food";
import { FoodFlashCard } from "@/components/food/FoodFlashCard";

interface VirtualMasonryCardProps {
  food: FoodItem;
}

const CARD_HEIGHT = 315;

const VirtualMasonryCard: React.FC<VirtualMasonryCardProps> = ({ food }) => {
  const [isVisible, setIsVisible] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Virtualize: render card content when within 700px of viewport
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: "700px 0px 700px 0px",
        threshold: 0,
      }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="flex justify-center w-full"
      style={{
        minHeight: `${CARD_HEIGHT}px`,
        contentVisibility: "auto",
        containIntrinsicSize: `225px ${CARD_HEIGHT}px`,
      }}
    >
      {isVisible ? (
        <FoodFlashCard food={food} />
      ) : (
        <div
          className="w-[210px] sm:w-[225px] rounded-2xl bg-muted/20 border border-border/30 animate-pulse"
          style={{ height: `${CARD_HEIGHT}px` }}
        />
      )}
    </div>
  );
};

export interface VirtualMasonryGridProps {
  foods: FoodItem[];
  className?: string;
}

export const VirtualMasonryGrid: React.FC<VirtualMasonryGridProps> = ({
  foods,
  className = "",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-items-center ${className}`}
      >
        {foods.slice(0, 10).map((food) => (
          <div key={food.id} className="flex justify-center w-full">
            <FoodFlashCard food={food} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <Masonry
        columns={{
          0: 1,
          480: 2,
          768: 3,
          1024: 4,
          1280: 5,
        }}
        gap={16}
      >
        {foods.map((food) => (
          <VirtualMasonryCard key={food.id} food={food} />
        ))}
      </Masonry>
    </div>
  );
};
