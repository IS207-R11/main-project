'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faShieldHeart, faBan } from '@fortawesome/free-solid-svg-icons';

interface IngredientItem {
  ingredient_id: number;
  name: string;
}

interface AllergyActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: {
    id: number;
    title: string;
    image_url?: string | null;
    ingredients?: IngredientItem[];
  } | null;
  userId: number;
  onConfirmSuccess: () => void;
}

export const AllergyActionModal: React.FC<AllergyActionModalProps> = ({
  isOpen,
  onClose,
  dish,
  userId,
  onConfirmSuccess,
}) => {
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!dish) return null;

  const toggleIngredient = (id: number) => {
    setSelectedIngredientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/system-dishes/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          dish_id: dish.id,
          interaction_type: 'ALLERGY',
          allergy_ingredient_ids: selectedIngredientIds,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (selectedIngredientIds.length > 0) {
          toast.warning(
            `Đã chặn món "${dish.title}" và lưu ${selectedIngredientIds.length} nguyên liệu vào Hồ sơ dị ứng!`,
            { icon: () => '🛡️' }
          );
        } else {
          toast.info(`Đã đưa món "${dish.title}" vào danh sách món dị ứng cá nhân.`);
        }
        onConfirmSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Lỗi khi lưu dị ứng.');
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 bg-card text-foreground rounded-3xl border border-border shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto text-xl">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <DialogTitle className="text-xl font-extrabold text-center">
            Xác Nhận Đánh Dấu Dị Ứng
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground text-center leading-relaxed">
            Bạn có phản ứng dị ứng hoặc muốn tránh món <strong>"{dish.title}"</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <FontAwesomeIcon icon={faShieldHeart} className="text-primary text-xs" />
              <span>Chọn đích danh nguyên liệu gây dị ứng (tùy chọn):</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Hệ thống sẽ cập nhật vào <strong>Hồ sơ dị ứng</strong> và tự động loại trừ mọi món khác chứa nguyên liệu này.
            </p>

            {dish.ingredients && dish.ingredients.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 pt-1 max-h-40 overflow-y-auto pr-1">
                {dish.ingredients.map((ing) => (
                  <div
                    key={ing.ingredient_id}
                    onClick={() => toggleIngredient(ing.ingredient_id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer select-none ${
                      selectedIngredientIds.includes(ing.ingredient_id)
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                        : 'bg-card border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    <Checkbox
                      checked={selectedIngredientIds.includes(ing.ingredient_id)}
                      onCheckedChange={() => toggleIngredient(ing.ingredient_id)}
                      className="size-3.5"
                    />
                    <span className="truncate">{ing.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                (Món này chưa có chi tiết danh sách nguyên liệu hoặc dị ứng toàn phần)
              </p>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5">
            <FontAwesomeIcon icon={faBan} className="mt-0.5 text-xs shrink-0" />
            <p className="leading-snug">
              Món này sẽ bị ẩn vĩnh viễn khỏi trang Tra cứu và Mini-games của bạn. Bạn luôn có thể gỡ bỏ trạng thái này trong <strong>Hồ sơ cá nhân</strong>.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting} className="rounded-xl">
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            {isSubmitting ? 'Đang lưu...' : 'Xác Nhận Dị Ứng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

