"use client";

import React from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faFire,
  faDumbbell,
  faUtensils,
  faCoins,
  faLeaf,
} from "@fortawesome/free-solid-svg-icons";
import { useSavedFoods } from "@/context/SavedFoodsContext";
import { formatPrice } from "@/lib/foodData";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SavedSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SavedSheet: React.FC<SavedSheetProps> = ({ open, onOpenChange }) => {
  const {
    savedFoods,
    removeFood,
    clearSaved,
    totalCalories,
    totalProtein,
    totalCost,
  } = useSavedFoods();

  const formattedTotalCost = formatPrice(totalCost);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-card text-card-foreground border-l border-border shadow-2xl">
        <SheetHeader className="p-5 border-b border-border/80 bg-muted/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <FontAwesomeIcon icon={faUtensils} className="text-secondary" />
              <span>Món Đã Lưu</span>
              <Badge className="bg-primary text-primary-foreground font-black text-xs px-2 py-0.5 rounded-full">
                {savedFoods.length}
              </Badge>
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Danh sách các món ăn yêu thích và kế hoạch dinh dưỡng của bạn
          </SheetDescription>
        </SheetHeader>

        {/* Nutritional & Cost Summary Banner */}
        {savedFoods.length > 0 && (
          <div className="mx-5 my-3.5 p-4 bg-muted/60 rounded-3xl border border-border/60 space-y-2.5">
            <span className="text-[11px] text-foreground uppercase tracking-wider block font-bold">
              Tổng Quan Dinh Dưỡng & Chi Phí
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-card rounded-2xl border border-border/40 shadow-xs">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 font-semibold">
                  <FontAwesomeIcon icon={faFire} className="text-secondary text-xs" />
                  Calo
                </span>
                <span className="text-sm font-black text-foreground mt-0.5 block">
                  {totalCalories} <span className="text-[9px] font-normal text-muted-foreground">kcal</span>
                </span>
              </div>
              <div className="p-2.5 bg-card rounded-2xl border border-border/40 shadow-xs">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 font-semibold">
                  <FontAwesomeIcon icon={faDumbbell} className="text-primary text-xs" />
                  Đạm
                </span>
                <span className="text-sm font-black text-primary mt-0.5 block">
                  {totalProtein} <span className="text-[9px] font-normal text-muted-foreground">g</span>
                </span>
              </div>
              <div className="p-2.5 bg-card rounded-2xl border border-border/40 shadow-xs">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 font-semibold">
                  <FontAwesomeIcon icon={faCoins} className="text-amber-500 text-xs" />
                  Chi Phí
                </span>
                <span className="text-xs font-black text-foreground truncate block mt-0.5">
                  {formattedTotalCost}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Saved List */}
        <div className="flex-1 overflow-y-auto px-5 divide-y divide-border/40">
          {savedFoods.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-muted/80 flex items-center justify-center text-secondary text-2xl border border-border/60">
                <FontAwesomeIcon icon={faUtensils} />
              </div>
              <h4 className="text-base text-foreground font-bold">
                Chưa Có Món Ăn Nào Được Lưu
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Hãy mở gói gợi ý ở Trang Chủ hoặc duyệt Thư Viện để lưu lại những món ăn yêu thích của bạn nhé!
              </p>
            </div>
          ) : (
            savedFoods.map((food) => {
              const imageSrc = food.imagePath || `/data/images/${food.id}.webp`;
              const formattedPrice = formatPrice(food.price);

              return (
                <div key={food.id} className="py-3.5 flex items-center gap-3 group">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-border/80 bg-muted">
                    <Image
                      src={imageSrc}
                      alt={food.name}
                      fill
                      unoptimized
                      draggable={false}
                      className="object-cover select-none"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-black">
                        {food.rarity}
                      </Badge>
                      {food.veg && (
                        <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 h-4 flex items-center gap-0.5">
                          <FontAwesomeIcon icon={faLeaf} className="text-[7px]" />
                          <span>Chay</span>
                        </Badge>
                      )}
                      <span className="text-[10px] font-bold text-secondary">
                        {formattedPrice}
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-foreground truncate mt-1">
                      {food.name}
                    </h5>
                    <p className="text-[11px] text-muted-foreground truncate">{food.sub}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-bold text-foreground">
                        {food.macros.calories} kcal
                      </span>
                      <span>•</span>
                      <span>{food.macros.protein}g đạm</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFood(food.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                    title="Bỏ lưu món này"
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        {savedFoods.length > 0 && (
          <SheetFooter className="p-5 border-t border-border/80 bg-muted/20 flex flex-row items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSaved}
              className="text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive rounded-2xl border-border"
            >
              <FontAwesomeIcon icon={faTrashCan} className="mr-1.5" />
              Xóa Tất Cả
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-primary text-primary-foreground hover:brightness-105 rounded-2xl text-xs font-bold px-6"
            >
              Đóng
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
