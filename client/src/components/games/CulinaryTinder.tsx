'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFire,
  faSliders,
  faRotateRight,
  faClock,
  faLeaf,
  faTag,
  faUtensils,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { TinderCardStack } from '@/components/tinder/TinderCardStack';
import { GameSettingsDialog } from '@/components/home/GameSettingsDialog';
import { useAuth } from '@/context/AuthContext';
import { useTimeTheme } from '@/context/TimeThemeContext';
import { mapSystemDishToFoodItem } from '@/lib/foodAdapter';
import type { FoodItem, DietaryFilter, PriceFilter, SessionFilter, MealSession } from '@/types/food';

export const CulinaryTinder: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.user_id || user?.id || 1;
  const { recommendedSession } = useTimeTheme();

  // Settings State
  const [session, setSession] = useState<SessionFilter>('auto');
  const [diet, setDiet] = useState<DietaryFilter>('all');
  const [price, setPrice] = useState<PriceFilter>('all');
  const [maxDishes, setMaxDishes] = useState<number>(15);
  const [matchingCount, setMatchingCount] = useState<number>(0);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  // Play Mode
  const [mode, setMode] = useState<'filter' | 'swiping'>('filter');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchTinderFoods = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        user_id: String(userId),
        limit: String(maxDishes),
      });

      if (diet !== 'all') params.set('dietary', diet);
      if (session !== 'all') {
        params.set('session', session === 'auto' ? recommendedSession : session);
      }
      if (price !== 'all') params.set('price', price);

      const res = await fetch(`/api/mini-games/tinder?${params.toString()}`);
      const data = await res.json();

      if (data.status === 'success') {
        const mapped = (data.data || []).map(mapSystemDishToFoodItem);
        setFoods(mapped);
        setMatchingCount(data.total || mapped.length);
        return mapped;
      }
      return [];
    } catch {
      toast.error('Lỗi khi tải danh sách món ăn cho Tinder.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, maxDishes, diet, session, price, recommendedSession]);

  useEffect(() => {
    fetchTinderFoods();
  }, [fetchTinderFoods]);

  const handleResetFilters = () => {
    setSession('auto');
    setDiet('all');
    setPrice('all');
    setMaxDishes(15);
  };

  const handleStartTinder = async () => {
    let currentDeck = foods;
    if (currentDeck.length === 0) {
      currentDeck = await fetchTinderFoods();
    }
    if (currentDeck.length === 0) {
      toast.warning('Không tìm thấy món ăn nào phù hợp với bộ lọc.');
      return;
    }
    // Shuffle deck
    const shuffled = [...currentDeck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setFoods(shuffled);
    setMode('swiping');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 select-none">
      {mode === 'filter' ? (
        <div className="space-y-6">
          {/* Main Filter & Settings Bar */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-lg space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-500">
                  <FontAwesomeIcon icon={faFilter} className="text-sm" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    Bộ Lọc Tinder Ẩm Thực
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Tùy chỉnh khẩu vị, ngân sách và khung giờ để tạo bộ bài quẹt món
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted/80 text-foreground border border-border/60">
                  Khả dụng: <strong className="text-rose-600 font-bold">{matchingCount}</strong> món
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 cursor-pointer"
                  title="Đặt lại bộ lọc"
                >
                  <FontAwesomeIcon icon={faRotateRight} className="text-[10px]" />
                  <span>Mặc định</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsModalOpen(true)}
                  className="h-7 text-xs font-bold gap-1 px-2.5 rounded-xl border-border bg-card text-foreground hover:bg-muted cursor-pointer"
                  title="Cài đặt nâng cao"
                >
                  <FontAwesomeIcon icon={faSliders} className="text-[10px] text-rose-500" />
                  <span>Nâng cao</span>
                </Button>
              </div>
            </div>

            {/* Filter Selectors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Khung giờ ăn */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faClock} className="text-amber-500 text-[11px]" />
                  <span>Khung giờ ăn</span>
                </label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as SessionFilter)}
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

              {/* 2. Chế độ ăn */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faLeaf} className="text-emerald-500 text-[11px]" />
                  <span>Chế độ ăn</span>
                </label>
                <select
                  value={diet}
                  onChange={(e) => setDiet(e.target.value as DietaryFilter)}
                  className="w-full bg-background border border-border text-foreground text-xs font-semibold rounded-2xl p-2.5 focus:ring-2 focus:ring-primary focus:outline-hidden shadow-xs cursor-pointer"
                >
                  <option value="all">Tất Cả Chế Độ (Chay & Mặn)</option>
                  <option value="veg">🌱 Chỉ Món Chay</option>
                  <option value="meat">🍖 Chỉ Món Mặn</option>
                </select>
              </div>

              {/* 3. Khoảng giá / Mức Calo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faTag} className="text-rose-500 text-[11px]" />
                  <span>Khoảng calo / giá</span>
                </label>
                <select
                  value={price}
                  onChange={(e) => setPrice(e.target.value as PriceFilter)}
                  className="w-full bg-background border border-border text-foreground text-xs font-semibold rounded-2xl p-2.5 focus:ring-2 focus:ring-primary focus:outline-hidden shadow-xs cursor-pointer"
                >
                  <option value="all">Tất Cả Mức Calo</option>
                  <option value="under_50">&lt; 400 Kcal (Eat Clean)</option>
                  <option value="50_80">400 - 550 Kcal (Phổ thông)</option>
                  <option value="80_120">&gt; 550 Kcal (Giàu Năng Lượng)</option>
                </select>
              </div>

              {/* 4. Số món trong bộ bài */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUtensils} className="text-rose-500 text-[11px]" />
                  <span>Số món trong bộ bài</span>
                </label>
                <div className="flex gap-1 bg-muted/60 p-1 rounded-2xl border border-border/40">
                  {[10, 20, 30].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxDishes(num)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        maxDishes === num
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {num} món
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Tinder CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60">
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                💡 <strong>Mẹo:</strong> Quẹt phải món bạn thích để chốt ngay lập tức, hoặc quẹt trái để tiếp tục khám phá.
              </p>

              <Button
                type="button"
                size="lg"
                onClick={handleStartTinder}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 rounded-full text-sm font-black tracking-wide bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:brightness-105 text-white shadow-lg shadow-rose-500/25 transition-all transform hover:scale-102 active:scale-98 gap-2 cursor-pointer"
              >
                <FontAwesomeIcon icon={faFire} className="text-base text-yellow-200 animate-pulse" />
                <span>Bắt Đầu Quẹt Tinder ({matchingCount || foods.length})</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <TinderCardStack
            foods={foods}
            onOpenFilters={() => setMode('filter')}
            onRestartAll={async () => {
              await fetchTinderFoods();
              handleStartTinder();
            }}
          />
        </div>
      )}

      {/* Advanced Settings Modal */}
      <GameSettingsDialog
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        activeTab="tinder"
      />
    </div>
  );
};
