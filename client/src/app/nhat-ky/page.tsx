'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { foodsApi } from '@/api';
import { EatenFood, FoodOption, MealType } from '@/api/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen,
  faUtensils,
  faPlus,
  faTrashCan,
  faClock,
  faFire,
  faTriangleExclamation,
  faCheck,
  faArrowRightToBracket,
} from '@fortawesome/free-solid-svg-icons';

const mealTypeLabels: Record<MealType, { label: string; color: string }> = {
  BREAKFAST: { label: 'Bữa Sáng', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  LUNCH: { label: 'Bữa Trưa', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  DINNER: { label: 'Bữa Tối', color: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30' },
  SNACK: { label: 'Bữa Phụ', color: 'bg-rose-500/15 text-rose-500 border-rose-500/30' },
};

export default function DiaryPage() {
  const { user, isAuthenticated, isLoading: authLoading, openAuthModal } = useAuth();

  const [eatenList, setEatenList] = useState<EatenFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  // New record form state
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodOption | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const [eatenAt, setEatenAt] = useState(new Date().toISOString().slice(0, 16));
  const [formSaving, setFormSaving] = useState(false);
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadEatenHistory = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      setLoading(true);
      const res = await foodsApi.getEaten(user.user_id, { pageSize: 50 });
      if (res.data) {
        setEatenList(res.data);
      }
    } catch (e) {
      console.warn('Failed to load eaten meals:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.user_id) {
      loadEatenHistory();
    }
  }, [user?.user_id, loadEatenHistory]);

  // Food search autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFoodOptions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const options = await foodsApi.options(searchQuery.trim());
        setFoodOptions(options);
      } catch {
        setFoodOptions([]);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleCreateEaten = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    if (!selectedFood) {
      setFormMsg({ text: 'Vui lòng chọn một món ăn từ danh sách', type: 'error' });
      return;
    }
    try {
      setFormSaving(true);
      await foodsApi.recordEaten({
        meal_type: mealType,
        items: [{ food_id: selectedFood.food_id, quantity: Number(quantity) }],
        eaten_at: eatenAt ? new Date(eatenAt).toISOString() : undefined,
        note: note || undefined,
      });
      await loadEatenHistory();
      // Reset form
      setSelectedFood(null);
      setSearchQuery('');
      setQuantity(1);
      setNote('');
      setRecordModalOpen(false);
    } catch (err: unknown) {
      setFormMsg({ text: err instanceof Error ? err.message : 'Lỗi ghi nhận bữa ăn', type: 'error' });
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteEaten = async (eatenFoodId: number) => {
    try {
      await foodsApi.deleteEaten(eatenFoodId);
      setEatenList((prev) => prev.filter((item) => item.eaten_food_id !== eatenFoodId));
    } catch (err) {
      console.error('Failed to delete meal:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-20 px-4 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto max-w-lg py-20 px-4 text-center space-y-4">
        <div className="size-16 rounded-full bg-secondary/15 flex items-center justify-center mx-auto text-secondary text-2xl">
          <FontAwesomeIcon icon={faBookOpen} />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Nhật Ký Bữa Ăn</h1>
        <p className="text-sm text-muted-foreground">
          Đăng nhập để ghi chép các bữa ăn hàng ngày, tính toán calo tiêu thụ và theo dõi chế độ dinh dưỡng.
        </p>
        <Button onClick={() => openAuthModal('login')} className="font-bold gap-2">
          <FontAwesomeIcon icon={faArrowRightToBracket} />
          <span>Đăng Nhập Ngay</span>
        </Button>
      </div>
    );
  }

  // Calculate total consumed calories
  let totalCalories = 0;
  eatenList.forEach((eaten) => {
    eaten.items?.forEach((item) => {
      const foodCards = item.food || [];
      foodCards.forEach((food) => {
        (food.nutritions || []).forEach((n) => {
          totalCalories += (n.calories || 0) * (item.quantity || 1);
        });
      });
    });
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBookOpen} className="text-secondary text-xl" />
              <h1 className="text-2xl font-black text-foreground">Nhật Ký Ăn Uống</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Theo dõi các món ăn và năng lượng bạn đã nạp vào cơ thể hôm nay
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-muted/60 text-center px-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Tổng Nạp Calo
              </span>
              <span className="text-xl font-black text-primary flex items-center gap-1 justify-center">
                <FontAwesomeIcon icon={faFire} className="text-xs" />
                {Math.round(totalCalories)} kcal
              </span>
            </div>

            <Button
              onClick={() => setRecordModalOpen(true)}
              className="font-bold gap-1.5 rounded-full cursor-pointer"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              <span>Ghi Bữa Ăn</span>
            </Button>
          </div>
        </div>

        {/* Form popup / drawer to record eaten */}
        {recordModalOpen && (
          <Card className="rounded-3xl border-primary/40 bg-card p-6 shadow-xl animate-in slide-in-from-top-3">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Ghi Nhận Món Vừa Ăn</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecordModalOpen(false)}
                  className="rounded-full"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleCreateEaten} className="space-y-4">
                {formMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      formMsg.type === 'success'
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : 'bg-destructive/15 text-destructive border border-destructive/30'
                    }`}
                  >
                    <FontAwesomeIcon icon={formMsg.type === 'success' ? faCheck : faTriangleExclamation} />
                    <span>{formMsg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Bữa ăn</label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value as MealType)}
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none"
                    >
                      <option value="BREAKFAST">Bữa Sáng</option>
                      <option value="LUNCH">Bữa Trưa</option>
                      <option value="DINNER">Bữa Tối</option>
                      <option value="SNACK">Bữa Phụ</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Thời gian ăn</label>
                    <Input
                      type="datetime-local"
                      value={eatenAt}
                      onChange={(e) => setEatenAt(e.target.value)}
                    />
                  </div>
                </div>

                {/* Food search autocomplete */}
                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-foreground">Tìm món ăn *</label>
                  {selectedFood ? (
                    <div className="flex items-center justify-between p-2 rounded-lg border border-secondary bg-secondary/10">
                      <span className="text-xs font-bold text-foreground">
                        {selectedFood.food_name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFood(null)}
                        className="text-xs h-6 px-2 text-destructive"
                      >
                        Đổi món
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="text"
                        placeholder="Gõ tên món (Phở bò, Cơm tấm, Bún chả...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {foodOptions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-popover border border-border rounded-xl shadow-lg p-1 max-h-48 overflow-y-auto">
                          {foodOptions.map((opt) => (
                            <button
                              key={opt.food_id}
                              type="button"
                              onClick={() => {
                                setSelectedFood(opt);
                                setFoodOptions([]);
                              }}
                              className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted font-medium cursor-pointer transition-colors"
                            >
                              {opt.food_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Số lượng (khẩu phần)</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="10"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Ghi chú (tùy chọn)</label>
                    <Input
                      type="text"
                      placeholder="Ăn cùng đồng nghiệp..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRecordModalOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={formSaving} className="font-bold">
                    {formSaving ? <Spinner /> : 'Lưu Bữa Ăn'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Timeline of Meals */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : eatenList.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-3xl bg-card border border-border space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <FontAwesomeIcon icon={faUtensils} />
            </div>
            <h3 className="font-bold text-base text-foreground">Chưa Có Dữ Liệu Bữa Ăn</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Bắt đầu ghi lại các món bạn ăn hôm nay để hệ thống tổng hợp lượng calo và dinh dưỡng nhé!
            </p>
            <Button onClick={() => setRecordModalOpen(true)} size="sm" className="font-bold mt-2">
              <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
              Ghi Bữa Ăn Đầu Tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {eatenList.map((eaten) => {
              const badgeInfo = mealTypeLabels[eaten.meal_type] || mealTypeLabels.LUNCH;
              const dateStr = eaten.eaten_at ? new Date(eaten.eaten_at).toLocaleString('vi-VN') : 'Gần đây';

              return (
                <div
                  key={eaten.eaten_food_id}
                  className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-secondary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badgeInfo.color}`}>
                        {badgeInfo.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                        {dateStr}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {eaten.items?.map((it, idx) => {
                        const foodName = it.food?.[0]?.food_name || 'Món ăn';
                        return (
                          <div key={idx} className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span>{foodName}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                              x {it.quantity} phần
                            </span>
                          </div>
                        );
                      })}
                      {eaten.note && (
                        <p className="text-xs text-muted-foreground italic">
                          &ldquo;{eaten.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEaten(eaten.eaten_food_id)}
                      className="text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 p-0 cursor-pointer"
                      title="Xóa mục này"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
