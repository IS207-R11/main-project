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
import { useGameSettings } from "@/context/GameSettingsContext";
import { foodsApi } from "@/api";
import { FoodOption } from "@/api/types";
import { RotateCcw, Check, Sparkles, Flame, Search } from "lucide-react";

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
        .list({ pageSize: 60 })
        .then((res) => {
          if (res.data) {
            setAvailableFoods(
              res.data.map((f) => ({
                food_id: f.food_id,
                name: f.name,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [open, availableFoods.length]);

  const isGacha = activeTab === "gacha";

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

  const selectedFoodSet = isGacha ? gachaSettings.foodSet : tinderSettings.foodSet;

  const filteredFoods = availableFoods.filter((f) =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-card text-card-foreground border border-border shadow-2xl">
        <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            {isGacha ? (
              <Badge className="bg-primary/15 text-primary border border-primary/25 rounded-full px-2.5 py-0.5 text-xs font-bold gap-1">
                <Sparkles className="w-3 h-3" />
                Vòng quay
              </Badge>
            ) : (
              <Badge className="bg-rose-500/15 text-rose-500 border border-rose-500/25 rounded-full px-2.5 py-0.5 text-xs font-bold gap-1">
                <Flame className="w-3 h-3" />
                Quẹt món
              </Badge>
            )}
            <DialogTitle className="text-lg font-bold text-foreground">
              {isGacha ? "Tùy chỉnh vòng quay" : "Tùy chỉnh quẹt món"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Cài đặt được lưu tự động trên thiết bị của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* 1. Tinder Only: Số lượng món mỗi lượt quẹt */}
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

          {/* 2. Bỏ qua món đã ăn gần đây */}
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

          {/* 3. Cách chọn món đã ăn để ẩn (nếu số lượng > 0) */}
          {(isGacha ? gachaSettings.numberOfExcludedEaten : tinderSettings.numberOfExcludedEaten) > 0 && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-foreground">
                Thứ tự bỏ qua món đã ăn
              </label>
              <select
                value={isGacha ? gachaSettings.typeOfExcludedEaten : tinderSettings.typeOfExcludedEaten}
                onChange={(e) => {
                  const val = e.target.value as "newest" | "oldest" | "random";
                  if (isGacha) {
                    updateGachaSettings({ typeOfExcludedEaten: val });
                  } else {
                    updateTinderSettings({ typeOfExcludedEaten: val });
                  }
                }}
                className="w-full h-9 bg-background border border-border text-foreground text-xs rounded-xl px-3 focus:ring-1 focus:ring-primary focus:outline-hidden cursor-pointer"
              >
                <option value="newest">Mới ăn gần nhất</option>
                <option value="oldest">Đã ăn từ lâu</option>
                <option value="random">Chọn ngẫu nhiên</option>
              </select>
            </div>
          )}

          {/* 4. Ẩn món từng quay trúng */}
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

          {/* 5. Giới hạn danh sách món cụ thể */}
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
