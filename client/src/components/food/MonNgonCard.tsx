'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart as faHeartSolid,
  faFire,
  faClock,
  faUsers,
  faUtensils,
  faThumbsDown,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AllergyActionModal } from './AllergyActionModal';

export interface MonNgonDish {
  id: number;
  title: string;
  slug: string;
  image_url: string | null;
  instructions: string;
  total_calo: number;
  favourite_count: number;
  source_url?: string;
  is_favourited?: boolean;
  is_disliked?: boolean;
  is_allergic?: boolean;
  ingredients?: any[];
  parsed_instructions?: {
    prep_time?: string;
    cook_time?: string;
    servings?: number;
    difficulty?: string;
    description?: string;
  };
}

interface MonNgonCardProps {
  dish: MonNgonDish;
  userId?: number;
  onInteractionChange?: () => void;
}

export const MonNgonCard: React.FC<MonNgonCardProps> = ({ dish, userId = 1, onInteractionChange }) => {
  const [isFavourited, setIsFavourited] = useState<boolean>(!!dish.is_favourited);
  const [favCount, setFavCount] = useState<number>(dish.favourite_count || 0);
  const [allergyModalOpen, setAllergyModalOpen] = useState(false);
  const [isDisliked, setIsDisliked] = useState<boolean>(!!dish.is_disliked);

  const parsed = dish.parsed_instructions || {};
  const servings = parsed.servings || 4;
  const cookTime = parsed.cook_time || '15 phút';
  const difficulty = parsed.difficulty || 'Dễ';

  const handleFavourite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isFavourited;
    setIsFavourited(nextState);
    setFavCount((c) => (nextState ? c + 1 : Math.max(0, c - 1)));

    try {
      const res = await fetch('/api/system-dishes/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          dish_id: dish.id,
          interaction_type: 'FAVOURITE',
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success(
          data.active
            ? `Đã lưu "${dish.title}" vào mục Món ăn yêu thích!`
            : `Đã bỏ yêu thích món "${dish.title}".`
        );
        onInteractionChange?.();
      }
    } catch {
      setIsFavourited(!nextState);
      setFavCount((c) => (nextState ? c - 1 : c + 1));
      toast.error('Lỗi kết nối khi cập nhật yêu thích.');
    }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch('/api/system-dishes/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          dish_id: dish.id,
          interaction_type: 'DISLIKE',
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsDisliked(data.active);
        toast.info(
          data.active
            ? `Đã ẩn món "${dish.title}" khỏi gợi ý của bạn.`
            : `Đã bỏ trạng thái Không thích với món "${dish.title}".`
        );
        onInteractionChange?.();
      }
    } catch {
      toast.error('Lỗi kết nối.');
    }
  };

  return (
    <>
      <div className="group relative flex flex-col bg-card rounded-2xl border border-border/80 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden hover:-translate-y-1">
        {/* Dish Thumbnail */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <img
            src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
            alt={dish.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-106"
            loading="lazy"
          />

          {/* Badge Món Ngon */}
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-primary/95 text-white font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <FontAwesomeIcon icon={faUtensils} className="text-[9px]" />
              Món Ngon
            </span>
          </div>

          {/* Calo pill */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="bg-black/70 backdrop-blur-md text-amber-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <FontAwesomeIcon icon={faFire} className="text-[10px] text-amber-400" />
              {Math.round(dish.total_calo)} Kcal
            </span>
          </div>

          {/* Favourite Button (Top Right) */}
          <button
            onClick={handleFavourite}
            className="absolute top-2.5 right-2.5 size-8.5 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md flex items-center justify-center text-rose-500 shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Lưu vào món yêu thích"
          >
            <FontAwesomeIcon
              icon={isFavourited ? faHeartSolid : faHeartRegular}
              className={`text-sm ${isFavourited ? 'text-rose-500' : 'text-stone-400 hover:text-rose-500'}`}
            />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col p-4 justify-between space-y-3">
          <div>
            <Link href={`/mon-an/${dish.slug}`}>
              <h3 className="font-extrabold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                {dish.title}
              </h3>
            </Link>

            {/* Quick Metadata: Khẩu phần, Độ khó, Thời gian */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 font-medium">
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faUsers} className="text-[10px] text-secondary" />
                {servings} người
              </span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{difficulty}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} className="text-[10px] text-amber-500" />
                {cookTime}
              </span>
            </div>
          </div>

          {/* Action Row & Detail CTA */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
            {/* Quick Private Action Buttons: Dislike & Allergy */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDislike}
                className={`size-7.5 rounded-xl border flex items-center justify-center text-xs transition-colors cursor-pointer ${
                  isDisliked
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                    : 'border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
                title="Không thích món này (Riêng tư)"
              >
                <FontAwesomeIcon icon={faThumbsDown} className="text-[11px]" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAllergyModalOpen(true);
                }}
                className={`size-7.5 rounded-xl border flex items-center justify-center text-xs transition-colors cursor-pointer ${
                  dish.is_allergic
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-600'
                    : 'border-border/80 hover:bg-muted text-muted-foreground hover:text-amber-600'
                }`}
                title="Báo dị ứng món này (Riêng tư)"
              >
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-[11px]" />
              </button>
            </div>

            {/* View Detail Button */}
            <Link href={`/mon-an/${dish.slug}`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs font-bold border-primary/40 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
              >
                XEM CHI TIẾT
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Allergy Modal */}
      <AllergyActionModal
        isOpen={allergyModalOpen}
        onClose={() => setAllergyModalOpen(false)}
        dish={dish}
        userId={userId}
        onConfirmSuccess={() => {
          onInteractionChange?.();
        }}
      />
    </>
  );
};

