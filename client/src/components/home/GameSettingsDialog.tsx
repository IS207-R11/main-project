"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGameSettings } from "@/context/GameSettingsContext";
import { foodsApi } from "@/api";
import { FoodOption } from "@/api/types";
import { stripFoodCode } from "@/lib/foodAdapter";
import {
  RotateCcw,
  Check,
  Search,
  Salad,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import {
  ALLERGY_OPTIONS,
  MEAL_SESSION_OPTIONS,
  AllergyType,
  DietaryType,
  MealSessionType,
  isFoodMatchingFilter,
} from "@/lib/foodFilter";

interface GameSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: "gacha" | "tinder";
}

export const GameSettingsDialog: React.FC<GameSettingsDialogProps> = ({
  open,
  onOpenChange,
  activeTab,
}) => {
  const {
    gachaSettings,
    tinderSettings,
    updateGachaSettings,
    updateTinderSettings,
    resetGachaSettings,
    resetTinderSettings,
  } = useGameSettings();

  const [availableFoods, setAvailableFoods] = useState<FoodOption[]>([]);
  const [foodSearch, setFoodSearch] = useState("");
  const [showFoodPicker, setShowFoodPicker] = useState(false);

  // Load sample food options for specific food selection
  useEffect(() => {
    if (open && availableFoods.length === 0) {
      foodsApi
        .list({ pageSize: 100 })
        .then((res) => {
          if (res.data) {
            setAvailableFoods(
              res.data.map((f) => ({
                food_id: f.food_id,
                name: stripFoodCode(f.name) || f.name,
                description: f.description,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [open, availableFoods.length]);

  const isGacha = activeTab === "gacha";

  const currentDietary: DietaryType = (isGacha ? gachaSettings.dietary : tinderSettings.dietary) || "all";
  const currentAllergies: string[] = (isGacha ? gachaSettings.allergies : tinderSettings.allergies) || [];
  const currentMealSession: MealSessionType = (isGacha ? gachaSettings.mealSession : tinderSettings.mealSession) || "all";
  const selectedFoodSet = isGacha ? gachaSettings.foodSet : tinderSettings.foodSet;

  const setDietary = (diet: DietaryType) => {
    if (isGacha) {
      updateGachaSettings({ dietary: diet });
    } else {
      updateTinderSettings({ dietary: diet });
    }
  };

  const setMealSession = (session: MealSessionType) => {
    if (isGacha) {
      updateGachaSettings({ mealSession: session });
    } else {
      updateTinderSettings({ mealSession: session });
    }
  };

  const toggleAllergy = (allergy: AllergyType) => {
    const next = currentAllergies.includes(allergy)
      ? currentAllergies.filter((a) => a !== allergy)
      : [...currentAllergies, allergy];
    if (isGacha) {
      updateGachaSettings({ allergies: next });
    } else {
      updateTinderSettings({ allergies: next });
    }
  };

  // Toggle food selection in foodSet
  const toggleFoodInSet = (foodId: number) => {
    if (isGacha) {
      const current = gachaSettings.foodSet;
      const next = current.includes(foodId)
        ? current.filter((id) => id !== foodId)
        : [...current, foodId];
      updateGachaSettings({ foodSet: next });
    } else {
      const current = tinderSettings.foodSet;
      const next = current.includes(foodId)
        ? current.filter((id) => id !== foodId)
        : [...current, foodId];
      updateTinderSettings({ foodSet: next });
    }
  };

  const clearFoodSet = () => {
    if (isGacha) {
      updateGachaSettings({ foodSet: [] });
    } else {
      updateTinderSettings({ foodSet: [] });
    }
  };

  const matchingFoodsCount = availableFoods.length > 0
    ? availableFoods.filter((f) =>
        isFoodMatchingFilter(f, {
          dietary: currentDietary,
          allergies: currentAllergies,
          mealSession: currentMealSession,
        })
      ).length
    : 0;

  const filteredFoods = availableFoods.filter((f) =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-card text-card-foreground border border-border shadow-2xl">
        <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-border/60">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-foreground">
              {isGacha ? "Tùy chỉnh vòng quay" : "Tùy chỉnh quẹt món"}
            </DialogTitle>
            {availableFoods.length > 0 && (
              <Badge className="bg-primary/15 text-primary border-primary/30 text-xs px-2.5 py-0.5 font-bold">
                Phù hợp: {matchingFoodsCount} món
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Lọc chế độ ăn, dị ứng, khung giờ bữa ăn để gợi ý món ăn chuẩn xác nhất.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* ================= 1. BỘ LỌC CHẾ ĐỘ ĂN (CHAY / MẶN) ================= */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-muted/40 border border-border/50">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Salad className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Chế độ ăn uống</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDietary("all")}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  currentDietary === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                🍽️ Tất cả
              </button>
              <button
                type="button"
                onClick={() => setDietary("veg")}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  currentDietary === "veg"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-background border-border text-muted-foreground hover:text-emerald-600 hover:bg-muted"
                }`}
              >
                🥗 Ăn Chay
              </button>
              <button
                type="button"
                onClick={() => setDietary("meat")}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  currentDietary === "meat"
                    ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                    : "bg-background border-border text-muted-foreground hover:text-orange-600 hover:bg-muted"
                }`}
              >
                🍖 Ăn Mặn
              </button>
            </div>
          </div>

          {/* ================= 2. BỘ LỌC KHUNG GIỜ & BỮA ĂN ================= */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-muted/40 border border-border/50">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-secondary" />
              <span>Khung giờ / Bữa ăn trong ngày</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MEAL_SESSION_OPTIONS.map((item) => {
                const isSelected = currentMealSession === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMealSession(item.id)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                      isSelected
                        ? "bg-secondary/15 border-secondary text-foreground font-bold shadow-2xs"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-xs flex items-center gap-1 font-bold">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= 3. BỘ LỌC DỊ ỨNG & LOẠI TRỪ ================= */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-muted/40 border border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>Dị ứng & Loại trừ nguyên liệu</span>
              </label>
              {currentAllergies.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (isGacha) updateGachaSettings({ allergies: [] });
                    else updateTinderSettings({ allergies: [] });
                  }}
                  className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  Xóa bỏ lọc ({currentAllergies.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALLERGY_OPTIONS.map((opt) => {
                const isExcluded = currentAllergies.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleAllergy(opt.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isExcluded
                        ? "bg-rose-500 text-white border-rose-500 font-bold shadow-2xs"
                        : "bg-background border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                    {isExcluded && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[10.5px] text-muted-foreground">
              Chọn các thành phần bạn bị dị ứng hoặc không muốn ăn để tự động loại bỏ.
            </p>
          </div>

          {/* ================= 4. TINDER SỐ LƯỢNG MÓN ================= */}
          {!isGacha && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Số lượng món mỗi lượt
                </label>
                <span className="text-xs font-bold text-primary">
                  {tinderSettings.numberOfResult} món
                </span>
              </div>
              <Input
                type="number"
                min={1}
                max={50}
                value={tinderSettings.numberOfResult}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1));
                  updateTinderSettings({ numberOfResult: val });
                }}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Số thẻ món ăn xuất hiện trong mỗi bộ quẹt (từ 1 đến 50 món).
              </p>
            </div>
          )}

          {/* ================= 5. BỎ QUA MÓN ĐÃ ĂN ================= */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Bỏ qua món đã ăn
              </label>
              <span className="text-xs font-semibold text-muted-foreground">
                {(isGacha ? gachaSettings.numberOfExcludedEaten : tinderSettings.numberOfExcludedEaten) > 0
                  ? `${isGacha ? gachaSettings.numberOfExcludedEaten : tinderSettings.numberOfExcludedEaten} món`
                  : "Không bỏ qua"}
              </span>
            </div>
            <Input
              type="number"
              min={0}
              value={isGacha ? gachaSettings.numberOfExcludedEaten : tinderSettings.numberOfExcludedEaten}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                if (isGacha) {
                  updateGachaSettings({ numberOfExcludedEaten: val });
                } else {
                  updateTinderSettings({ numberOfExcludedEaten: val });
                }
              }}
              placeholder="0 (không bỏ qua)"
              className="h-9 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Số món ăn trong lịch sử ẩm thực của bạn muốn tạm ẩn đi để đổi vị.
            </p>
          </div>

          {/* 6. Cách chọn món đã ăn để ẩn (nếu số lượng > 0) */}
          {(isGacha ? gachaSettings.numberOfExcludedEaten : tinderSettings.numberOfExcludedEaten) > 0 && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-foreground">
                Thứ tự bỏ qua món đã ăn
              </label>
              <Select
                value={isGacha ? gachaSettings.typeOfExcludedEaten : tinderSettings.typeOfExcludedEaten}
                onValueChange={(val) => {
                  if (!val) return;
                  const v = val as "newest" | "oldest" | "random";
                  if (isGacha) {
                    updateGachaSettings({ typeOfExcludedEaten: v });
                  } else {
                    updateTinderSettings({ typeOfExcludedEaten: v });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn thứ tự bỏ qua...">
                    {((isGacha ? gachaSettings.typeOfExcludedEaten : tinderSettings.typeOfExcludedEaten) === "newest"
                      ? "Mới ăn gần nhất"
                      : (isGacha ? gachaSettings.typeOfExcludedEaten : tinderSettings.typeOfExcludedEaten) === "oldest"
                      ? "Đã ăn từ lâu"
                      : "Chọn ngẫu nhiên")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới ăn gần nhất</SelectItem>
                  <SelectItem value="oldest">Đã ăn từ lâu</SelectItem>
                  <SelectItem value="random">Chọn ngẫu nhiên</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ================= 7. ẨN MÓN TỪNG QUAY TRÚNG ================= */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50">
            <input
              id="excludeGachaToggle"
              type="checkbox"
              checked={isGacha ? gachaSettings.excludedGachaSet : tinderSettings.excludedGachaSet}
              onChange={(e) => {
                const val = e.target.checked;
                if (isGacha) {
                  updateGachaSettings({ excludedGachaSet: val });
                } else {
                  updateTinderSettings({ excludedGachaSet: val });
                }
              }}
              className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
            />
            <label htmlFor="excludeGachaToggle" className="cursor-pointer select-none space-y-0.5">
              <div className="text-xs font-bold text-foreground">
                Ẩn món từng quay trúng
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Không gợi ý lại những món bạn đã từng quay ra trong các lần trước.
              </p>
            </label>
          </div>

          {/* ================= 8. GIỚI HẠN MÓN CỤ THỂ ================= */}
          <div className="space-y-2 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-foreground block">
                  Giới hạn món cụ thể
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {selectedFoodSet.length > 0
                    ? `Đã chọn ${selectedFoodSet.length} món`
                    : "Chọn từ tất cả món ăn"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedFoodSet.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFoodSet}
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                  >
                    Xóa chọn
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFoodPicker(!showFoodPicker)}
                  className="h-7 px-2.5 text-xs font-medium rounded-xl"
                >
                  {showFoodPicker ? "Thu gọn" : "Chọn món"}
                </Button>
              </div>
            </div>

            {showFoodPicker && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-2xl border border-border/50 animate-in fade-in duration-200">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    placeholder="Tìm tên món..."
                    className="h-8 pl-8 text-xs bg-background"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto flex flex-wrap gap-1.5 pt-1">
                  {filteredFoods.map((f) => {
                    const isSelected = selectedFoodSet.includes(f.food_id);
                    return (
                      <button
                        key={f.food_id}
                        type="button"
                        onClick={() => toggleFoodInSet(f.food_id)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                            : "bg-background border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{f.name}</span>
                      </button>
                    );
                  })}
                  {filteredFoods.length === 0 && (
                    <span className="text-xs text-muted-foreground py-2 px-1">
                      Không tìm thấy món ăn phù hợp.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={isGacha ? resetGachaSettings : resetTinderSettings}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:brightness-105 cursor-pointer shadow-xs"
          >
            Hoàn tất
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

