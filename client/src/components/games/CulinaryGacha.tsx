'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFire,
  faUtensils,
  faHeart,
  faTriangleExclamation,
  faRotate,
  faArrowLeft,
  faGift,
  faSun,
  faLeaf,
  faBowlRice,
  faDice,
  faSliders,
  faFilter,
  faCheck,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { BoosterPack, GachaVortex, RevealAnimation } from '@/components/gacha';
import { GameSettingsDialog } from '@/components/home/GameSettingsDialog';
import { AllergyActionModal } from '@/components/food/AllergyActionModal';
import { useAuth } from '@/context/AuthContext';
import { useGameSettings } from '@/context/GameSettingsContext';
import type { Rarity, DietaryFilter, PriceFilter, SessionFilter } from '@/types/food';

const PACK_THEMES = [
  { id: 'random', label: 'Ngẫu Nhiên Hôm Nay Ăn Gì', desc: 'Bất ngờ theo khẩu vị yêu thích', icon: faDice, color: 'from-indigo-500 to-purple-600' },
  { id: 'breakfast', label: 'Bữa Sáng Nhanh Gọn', desc: 'Dưới 15 phút, đủ năng lượng', icon: faSun, color: 'from-amber-500 to-orange-500' },
  { id: 'clean_eat', label: 'Eat Clean Dưới 400 Kcal', desc: 'Ít calo, thanh đạm, thon gọn', icon: faLeaf, color: 'from-emerald-500 to-teal-500' },
  { id: 'family', label: 'Bữa Tối Gia Đình', desc: 'Món mặn, món canh ấm cúng', icon: faBowlRice, color: 'from-rose-500 to-red-600' },
];

type GachaState = 'pack' | 'vortex' | 'opening' | 'revealed';

export const CulinaryGacha: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.user_id || user?.id || 1;
  const { gachaSettings } = useGameSettings();

  // Settings State
  const [selectedPack, setSelectedPack] = useState('random');
  const [dishCount, setDishCount] = useState<number>(3);
  const [selectedDiet, setSelectedDiet] = useState<DietaryFilter>('all');
  const [selectedPrice, setSelectedPrice] = useState<PriceFilter>('all');
  const [selectedSession, setSelectedSession] = useState<SessionFilter>('auto');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Gacha Stage State
  const [gachaState, setGachaState] = useState<GachaState>('pack');
  const [isOpening, setIsOpening] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [highestRarity, setHighestRarity] = useState<Rarity>('C');
  const [activeAllergyDish, setActiveAllergyDish] = useState<any>(null);
  const [allergyModalOpen, setAllergyModalOpen] = useState(false);

  const handleStartGacha = async () => {
    try {
      setIsOpening(true);
      setGachaState('vortex');
      setCards([]);
      setFlippedCards({});

      const minVortexDuration = 1800;
      const vortexTimer = new Promise((resolve) => setTimeout(resolve, minVortexDuration));

      const resPromise = fetch('/api/mini-games/gacha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          pack_type: selectedPack,
          dish_count: dishCount,
          dietary: selectedDiet !== 'all' ? selectedDiet : gachaSettings.dietary,
          session: selectedSession,
          price: selectedPrice,
        }),
      }).then((r) => r.json());

      const [data] = await Promise.all([resPromise, vortexTimer]);

      if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
        const fetchedCards = data.data;

        // Compute highest rarity based on favourite_count
        let topRarity: Rarity = 'C';
        for (const c of fetchedCards) {
          const fav = c.favourite_count || 0;
          let r: Rarity = 'C';
          if (fav >= 120) r = 'SSR';
          else if (fav >= 70) r = 'SR';
          else if (fav >= 30) r = 'UC';

          if (r === 'SSR') {
            topRarity = 'SSR';
            break;
          } else if (r === 'SR' && topRarity !== 'SSR') {
            topRarity = 'SR';
          } else if (r === 'UC' && topRarity === 'C') {
            topRarity = 'UC';
          }
        }

        setHighestRarity(topRarity);
        setCards(fetchedCards);
        setGachaState('opening');
      } else {
        toast.error(data.message || 'Không tìm thấy món ăn phù hợp với bộ lọc hiện tại.');
        setGachaState('pack');
      }
    } catch {
      toast.error('Lỗi kết nối khi mở gói thẻ bài.');
      setGachaState('pack');
    } finally {
      setIsOpening(false);
    }
  };

  const handleRevealFinished = useCallback(() => {
    setGachaState('revealed');
  }, []);

  const handleResetToPack = useCallback(() => {
    setGachaState('pack');
    setCards([]);
    setFlippedCards({});
  }, []);

  const handleFlipCard = (index: number) => {
    setFlippedCards((prev) => ({ ...prev, [index]: true }));
  };

  const handleFlipAll = () => {
    const allFlipped: Record<number, boolean> = {};
    cards.forEach((_, i) => {
      allFlipped[i] = true;
    });
    setFlippedCards(allFlipped);
  };

  const handleFavourite = async (dish: any) => {
    try {
      await fetch('/api/system-dishes/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          dish_id: dish.id,
          interaction_type: 'FAVOURITE',
        }),
      });
      toast.success(`Đã lưu "${dish.title}" vào mục yêu thích!`);
    } catch {
      toast.error('Lỗi kết nối.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none">
      {/* ================= 1. GACHA VORTEX ANIMATION STAGE ================= */}
      {gachaState === 'vortex' && (
        <GachaVortex onCancel={() => setGachaState('pack')} />
      )}

      {/* ================= 2. REVEAL ANIMATION STAGE ================= */}
      {gachaState === 'opening' && (
        <RevealAnimation
          highestRarity={highestRarity}
          onFinish={handleRevealFinished}
          foodName={cards[0]?.title}
        />
      )}

      {/* ================= 3. SETTINGS & BOOSTER PACK VIEW ================= */}
      {gachaState !== 'revealed' && (
        <div className="space-y-6">
          {/* Settings Control Panel */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-amber-500 text-sm" />
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Cài Đặt Bộ Lọc Gacha Ẩm Thực
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsModalOpen(true)}
                className="h-8 rounded-xl text-xs font-bold gap-1.5 border-border bg-card text-foreground hover:bg-muted cursor-pointer"
              >
                <FontAwesomeIcon icon={faSliders} className="text-xs text-amber-500" />
                <span>Cài Đặt Nâng Cao</span>
              </Button>
            </div>

            {/* Quick Filter Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Number of dishes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Số thẻ rút</label>
                <div className="flex gap-1 bg-muted/60 p-1 rounded-2xl border border-border/40">
                  {[1, 3, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setDishCount(cnt)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        dishCount === cnt
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {cnt} món
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Chế độ ăn</label>
                <select
                  value={selectedDiet}
                  onChange={(e) => setSelectedDiet(e.target.value as DietaryFilter)}
                  className="w-full bg-background border border-border text-foreground text-xs font-semibold rounded-2xl p-2.5 focus:ring-2 focus:ring-primary focus:outline-hidden shadow-xs cursor-pointer"
                >
                  <option value="all">Tất Cả Chế Độ</option>
                  <option value="veg">🌱 Món Chay</option>
                  <option value="meat">🍖 Món Mặn</option>
                </select>
              </div>

              {/* Price / Calo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Mức năng lượng / Calo</label>
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value as PriceFilter)}
                  className="w-full bg-background border border-border text-foreground text-xs font-semibold rounded-2xl p-2.5 focus:ring-2 focus:ring-primary focus:outline-hidden shadow-xs cursor-pointer"
                >
                  <option value="all">Tất Cả Mức Calo</option>
                  <option value="under_50">&lt; 400 Kcal (Eat Clean)</option>
                  <option value="50_80">400 - 550 Kcal (Tiêu Chuẩn)</option>
                  <option value="80_120">&gt; 550 Kcal (Giàu Năng Lượng)</option>
                </select>
              </div>

              {/* Meal Session */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Khung giờ ăn</label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value as SessionFilter)}
                  className="w-full bg-background border border-border text-foreground text-xs font-semibold rounded-2xl p-2.5 focus:ring-2 focus:ring-primary focus:outline-hidden shadow-xs cursor-pointer"
                >
                  <option value="auto">Tự Động Theo Giờ</option>
                  <option value="Sáng sớm">Sáng sớm</option>
                  <option value="Giữa trưa">Giữa trưa</option>
                  <option value="Chiều">Chiều</option>
                  <option value="Tối">Tối</option>
                  <option value="all">Tất Cả Khung Giờ</option>
                </select>
              </div>
            </div>

            {/* Pack Themes Grid */}
            <div className="pt-2">
              <label className="text-xs font-bold text-muted-foreground block mb-2">
                Chủ đề gói quà gợi ý:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PACK_THEMES.map((pack) => {
                  const isSelected = selectedPack === pack.id;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => setSelectedPack(pack.id)}
                      className={`relative p-3.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer overflow-hidden ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-500/30 bg-card shadow-md scale-102'
                          : 'border-border bg-card/60 hover:bg-card hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className={`size-8 rounded-xl bg-gradient-to-br ${pack.color} text-white flex items-center justify-center text-sm shadow-xs shrink-0`}>
                          <FontAwesomeIcon icon={pack.icon} />
                        </div>
                        <h4 className="font-bold text-xs text-foreground line-clamp-1">{pack.label}</h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{pack.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Booster Pack Animated Container */}
          <div className="py-2 flex flex-col items-center justify-center">
            <BoosterPack
              onOpen={handleStartGacha}
              count={dishCount}
              isOpening={isOpening}
            />
          </div>
        </div>
      )}

      {/* ================= 4. REVEALED CARDS RESULTS ================= */}
      {gachaState === 'revealed' && cards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-card border border-border shadow-md">
            <div>
              <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-wider">
                <FontAwesomeIcon icon={faStar} />
                <span>Gợi Ý Thành Công ({cards.length} Thẻ Món)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                Mở Gói Món Ăn Hoàn Tất
              </h3>
              <p className="text-xs text-muted-foreground">
                Chạm vào từng thẻ bài để lật mở công thức và dinh dưỡng
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFlipAll}
                className="text-xs font-bold rounded-xl h-9"
              >
                Lật Mở Tất Cả
              </Button>
              <Button
                onClick={handleResetToPack}
                className="text-xs font-black rounded-xl h-9 bg-amber-600 hover:bg-amber-700 text-white gap-1.5 cursor-pointer shadow-md"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Mở Gói Khác</span>
              </Button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((dish, idx) => {
              const isFlipped = !!flippedCards[idx];
              const fav = dish.favourite_count || 0;
              let rarity: Rarity = 'C';
              if (fav >= 120) rarity = 'SSR';
              else if (fav >= 70) rarity = 'SR';
              else if (fav >= 30) rarity = 'UC';

              const rarityColors: Record<Rarity, string> = {
                SSR: 'from-amber-500 to-yellow-600 border-amber-400 text-amber-100',
                SR: 'from-purple-600 to-indigo-600 border-purple-400 text-purple-100',
                UC: 'from-sky-500 to-blue-600 border-sky-400 text-sky-100',
                C: 'from-emerald-600 to-teal-700 border-emerald-400 text-emerald-100',
              };

              if (!isFlipped) {
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleFlipCard(idx)}
                    className={`aspect-[3/4] max-h-[390px] rounded-3xl bg-gradient-to-br ${rarityColors[rarity]} border-2 shadow-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:scale-104 transition-all`}
                  >
                    <div className="size-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl mb-3 shadow-inner">
                      <FontAwesomeIcon icon={faUtensils} className="text-white drop-shadow-md" />
                    </div>
                    <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded-full bg-black/30 font-black mb-1">
                      {rarity} Rank
                    </span>
                    <span className="font-black text-lg tracking-wider uppercase text-white">
                      Thẻ Món #{idx + 1}
                    </span>
                    <span className="text-xs text-white/80 mt-1">Chạm để lật mở</span>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{ duration: 0.3 }}
                  className="aspect-[3/4] max-h-[390px] rounded-3xl bg-card border border-border shadow-lg flex flex-col justify-between overflow-hidden"
                >
                  <div className="relative h-[55%] w-full overflow-hidden bg-muted">
                    <img
                      src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                      alt={dish.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className="bg-black/70 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        <FontAwesomeIcon icon={faFire} className="mr-1 text-amber-400" />
                        {Math.round(dish.total_calo)} Kcal
                      </span>
                      <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        {rarity}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <Link href={`/mon-an/${dish.slug}`}>
                        <h4 className="font-extrabold text-sm text-foreground hover:text-primary transition-colors line-clamp-1">
                          {dish.title}
                        </h4>
                      </Link>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                        {dish.parsed_instructions?.description || dish.instructions}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleFavourite(dish)}
                          className="size-7 rounded-xl border border-border text-rose-500 hover:bg-rose-500/10 flex items-center justify-center text-xs"
                          title="Lưu yêu thích"
                        >
                          <FontAwesomeIcon icon={faHeart} />
                        </button>
                        <button
                          onClick={() => {
                            setActiveAllergyDish(dish);
                            setAllergyModalOpen(true);
                          }}
                          className="size-7 rounded-xl border border-border text-amber-600 hover:bg-amber-500/10 flex items-center justify-center text-xs"
                          title="Báo dị ứng"
                        >
                          <FontAwesomeIcon icon={faTriangleExclamation} />
                        </button>
                      </div>

                      <Link href={`/mon-an/${dish.slug}`}>
                        <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold rounded-xl text-primary border-primary/40">
                          Xem Công Thức
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Advanced Game Settings Modal */}
      <GameSettingsDialog
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        activeTab="gacha"
      />

      {/* Allergy Modal */}
      <AllergyActionModal
        isOpen={allergyModalOpen}
        onClose={() => setAllergyModalOpen(false)}
        dish={activeAllergyDish}
        userId={userId}
        onConfirmSuccess={() => {}}
      />
    </div>
  );
};
