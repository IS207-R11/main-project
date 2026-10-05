"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faFire,
  faUtensils,
  faClock,
  faTag,
  faLeaf,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import type {
  DietaryFilter,
  PriceFilter,
  SessionFilter,
  MealSession,
} from "@/types/food";
import { Button } from "@/components/ui/button";

export interface TinderFilterState {
  diet: DietaryFilter;
  price: PriceFilter;
  session: SessionFilter;
  maxDishes: number;
}

interface TinderFilterBarProps {
  filters: TinderFilterState;
  onChange: (updated: Partial<TinderFilterState>) => void;
  onReset: () => void;
  onStartTinder: () => void;
  matchingCount: number;
  recommendedSession: MealSession;
}

export const TinderFilterBar: React.FC<TinderFilterBarProps> = ({
  filters,
  onChange,
  onReset,
  onStartTinder,
  matchingCount,
  recommendedSession,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-5 sm:p-6 rounded-3xl bg-card text-card-foreground border border-border shadow-lg backdrop-blur-md space-y-5">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
            <FontAwesomeIcon icon={faFilter} className="text-sm" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">
              Bộ Lọc Tinder Ẩm Thực
            </h3>
            <p className="text-xs text-muted-foreground">
              Tùy chỉnh khẩu vị, ngân sách và khung giờ để tạo danh sách món
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted/80 text-foreground border border-border/60">
            Khả dụng: <strong className="text-primary font-bold">{matchingCount}</strong> món
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 cursor-pointer"
            title="Đặt lại bộ lọc"
          >
            <FontAwesomeIcon icon={faRotateRight} className="text-[10px]" />
            <span>Mặc định</span>
          </Button>
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Meal Session */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <FontAwesomeIcon icon={faClock} className="text-secondary text-[11px]" />
            <span>Khung giờ ăn</span>
          </label>
          <select
            value={filters.session}
            onChange={(e) => onChange({ session: e.target.value as SessionFilter })}
            className="w-full bg-background border border-border text-foreground text-xs font-semibold rounded-2xl p-2.5 focus:ring-2 focus:ring-primary focus:outline-hidden shadow-xs cursor-pointer"
          >
            <option value="auto">Tự Động ({recommendedSession})</option>
            <option value="Sáng sớm">Sáng sớm</option>
            <option value="Giữa trưa">Giữa trưa</option>
            <option value="Chiều">Chiều</option>
            <option value="Tối">Tối</option>
            <option value="all">Tất Cả Khung Giờ</option>
          </select>
        </div>

        {/* 2. Dietary */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <FontAwesomeIcon icon={faLeaf} className="text-emerald-500 text-[11px]" />
            <span>Chế độ ăn</span>
          </label>
          <select
            value={filters.diet}
            onChange={(e) => onChange({ diet: e.target.value as DietaryFilter })}
            className="w-full bg-background border border-border text-foreground text-xs font-semibold rounded-2xl p-2.5 focus:ring-2 focus:ring-primary focus:outline-hidden shadow-xs cursor-pointer"
          >
            <option value="all">Tất Cả Chế Độ (Chay & Mặn)</option>
            <option value="veg">🌱 Chỉ Món Chay</option>
            <option value="meat">🍖 Chỉ Món Mặn</option>
          </select>
        </div>

        {/* 3. Price Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <FontAwesomeIcon icon={faTag} className="text-amber-500 text-[11px]" />
            <span>Khoảng giá</span>
          </label>
          <select
            value={filters.price}
            onChange={(e) => onChange({ price: e.target.value as PriceFilter })}
            className="w-full bg-background border border-border text-foreground text-xs font-semibold rounded-2xl p-2.5 focus:ring-2 focus:ring-primary focus:outline-hidden shadow-xs cursor-pointer"
          >
            <option value="all">Tất Cả Mức Giá</option>
            <option value="under_50">&lt; 50.000 ₫ (Tiết kiệm)</option>
            <option value="50_80">50.000 - 80.000 ₫ (Phổ thông)</option>
            <option value="80_120">80.000 - 120.000 ₫ (Đặc sắc)</option>
            <option value="above_120">&gt; 120.000 ₫ (Thượng hạng)</option>
          </select>
        </div>

        {/* 4. Deck Size / Limit */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <FontAwesomeIcon icon={faUtensils} className="text-secondary text-[11px]" />
            <span>Số món trong bộ bài</span>
          </label>
          <div className="flex gap-1 bg-muted/60 p-1 rounded-2xl border border-border/40">
            {[10, 20, 30].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onChange({ maxDishes: num })}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  filters.maxDishes === num
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {num} món
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Button to Launch Tinder */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60">
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          💡 <strong>Mẹo:</strong> Quẹt phải món bạn thích để chốt ngay lập tức, hoặc quẹt trái để tiếp tục khám phá.
        </p>

        <Button
          type="button"
          size="lg"
          onClick={onStartTinder}
          disabled={matchingCount === 0}
          className="w-full sm:w-auto px-8 py-3 rounded-full text-sm font-black tracking-wide bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all duration-300 transform hover:scale-102 active:scale-98 gap-2 cursor-pointer"
        >
          <FontAwesomeIcon icon={faFire} className="text-base text-yellow-200 animate-pulse" />
          <span>Tinder Món Ăn Ngay ({matchingCount})</span>
        </Button>
      </div>
    </div>
  );
};
