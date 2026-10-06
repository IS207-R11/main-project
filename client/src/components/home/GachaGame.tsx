"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotate,
  faBookmark,
  faArrowLeft,
  faCheck,
  faSliders,
  faHeart,
  faUtensils,
  faWandMagicSparkles,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { useSavedFoods } from "@/context/SavedFoodsContext";
import { foodsApi } from "@/api";
import { FoodCard, ExclusionType, FoodOption } from "@/api/types";
import { mapFoodCardToFoodItem } from "@/lib/foodAdapter";
import { BoosterPack } from "@/components/gacha/BoosterPack";
import { RevealAnimation } from "@/components/gacha/RevealAnimation";
import { FoodFlashCard } from "@/components/food/FoodFlashCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type GachaState = "pack" | "opening" | "revealed";

export interface GachaGameProps {
  className?: string;
}

export const GachaGame: React.FC<GachaGameProps> = () => {
  const { saveFood } = useSavedFoods();

  // Smart Gacha Param States (Full body/query attributes)
  const [numberOfExcludedEaten, setNumberOfExcludedEaten] = useState<number>(0);
  const [typeOfExcludedEaten, setTypeOfExcludedEaten] = useState<ExclusionType>("newest");
  const [numberOfExcludedGacha, setNumberOfExcludedGacha] = useState<number>(0);
  const [typeOfExcludedGacha, setTypeOfExcludedGacha] = useState<ExclusionType>("newest");
  const [foodSetInput, setFoodSetInput] = useState<string>("");
  const [availableOptions, setAvailableOptions] = useState<FoodOption[]>([]);
  const [selectedFoodSet, setSelectedFoodSet] = useState<number[]>([]);

  // UI state
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [gachaState, setGachaState] = useState<GachaState>("pack");
  const [winnerFood, setWinnerFood] = useState<FoodCard | null>(null);
  const [isGachaLoading, setIsGachaLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load top food options for easy foodSet selection
  useEffect(() => {
    foodsApi.options("").then((opts) => setAvailableOptions(opts)).catch(() => {});
  }, []);

  const handleStartGacha = useCallback(async () => {
    try {
      setIsGachaLoading(true);
      setErrorMessage(null);

      // Parse foodSet
      let foodSet: number[] | undefined = undefined;
      if (selectedFoodSet.length > 0) {
        foodSet = selectedFoodSet;
      } else if (foodSetInput.trim()) {
        const parsed = foodSetInput
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n));
        if (parsed.length > 0) foodSet = parsed;
      }

      const res = await foodsApi.gacha({
        numberOfExcludedEaten: Number(numberOfExcludedEaten) || 0,
        typeOfExcludedEaten,
        numberOfExcludedGacha: Number(numberOfExcludedGacha) || 0,
        typeOfExcludedGacha,
        foodSet,
      });

      if (res.data) {
        setWinnerFood(res.data);
        setSavedSuccess(false);
        setGachaState("opening");
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Không tìm thấy món ăn phù hợp cho gacha!";
      setErrorMessage(msg);
    } finally {
      setIsGachaLoading(false);
    }
  }, [
    numberOfExcludedEaten,
    typeOfExcludedEaten,
    numberOfExcludedGacha,
    typeOfExcludedGacha,
    selectedFoodSet,
    foodSetInput,
  ]);

  const handleRevealFinished = useCallback(() => {
    setGachaState("revealed");
  }, []);

  const handleSaveWinner = useCallback(() => {
    if (winnerFood) {
      saveFood(mapFoodCardToFoodItem(winnerFood));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  }, [winnerFood, saveFood]);

  const handleResetToPack = useCallback(() => {
    setGachaState("pack");
  }, []);

  const toggleFoodSetId = (id: number) => {
    setSelectedFoodSet((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <>
      {/* Reveal Overlay Animation */}
      {gachaState === "opening" && (
        <RevealAnimation highestRarity="SSR" onFinish={handleRevealFinished} />
      )}

      {/* Gacha Parameters Configuration Card */}
      {gachaState !== "revealed" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-8 p-5 sm:p-6 rounded-3xl bg-card text-card-foreground border border-border shadow-md backdrop-blur-md space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm uppercase tracking-wider">
              <FontAwesomeIcon icon={faSliders} className="text-primary" />
              <span>Cấu Hình Thuật Toán Gacha Thông Minh</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showAdvanced ? "Thu gọn tùy chọn" : "Mở rộng tùy chọn (foodSet & Loại trừ)"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Thuật toán xếp hạng món ăn theo công thức:{" "}
            <span className="font-semibold text-primary">
              Điểm = (Số người Yêu thích) + (Số người Đã ăn) - (Số người Ghét)
            </span>
            . Hệ thống lấy TOP 10 món điểm cao nhất và quay ngẫu nhiên 1 món chiến thắng!
          </p>

          {/* Form attributes for Gacha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Excluded Eaten Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Số món đã ăn cần loại trừ
              </label>
              <Input
                type="number"
                min={0}
                value={numberOfExcludedEaten}
                onChange={(e) => setNumberOfExcludedEaten(Math.max(0, parseInt(e.target.value, 10) || 0))}
                placeholder="0 (không loại trừ)"
                className="h-9 text-xs"
              />
            </div>

            {/* Excluded Eaten Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Cách loại trừ món đã ăn
              </label>
              <select
                value={typeOfExcludedEaten}
                onChange={(e) => setTypeOfExcludedEaten(e.target.value as ExclusionType)}
                className="w-full h-9 bg-background border border-border text-foreground text-xs rounded-md px-2 focus:ring-1 focus:ring-primary focus:outline-hidden cursor-pointer"
              >
                <option value="newest">Mới nhất (newest)</option>
                <option value="oldest">Cũ nhất (oldest)</option>
                <option value="random">Ngẫu nhiên (random)</option>
              </select>
            </div>

            {/* Excluded Gacha Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Số món đã gacha cần loại trừ
              </label>
              <Input
                type="number"
                min={0}
                value={numberOfExcludedGacha}
                onChange={(e) => setNumberOfExcludedGacha(Math.max(0, parseInt(e.target.value, 10) || 0))}
                placeholder="0 (không loại trừ)"
                className="h-9 text-xs"
              />
            </div>

            {/* Excluded Gacha Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Cách loại trừ món đã gacha
              </label>
              <select
                value={typeOfExcludedGacha}
                onChange={(e) => setTypeOfExcludedGacha(e.target.value as ExclusionType)}
                className="w-full h-9 bg-background border border-border text-foreground text-xs rounded-md px-2 focus:ring-1 focus:ring-primary focus:outline-hidden cursor-pointer"
              >
                <option value="newest">Mới nhất (newest)</option>
                <option value="oldest">Cũ nhất (oldest)</option>
                <option value="random">Ngẫu nhiên (random)</option>
              </select>
            </div>
          </div>

          {/* Advanced foodSet configuration */}
          {showAdvanced && (
            <div className="pt-3 border-t border-border/60 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Tập món ăn chỉ định (foodSet: int[])</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    (Nếu khai báo, hệ thống chỉ quay trong tập này)
                  </span>
                </label>
                <Input
                  type="text"
                  value={foodSetInput}
                  onChange={(e) => setFoodSetInput(e.target.value)}
                  placeholder="Nhập danh sách ID món ăn cách nhau bởi dấu phẩy, ví dụ: 1, 2, 5, 8"
                  className="h-9 text-xs"
                />
              </div>

              {availableOptions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    Hoặc chọn nhanh từ gợi ý:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableOptions.map((opt) => {
                      const isSelected = selectedFoodSet.includes(opt.food_id);
                      return (
                        <button
                          key={opt.food_id}
                          type="button"
                          onClick={() => toggleFoodSetId(opt.food_id)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                              : "bg-muted/50 border-border text-foreground hover:bg-muted"
                          }`}
                        >
                          #{opt.food_id} {opt.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {selectedFoodSet.length > 0
                ? `Đã chọn ${selectedFoodSet.length} món trong foodSet`
                : "Quay trên toàn bộ kho món ăn ACTIVE (sau khi trừ excluded)"}
            </span>
            <Button
              type="button"
              onClick={handleStartGacha}
              disabled={isGachaLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:brightness-105 shadow-sm gap-2 cursor-pointer"
            >
              <FontAwesomeIcon icon={faRotate} className={isGachaLoading ? "animate-spin" : ""} />
              <span>{isGachaLoading ? "Đang xếp hạng..." : "Mở Thẻ Gacha"}</span>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Gacha Booster Pack Visual */}
      {gachaState === "pack" && (
        <div className="py-6 flex flex-col items-center justify-center">
          <BoosterPack onOpen={handleStartGacha} count={1} isOpening={isGachaLoading} />
        </div>
      )}

      {/* Gacha Revealed Single Winner Food */}
      {gachaState === "revealed" && winnerFood && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6 max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-card text-card-foreground border border-border shadow-md">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-black text-secondary uppercase tracking-widest flex items-center gap-1.5 justify-center sm:justify-start">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-secondary" />
                Kết Quả Gacha Xuất Sắc Nhất
              </span>
              <h3 className="text-xl font-bold text-foreground">
                Đã chọn món ăn điểm cao nhất cho bạn
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartGacha}
                className="rounded-full text-xs font-bold gap-1.5 border-border bg-card text-foreground hover:bg-muted"
              >
                <FontAwesomeIcon icon={faRotate} className="text-xs text-primary" />
                <span>Quay Lại</span>
              </Button>

              <Button
                size="sm"
                onClick={handleSaveWinner}
                className="rounded-full text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:brightness-105 shadow-sm"
              >
                <FontAwesomeIcon icon={savedSuccess ? faCheck : faBookmark} className="text-xs" />
                <span>{savedSuccess ? "Đã lưu!" : "Lưu Món Này"}</span>
              </Button>
            </div>
          </div>

          {/* Flashcard presentation */}
          <div className="flex justify-center">
            <FoodFlashCard food={mapFoodCardToFoodItem(winnerFood)} />
          </div>

          {/* Detailed Winner Data Showcase */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Dữ Liệu Chi Tiết Của Món Ăn
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-muted/40 rounded-2xl border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Mã món</div>
                <div className="text-sm font-black text-foreground">#{winnerFood.food_id}</div>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <div className="text-[10px] text-rose-500 uppercase font-bold flex items-center justify-center gap-1">
                  <FontAwesomeIcon icon={faHeart} /> Yêu thích
                </div>
                <div className="text-sm font-black text-rose-600">
                  {winnerFood.favorite_count} lượt
                </div>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <div className="text-[10px] text-emerald-600 uppercase font-bold flex items-center justify-center gap-1">
                  <FontAwesomeIcon icon={faUtensils} /> Đã ăn
                </div>
                <div className="text-sm font-black text-emerald-600">
                  {winnerFood.eaten_count} lượt
                </div>
              </div>
              <div className="p-3 bg-muted/40 rounded-2xl border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center justify-center gap-1">
                  <FontAwesomeIcon icon={faClock} /> Trạng thái
                </div>
                <Badge variant={winnerFood.status === "ACTIVE" ? "default" : "secondary"}>
                  {winnerFood.status}
                </Badge>
              </div>
            </div>

            {winnerFood.description && (
              <p className="text-xs text-muted-foreground pt-1 italic">
                &ldquo;{winnerFood.description}&rdquo;
              </p>
            )}
          </div>

          <div className="text-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToPack}
              className="rounded-full px-6 text-xs font-bold border-border bg-card text-foreground hover:bg-muted gap-1.5"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Quay Lại Cấu Hình</span>
            </Button>
          </div>
        </motion.div>
      )}
    </>
  );
};
