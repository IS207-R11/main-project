"use client";

import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotateLeft,
  faXmark,
  faStar,
  faHeart,
  faInfo,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";

interface TinderControlsProps {
  canUndo: boolean;
  onUndo: () => void;
  onNope: () => void;
  onSuperLike: () => void;
  onLike: () => void;
  onInfo: () => void;
  disabled?: boolean;
}

export const TinderControls: React.FC<TinderControlsProps> = ({
  canUndo,
  onUndo,
  onNope,
  onSuperLike,
  onLike,
  onInfo,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4.5 pt-4 pb-2 z-20">
      {/* 1. Rewind / Undo Button */}
      <motion.div whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.08 }}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo || disabled}
          className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full border-2 border-amber-400/70 bg-card text-amber-500 shadow-md transition-all cursor-pointer ${
            !canUndo
              ? "opacity-35 cursor-not-allowed border-muted-foreground/30 text-muted-foreground"
              : "hover:bg-amber-500/10 hover:border-amber-400 hover:shadow-amber-500/20"
          }`}
          title="Hoàn tác món vừa quẹt (Z)"
        >
          <FontAwesomeIcon icon={faRotateLeft} className="text-base sm:text-lg" />
        </Button>
      </motion.div>

      {/* 2. Nope / Pass Button */}
      <motion.div whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.08 }}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onNope}
          disabled={disabled}
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-rose-500/80 bg-card text-rose-500 shadow-lg hover:bg-rose-500/15 hover:border-rose-500 hover:shadow-rose-500/25 transition-all cursor-pointer"
          title="Bỏ qua món này (←)"
        >
          <FontAwesomeIcon icon={faXmark} className="text-2xl sm:text-3xl" />
        </Button>
      </motion.div>

      {/* 3. Super Like Button */}
      <motion.div whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.08 }}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onSuperLike}
          disabled={disabled}
          className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border-2 border-sky-400/80 bg-card text-sky-400 shadow-md hover:bg-sky-400/15 hover:border-sky-400 hover:shadow-sky-400/25 transition-all cursor-pointer"
          title="Siêu Thích & Chốt Ngay (↑)"
        >
          <FontAwesomeIcon icon={faStar} className="text-base sm:text-lg" />
        </Button>
      </motion.div>

      {/* 4. Like / Pick Now Button */}
      <motion.div whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.08 }}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onLike}
          disabled={disabled}
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-emerald-500/80 bg-card text-emerald-500 shadow-lg hover:bg-emerald-500/15 hover:border-emerald-500 hover:shadow-emerald-500/25 transition-all cursor-pointer"
          title="Chốt món ăn này (→)"
        >
          <FontAwesomeIcon icon={faHeart} className="text-2xl sm:text-3xl" />
        </Button>
      </motion.div>

      {/* 5. Info / Flip Button */}
      <motion.div whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.08 }}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onInfo}
          disabled={disabled}
          className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border-2 border-purple-400/70 bg-card text-purple-400 shadow-md hover:bg-purple-400/15 hover:border-purple-400 hover:shadow-purple-400/20 transition-all cursor-pointer"
          title="Xem thông tin chi tiết (Space)"
        >
          <FontAwesomeIcon icon={faInfo} className="text-base sm:text-lg" />
        </Button>
      </motion.div>
    </div>
  );
};
