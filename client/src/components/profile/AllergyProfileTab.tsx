'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHeart,
  faTriangleExclamation,
  faPlus,
  faCheck,
  faTrash,
  faHeart,
  faThumbsDown,
  faBan,
  faUtensils,
  faRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface AllergyProfileTabProps {
  userId: number;
}

export const AllergyProfileTab: React.FC<AllergyProfileTabProps> = ({ userId }) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [allIngredients, setAllIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchIngredient, setSearchIngredient] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, ingRes] = await Promise.all([
        fetch(`/api/user/profile?user_id=${userId}`),
        fetch('/api/nutrition/ingredients'),
      ]);
      const pData = await profileRes.json();
      const iData = await ingRes.json();

      if (pData.status === 'success') {
        setProfileData(pData.data);
      }
      if (iData.status === 'success') {
        setAllIngredients(iData.data || []);
      }
    } catch {
      toast.error('Lỗi khi tải dữ liệu hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  const handleToggleAllergy = async (ingredientId: number, ingName: string) => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'TOGGLE_ALLERGY_INGREDIENT',
          ingredient_id: ingredientId,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (data.action === 'ADDED') {
          toast.warning(`Đã thêm "${ingName}" vào danh mục dị ứng. Mọi món ăn chứa thành phần này sẽ bị loại trừ.`);
        } else {
          toast.info(`Đã gỡ "${ingName}" khỏi danh mục dị ứng.`);
        }
        loadData();
      }
    } catch {
      toast.error('Lỗi kết nối.');
    }
  };

  const handleRemoveDishInteraction = async (dishId: number, type: 'FAVOURITE' | 'DISLIKE' | 'ALLERGY') => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'REMOVE_INTERACTION',
          dish_id: dishId,
          interaction_type: type,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success('Đã cập nhật trạng thái món ăn.');
        loadData();
      }
    } catch {
      toast.error('Lỗi kết nối.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  const allergicIngredients = profileData?.allergies || [];
  const allergicIngredientIds = allergicIngredients.map((a: any) => a.id);
  const favourites = profileData?.favourites || [];
  const dislikes = profileData?.dislikes || [];
  const allergicDishes = profileData?.allergic_dishes || [];

  const filteredAvailableIngredients = allIngredients.filter((ing: any) =>
    ing.name.toLowerCase().includes(searchIngredient.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* ================= 1. ALLERGY INGREDIENTS MANAGER ================= */}
      <section className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldHeart} className="text-amber-500" />
              Bộ Lọc Nguyên Liệu Dị Ứng (FR-SYS-04)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Các món ăn chứa bất kỳ nguyên liệu nào dưới đây sẽ bị loại bỏ <strong>100%</strong> khỏi kết quả tìm kiếm và các Mini-games.
            </p>
          </div>
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20 text-xs px-3 py-1 self-start sm:self-auto">
            {allergicIngredients.length} nguyên liệu bị chặn
          </Badge>
        </div>

        {/* Current Active Allergens */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-foreground block">
            Nguyên liệu bạn đã đánh dấu dị ứng:
          </span>
          {allergicIngredients.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              Chưa có nguyên liệu dị ứng nào được cài đặt. Bạn có thể chọn từ danh sách bên dưới.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {allergicIngredients.map((ing: any) => (
                <span
                  key={ing.id}
                  className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold px-3 py-1.5 rounded-full"
                >
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-[10px]" />
                  <span>{ing.name}</span>
                  <button
                    onClick={() => handleToggleAllergy(ing.id, ing.name)}
                    className="size-4 rounded-full hover:bg-amber-500/20 flex items-center justify-center text-xs ml-1 cursor-pointer"
                    title="Gỡ bỏ"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Add from Standard Ingredients List */}
        <div className="pt-4 border-t border-border/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-foreground">
              Chọn thêm nguyên liệu từ Danh mục Viện Dinh Dưỡng:
            </span>
            <input
              type="text"
              value={searchIngredient}
              onChange={(e) => setSearchIngredient(e.target.value)}
              placeholder="Tìm nguyên liệu (VD: tôm, mực, đậu...)"
              className="bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-primary max-w-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1">
            {filteredAvailableIngredients.map((ing: any) => {
              const isAllergic = allergicIngredientIds.includes(ing.id);
              return (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => handleToggleAllergy(ing.id, ing.name)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                    isAllergic
                      ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-200 font-bold'
                      : 'bg-card border-border hover:bg-muted text-foreground'
                  }`}
                >
                  <span className="truncate mr-1">{ing.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isAllergic ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {isAllergic ? 'Đã chặn' : '+ Chặn'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 2. MÓN ĂN YÊU THÍCH (FAVOURITES) ================= */}
      <section className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faHeart} className="text-rose-500" />
            Món Ăn Yêu Thích ({favourites.length})
          </h3>
        </div>

        {favourites.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 italic text-center">
            Bạn chưa lưu món ăn yêu thích nào. Hãy khám phá và thả tim các món bạn thích!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favourites.map((dish: any) => (
              <div
                key={dish.id}
                className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-muted/20 hover:bg-card transition-all"
              >
                <img
                  src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                  alt={dish.title}
                  className="size-14 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/mon-an/${dish.slug}`}>
                    <h4 className="text-xs font-bold text-foreground hover:text-primary transition-colors truncate">
                      {dish.title}
                    </h4>
                  </Link>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {Math.round(dish.total_calo)} Kcal
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDishInteraction(dish.id, 'FAVOURITE')}
                  className="h-7 text-[10px] font-bold text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                >
                  Bỏ Thích
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= 3. MÓN ĂN KHÔNG THÍCH & DỊ ỨNG (DISLIKES & ALLERGIC DISHES) ================= */}
      <section className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <FontAwesomeIcon icon={faBan} className="text-muted-foreground" />
              Món Ăn Đã Ẩn (Không Thích & Dị Ứng Riêng Tư)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Các món này không bao giờ xuất hiện trên trang của bạn. Bấm "Khôi phục" nếu bạn muốn xem lại.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Disliked list */}
          <div>
            <span className="text-xs font-bold text-foreground block mb-2">
              Món đã bấm Không thích ({dislikes.length}):
            </span>
            {dislikes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-1">(Không có món nào)</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dislikes.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground truncate mr-2">{d.title}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveDishInteraction(d.id, 'DISLIKE')}
                      className="h-6 text-[10px] font-bold rounded-lg shrink-0 text-primary border-primary/30"
                    >
                      <FontAwesomeIcon icon={faRotateLeft} className="mr-1 text-[9px]" />
                      Khôi phục
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Allergic dishes list */}
          <div className="pt-2 border-t border-border/60">
            <span className="text-xs font-bold text-foreground block mb-2">
              Món đã đánh dấu Dị ứng ({allergicDishes.length}):
            </span>
            {allergicDishes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-1">(Không có món nào)</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allergicDishes.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs">
                    <span className="font-semibold text-foreground truncate mr-2">{d.title}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveDishInteraction(d.id, 'ALLERGY')}
                      className="h-6 text-[10px] font-bold rounded-lg shrink-0 text-amber-600 border-amber-500/30"
                    >
                      <FontAwesomeIcon icon={faRotateLeft} className="mr-1 text-[9px]" />
                      Bỏ Dị Ứng
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

