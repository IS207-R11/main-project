"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { FoodItem, Rarity } from "@/types/food";
import type { FoodStatus } from "@/api/types";
import { foodsApi } from "@/api";
import { mapFoodCardToFoodItem } from "@/lib/foodAdapter";
import { VirtualMasonryGrid } from "@/components/food/VirtualMasonryGrid";
import { CreateFoodModal } from "@/components/food/CreateFoodModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "name" | "rarity_desc" | "newest";

export const ResourcesExplorer: React.FC = () => {
  // Foods state from system API
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

  // Pagination state (infinite scroll)
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | FoodStatus>("ALL");
  const [selectedRarity, setSelectedRarity] = useState<"all" | Rarity>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");

  // Sentinel ref for bottom intersection observer
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Map filters to API params
  const getApiParams = useCallback(
    (pageNumber: number): {
      page: number;
      pageSize: number;
      status: "ALL" | FoodStatus;
      search?: string;
      food_rank?: "SSR" | "SR" | "UC" | "C";
      sort_by: "name" | "created_at" | "rating_score" | "cd" | "food_rank";
      sort_order: "asc" | "desc";
    } => {
      const apiSortBy: "name" | "created_at" | "rating_score" | "cd" | "food_rank" =
        sortBy === "rarity_desc"
          ? "rating_score"
          : sortBy === "newest"
          ? "created_at"
          : "name";
      const apiSortOrder: "asc" | "desc" =
        sortBy === "rarity_desc" || sortBy === "newest" ? "desc" : "asc";
      const apiFoodRank =
        selectedRarity === "all"
          ? undefined
          : (selectedRarity as "SSR" | "SR" | "UC" | "C");

      return {
        page: pageNumber,
        pageSize,
        status: selectedStatus,
        search: searchQuery.trim() || undefined,
        food_rank: apiFoodRank,
        sort_by: apiSortBy,
        sort_order: apiSortOrder,
      };
    },
    [pageSize, searchQuery, selectedRarity, selectedStatus, sortBy]
  );

  // Fetch initial/first page (resets list)
  const fetchFirstPage = useCallback(async () => {
    try {
      setInitialLoading(true);
      setPage(1);

      const params = getApiParams(1);
      const res = await foodsApi.list(params);

      if (res && res.data) {
        const mapped = res.data.map((card) => mapFoodCardToFoodItem(card));
        setFoods(mapped);
        const total = res.total_records ?? mapped.length;
        setTotalRecords(total);
        setHasMore(mapped.length < total);
      } else {
        setFoods([]);
        setTotalRecords(0);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Lỗi khi tải trang đầu món ăn:", err);
    } finally {
      setInitialLoading(false);
    }
  }, [getApiParams]);

  // Fetch next page when user scrolls near the bottom
  const loadMore = useCallback(async () => {
    if (loadingMore || initialLoading || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const params = getApiParams(nextPage);
      const res = await foodsApi.list(params);

      if (res && res.data && res.data.length > 0) {
        const mapped = res.data.map((card) => mapFoodCardToFoodItem(card));
        setFoods((prev) => {
          const existingIds = new Set(prev.map((f) => f.id));
          const uniqueNew = mapped.filter((f) => !existingIds.has(f.id));
          const updated = [...prev, ...uniqueNew];
          const total = res.total_records ?? totalRecords;
          setHasMore(updated.length < total);
          return updated;
        });
        setPage(nextPage);
        if (res.total_records !== undefined) {
          setTotalRecords(res.total_records);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Lỗi khi tải thêm món ăn:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, initialLoading, hasMore, page, getApiParams, totalRecords]);

  // Trigger initial fetch whenever search or filter options change
  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  // Calculate index of sentinel item (the 10th item before the end of the batch, since pageSize is 20)
  const sentinelIndex =
    hasMore && foods.length > 0
      ? Math.max(0, foods.length >= 10 ? foods.length - 10 : foods.length - 1)
      : -1;

  // Infinite scroll listener using IntersectionObserver on 10th food item sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || initialLoading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: "300px 0px", // Trigger when approaching the 10th item
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, initialLoading, loadingMore, loadMore, foods.length, sentinelIndex]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedRarity("all");
    setSortBy("name");
  };

  const hasActiveFilters =
    searchQuery || selectedStatus !== "ALL" || selectedRarity !== "all" || sortBy !== "name";

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
              onClick={fetchFirstPage}
              disabled={initialLoading}
              className="rounded-2xl h-11 px-4 text-xs font-bold gap-1.5 cursor-pointer"
              title="Tải lại từ hệ thống"
            >
              <FontAwesomeIcon
                icon={faRotate}
                className={initialLoading ? "animate-spin" : ""}
              />
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FontAwesomeIcon
                icon={faCircleCheck}
                className="text-secondary text-[10px]"
              />
              Trạng Thái
            </label>
            <Select
              value={selectedStatus}
              onValueChange={(val) => val && setSelectedStatus(val as "ALL" | FoodStatus)}
            >
              <SelectTrigger className="w-full rounded-2xl">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="PENDING">Đang chờ duyệt</SelectItem>
                <SelectItem value="DISABLED">Đang ngưng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rarity Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FontAwesomeIcon
                icon={faFilter}
                className="text-secondary text-[10px]"
              />
              Độ Hiếm / Phổ Biến
            </label>
            <Select
              value={selectedRarity}
              onValueChange={(val) => val && setSelectedRarity(val as "all" | Rarity)}
            >
              <SelectTrigger className="w-full rounded-2xl">
                <SelectValue placeholder="Chọn độ hiếm" />
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

          {/* Sort Options */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FontAwesomeIcon
                icon={faArrowDownWideShort}
                className="text-secondary text-[10px]"
              />
              Sắp xếp
            </label>
            <Select
              value={sortBy}
              onValueChange={(val) => val && setSortBy(val as SortOption)}
            >
              <SelectTrigger className="w-full rounded-2xl">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Tên (A - Z)</SelectItem>
                <SelectItem value="rarity_desc">Độ Hiếm Cao Nhất</SelectItem>
                <SelectItem value="newest">Mới Nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count & Reset Filter Badge */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
          <span className="text-muted-foreground font-semibold">
            Đã tải <strong>{foods.length}</strong> / <strong>{totalRecords}</strong> món ăn từ hệ thống
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-destructive hover:bg-destructive/10 rounded-full px-3 cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faRotateLeft}
                className="mr-1.5 text-[10px]"
              />
              Đặt Lại Bộ Lọc
            </Button>
          )}
        </div>
      </div>

      {/* ================= VIRTUAL MASONRY FOOD FLASHCARDS GRID ================= */}
      {initialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 min-[880px]:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 justify-items-center w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-full max-w-[260px] h-[345px] sm:h-[360px] rounded-3xl bg-card border border-border p-3.5 flex flex-col justify-between shadow-xs"
            >
              <Skeleton className="w-full h-[145px] sm:h-[160px] rounded-2xl" />
              <div className="space-y-2 py-2">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-2/3 rounded-md" />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/40">
                <Skeleton className="h-4 w-12 rounded-full" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : foods.length > 0 ? (
        <div className="space-y-6 w-full">
          <VirtualMasonryGrid
            foods={foods}
            sentinelRef={sentinelRef}
            sentinelIndex={sentinelIndex}
          />

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="py-6 flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground px-4 py-2 rounded-full bg-muted/60 border border-border/40 shadow-xs">
                <FontAwesomeIcon
                  icon={faRotate}
                  className="animate-spin text-secondary text-xs"
                />
                <span>Đang tải thêm món ăn...</span>
              </div>
            </div>
          )}

          {/* End of results message */}
          {!hasMore && foods.length > 0 && (
            <div className="py-10 text-center flex items-center justify-center gap-3 text-xs text-muted-foreground/70">
              <span className="h-px w-20 bg-border/60" />
              <span className="font-medium">
                Đã hiển thị toàn bộ {totalRecords} món ăn
              </span>
              <span className="h-px w-20 bg-border/60" />
            </div>
          )}
        </div>
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
          fetchFirstPage();
        }}
      />
    </div>
  );
};
