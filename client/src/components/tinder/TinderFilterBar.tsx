"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faFire,
  faUtensils,
  faClock,
  faLeaf,
  faRotateRight,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import type {
  DietaryFilter,
  SessionFilter,
  MealSession,
  Rarity,
} from "@/types/food";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TinderFilterState {
  diet: DietaryFilter;
  rarity: "all" | Rarity;
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
          <Select
            value={filters.session}
            onValueChange={(val) => val && onChange({ session: val as SessionFilter })}
          >
            <SelectTrigger className="w-full rounded-2xl">
              <SelectValue placeholder="Chọn khung giờ">
                {filters.session === "auto"
                  ? `Tự Động (${recommendedSession})`
                  : filters.session === "all"
                  ? "Tất Cả Khung Giờ"
                  : filters.session}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Tự Động ({recommendedSession})</SelectItem>
              <SelectItem value="Sáng sớm">Sáng sớm</SelectItem>
              <SelectItem value="Giữa trưa">Giữa trưa</SelectItem>
              <SelectItem value="Chiều">Chiều</SelectItem>
              <SelectItem value="Tối">Tối</SelectItem>
              <SelectItem value="all">Tất Cả Khung Giờ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 2. Dietary */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <FontAwesomeIcon icon={faLeaf} className="text-emerald-500 text-[11px]" />
            <span>Chế độ ăn</span>
          </label>
          <Select
            value={filters.diet}
            onValueChange={(val) => val && onChange({ diet: val as DietaryFilter })}
          >
            <SelectTrigger className="w-full rounded-2xl">
              <SelectValue placeholder="Chọn chế độ ăn">
                {filters.diet === "veg"
                  ? "🌱 Chỉ Món Chay"
                  : filters.diet === "meat"
                  ? "🍖 Chỉ Món Mặn"
                  : "Tất Cả Chế Độ (Chay & Mặn)"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất Cả Chế Độ (Chay & Mặn)</SelectItem>
              <SelectItem value="veg">🌱 Chỉ Món Chay</SelectItem>
              <SelectItem value="meat">🍖 Chỉ Món Mặn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 3. Rarity Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <FontAwesomeIcon icon={faStar} className="text-amber-500 text-[11px]" />
            <span>Phân hạng / Độ hiếm</span>
          </label>
          <Select
            value={filters.rarity}
            onValueChange={(val) => val && onChange({ rarity: val as "all" | Rarity })}
          >
            <SelectTrigger className="w-full rounded-2xl">
              <SelectValue placeholder="Chọn độ hiếm">
                {filters.rarity === "SSR"
                  ? "👑 SSR - Thượng Hạng"
                  : filters.rarity === "SR"
                  ? "💜 SR - Đặc Sắc"
                  : filters.rarity === "UC"
                  ? "💎 UC - Trung Cấp"
                  : filters.rarity === "C"
                  ? "🍀 C - Phổ Biến"
                  : "Tất Cả Độ Hiếm"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất Cả Độ Hiếm</SelectItem>
              <SelectItem value="SSR">👑 SSR - Thượng Hạng</SelectItem>
              <SelectItem value="SR">💜 SR - Đặc Sắc</SelectItem>
              <SelectItem value="UC">💎 UC - Trung Cấp</SelectItem>
              <SelectItem value="C">🍀 C - Phổ Biến</SelectItem>
            </SelectContent>
          </Select>
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
