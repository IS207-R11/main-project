"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { List, type RowComponentProps } from "react-window";
import type { FoodItem } from "@/types/food";
import { FoodFlashCard } from "@/components/food/FoodFlashCard";

interface VirtualFoodGridProps {
  foods: FoodItem[];
  maxVisibleRows?: number;
}

const CARD_WIDTH = 225;
const GAP = 16;
const ROW_HEIGHT = 306; // 290px card + 16px gap

interface RowExtraProps {
  foods: FoodItem[];
  columnCount: number;
}

const Row = ({
  index,
  style,
  foods,
  columnCount,
}: RowComponentProps<RowExtraProps>) => {
  const startIndex = index * columnCount;
  const rowFoods = foods.slice(startIndex, startIndex + columnCount);

  return (
    <div
      style={{
        ...style,
        height: `${ROW_HEIGHT - GAP}px`,
      }}
      className="flex justify-center gap-4 px-1"
    >
      {rowFoods.map((food: FoodItem) => (
        <FoodFlashCard key={food.id} food={food} />
      ))}
    </div>
  );
};

export const VirtualFoodGrid: React.FC<VirtualFoodGridProps> = ({
  foods,
  maxVisibleRows = 8,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1152);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate dynamic column count based on measured container width
  const columnCount = useMemo(() => {
    const effectiveWidth = Math.max(300, containerWidth);
    const count = Math.floor((effectiveWidth + GAP) / (CARD_WIDTH + GAP));
    return Math.max(1, Math.min(5, count));
  }, [containerWidth]);

  // Total rows
  const rowCount = Math.ceil(foods.length / columnCount);

  // Height of virtual list
  const visibleRows = Math.min(maxVisibleRows, Math.max(1, rowCount));
  const listHeight = visibleRows * ROW_HEIGHT;

  const rowProps = useMemo<RowExtraProps>(
    () => ({
      foods,
      columnCount,
    }),
    [foods, columnCount]
  );

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-6xl">
      {rowCount > 0 ? (
        <List
          rowComponent={Row}
          rowCount={rowCount}
          rowHeight={ROW_HEIGHT}
          rowProps={rowProps}
          style={{
            height: `${listHeight}px`,
            width: "100%",
          }}
          overscanCount={2}
          className="scrollbar-thin scrollbar-thumb-secondary/30 scrollbar-track-transparent rounded-2xl"
        />
      ) : null}
    </div>
  );
};
