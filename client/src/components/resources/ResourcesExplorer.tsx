"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faFilter,
  faArrowDownWideShort,
  faXmark,
  faRotateLeft,
  faUtensils,
  faPlus,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import type {
  FoodItem,
  Rarity,
} from "@/types/food";
import { foodsApi } from "@/api";
import { mapFoodCardToFoodItem } from "@/lib/foodAdapter";
import { VirtualFoodGrid } from "@/components/food/VirtualFoodGrid";
import { CreateFoodModal } from "@/components/food/CreateFoodModal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type SortOption =
  | "name"
  | "rarity_desc"
  | "favorite_desc"
  | "eaten_desc";

const rarityOrder: Record<Rarity, number> = {
  SSR: 4,
  SR: 3,
  UC: 2,
  C: 1,
};

const viCollator = new Intl.Collator("vi", { sensitivity: "base", numeric: true });

export const ResourcesExplorer: React.FC = () => {
  // Foods state from system API
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<"all" | Rarity>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");

  // Fetch foods from System API (GET /foods?status=ACTIVE)
  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true);
      const res = await foodsApi.list({
        pageSize: 100,
        status: "ACTIVE",
        sort_by: "name",
        sort_order: "asc",
      });

      if (res && res.data) {
        const mapped = res.data
          .filter((card) => card.status === "ACTIVE")
          .map((card) => mapFoodCardToFoodItem(card));
        setFoods(mapped);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách món ăn từ hệ thống API:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  // Filter and sort items based on real API data
  const filteredFoods = useMemo(() => {
    return foods
      .filter((food) => {
        // Enforce active status
        if (food.status && food.status !== "ACTIVE") {
          return false;
        }

        const name = (food.name || "").toLowerCase();
        const desc = (food.description || "").toLowerCase();
        const q = searchQuery.toLowerCase().trim();

        // Search match on actual fields
        if (q && !name.includes(q) && !desc.includes(q)) {
          return false;
        }

        // Rarity match
        if (selectedRarity !== "all" && food.rarity !== selectedRarity) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "favorite_desc":
            return (b.favorite_count || 0) - (a.favorite_count || 0);
          case "eaten_desc":
            return (b.eaten_count || 0) - (a.eaten_count || 0);
          case "rarity_desc":
            return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
          case "name":
          default:
            return viCollator.compare(a.name || "", b.name || "");
        }
      });
  }, [foods, searchQuery, selectedRarity, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedRarity("all");
    setSortBy("name");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedRarity !== "all" ||
    sortBy !== "name";

  return (
    <div className="space-y-6 min-h-[calc(100vh-14rem)]">
      {/* ================= SEARCH & CONTROLS BAR ================= */}
      <div className="p-5 rounded-3xl bg-card text-card-foreground border border-border shadow-md backdrop-blur-md space-y-4">
        {/* Top Search Input & Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-sm"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên món ăn, mô tả hương vị..."
              className="w-full pl-11 pr-10 py-3 bg-background border border-border text-foreground text-sm rounded-2xl focus:ring-2 focus:ring-primary focus:outline-hidden transition-all shadow-xs placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFoods}
              disabled={loading}
              className="rounded-2xl h-11 px-4 text-xs font-bold gap-1.5"
              title="Tải lại từ hệ thống"
            >
              <FontAwesomeIcon icon={faRotate} className={loading ? "animate-spin" : ""} />
              <span className="hidden md:inline">Làm Mới</span>
            </Button>

            <Button
              onClick={() => setCreateModalOpen(true)}
              className="rounded-2xl h-11 px-5 text-xs font-bold gap-2 shadow-md cursor-pointer w-full sm:w-auto"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Đóng Góp Món Mới</span>
            </Button>
          </div>
        </div>

        {/* Filter & Sort Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Rarity Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FontAwesomeIcon icon={faFilter} className="text-secondary text-[10px]" />
              Độ Hiếm / Phổ Biến
            </label>
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value as "all" | Rarity)}
              className="w-full bg-background border border-border text-foreground text-xs font-semibold rounded-2xl p-2.5 focus:ring-2 focus:ring-primary focus:outline-hidden shadow-xs cursor-pointer"
            >
              <option value="all">Tất Cả Độ Hiếm</option>
              <option value="SSR">👑 SSR - Thượng Hạng</option>
              <option value="SR">💜 SR - Đặc Sắc</option>
              <option value="UC">💎 UC - Trung Cấp</option>
              <option value="C">🍀 C - Phổ Biến</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FontAwesomeIcon
                icon={faArrowDownWideShort}
                className="text-secondary text-[10px]"
              />
              Sắp xếp
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-background border border-border text-foreground text-xs font-semibold rounded-2xl p-2.5 focus:ring-2 focus:ring-primary focus:outline-hidden shadow-xs cursor-pointer"
            >
              <option value="name">Tên (A - Z)</option>
              <option value="rarity_desc">Độ Hiếm Cao Nhất</option>
              <option value="favorite_desc">Được Yêu Thích Nhất</option>
              <option value="eaten_desc">Được Ăn Nhiều Nhất</option>
            </select>
          </div>
        </div>

        {/* Results Count & Reset Filter Badge */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
          <span className="text-muted-foreground font-semibold">
            Hiển thị <strong>{filteredFoods.length}</strong> món ăn từ hệ thống API
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-destructive hover:bg-destructive/10 rounded-full px-3"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="mr-1.5 text-[10px]" />
              Đặt Lại Bộ Lọc
            </Button>
          )}
        </div>
      </div>

      {/* ================= VIRTUAL FOOD FLASHCARDS GRID ================= */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Spinner className="w-8 h-8 text-secondary" />
          <p className="text-xs text-muted-foreground">Đang tải kho tàng món ăn từ hệ thống...</p>
        </div>
      ) : filteredFoods.length > 0 ? (
        <VirtualFoodGrid foods={filteredFoods} maxVisibleRows={10} />
      ) : (
        <div className="py-20 text-center space-y-4 rounded-3xl bg-card border border-dashed border-border p-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-muted flex items-center justify-center text-muted-foreground text-2xl">
            <FontAwesomeIcon icon={faUtensils} />
          </div>
          <h3 className="text-lg text-foreground font-bold">
            Chưa tìm thấy món ăn phù hợp
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bấm nút bên dưới để đóng góp món mới đầu tiên.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="rounded-full text-xs font-bold border-border"
            >
              Đặt Lại Bộ Lọc
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="rounded-full text-xs font-bold gap-1.5"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              <span>Đóng Góp Món Mới</span>
            </Button>
          </div>
        </div>
      )}

      {/* Modal create food */}
      <CreateFoodModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          fetchFoods();
        }}
      />
    </div>
  );
};
