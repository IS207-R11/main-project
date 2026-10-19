'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faFire,
  faHeart,
  faUtensils,
  faArrowRight,
  faDroplet,
  faBrain,
  faBone,
  faShieldHeart,
  faLightbulb,
  faBookOpen,
  faAppleWhole,
  faBowlFood,
  faGamepad,
  faRotate,
} from '@fortawesome/free-solid-svg-icons';
import { MonNgonCard, type MonNgonDish } from '@/components/food/MonNgonCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

const QUICK_TAGS = [
  '20/10',
  'Món Chay',
  'Thực Đơn Hàng Ngày',
  'Ăn Kiêng',
  'Thực Đơn Dinh Dưỡng',
  'Ăn Vặt',
  'Món Tiệc',
];

const NUTRITION_CATEGORIES = [
  { id: 'bo_mau', label: 'Bổ máu', desc: 'Giàu sắt & vitamin', icon: faDroplet, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  { id: 'giam_mo', label: 'Giảm mỡ thừa', desc: 'Eat clean dưới 400 Kcal', icon: faFire, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'tri_nao', label: 'Làm việc trí não', desc: 'Omega-3 & dưỡng chất', icon: faBrain, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'gan', label: 'Hỗ trợ gan khỏe', desc: 'Thanh nhiệt giải độc', icon: faAppleWhole, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'than', label: 'Hỗ trợ thận khỏe', desc: 'Cân bằng natri khoáng', icon: faShieldHeart, color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  { id: 'co_xuong', label: 'Xây dựng cơ xương', desc: 'Giàu đạm & Canxi', icon: faBone, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
];

const TIPS_ITEMS = [
  { title: 'Cảm hứng từ đầu bếp', desc: 'Bí quyết nêm gia vị cân bằng 5 vị chua cay mặn ngọt chuẩn nhà hàng', icon: faUtensils, badge: 'Đầu Bếp' },
  { title: 'Mẹo hay nấu chuẩn', desc: 'Cách sơ chế lươn sạch nhớt và khử mùi tanh cá lóc cực đơn giản', icon: faLightbulb, badge: 'Mẹo Bếp' },
  { title: 'Thưởng thức dinh dưỡng', desc: 'Bảng quy đổi khẩu phần chuẩn Viện Dinh Dưỡng Quốc Gia', icon: faAppleWhole, badge: 'Dinh Dưỡng' },
  { title: 'Từ điển ẩm thực Việt', desc: 'Tìm hiểu các loại rau thơm và gia vị truyền thống ba miền', icon: faBookOpen, badge: 'Cẩm Nang' },
];

export const MonNgonHome: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.user_id || user?.id || 1;

  const [dishes, setDishes] = useState<MonNgonDish[]>([]);
  const [totalDishes, setTotalDishes] = useState<number>(2540);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');

  const fetchDishes = async (cat = activeCategory, keyword = searchKeyword) => {
    setLoading(true);
    try {
      let url = `/api/system-dishes?user_id=${userId}&limit=12&offset=0`;
      if (cat) url += `&category=${cat}`;
      if (keyword.trim()) url += `&search=${encodeURIComponent(keyword.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'success') {
        setDishes(data.data || []);
        if (data.total !== undefined) {
          setTotalDishes(data.total);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreDishes = async () => {
    if (loadingMore || dishes.length >= totalDishes) return;
    setLoadingMore(true);
    try {
      let url = `/api/system-dishes?user_id=${userId}&limit=12&offset=${dishes.length}`;
      if (activeCategory) url += `&category=${activeCategory}`;
      if (searchKeyword.trim()) url += `&search=${encodeURIComponent(searchKeyword.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        setDishes((prev) => [...prev, ...data.data]);
        if (data.total !== undefined) {
          setTotalDishes(data.total);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, [activeCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDishes(activeCategory, searchKeyword);
  };

  const handleQuickTagClick = (tag: string) => {
    setSearchKeyword(tag);
    fetchDishes(activeCategory, tag);
  };

  const handleCategorySelect = (catId: string) => {
    const nextCat = activeCategory === catId ? '' : catId;
    setActiveCategory(nextCat);
  };

  // Trending dishes: Top 4 by favourite_count
  const trendingDishes = [...dishes].sort((a, b) => b.favourite_count - a.favourite_count).slice(0, 4);

  return (
    <div className="w-full space-y-16 pb-20">
      {/* ================= 1. HERO BANNER & SEARCH (MON NGON STYLE) ================= */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-900 via-rose-800 to-amber-900 text-white shadow-xl">
        {/* Ambient culinary background texture */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 px-6 py-14 sm:py-20 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border border-white/20">
            <FontAwesomeIcon icon={faUtensils} className="text-amber-300 text-xs" />
            <span>Kho Tàng Ẩm Thực Ajinomoto & Viện Dinh Dưỡng</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
            Hơn {totalDishes > 0 ? totalDishes.toLocaleString('vi-VN') : '2.500'} Công Thức Món Ngon & Dễ Làm
          </h1>

          <p className="text-sm sm:text-base text-rose-100 max-w-xl mx-auto leading-relaxed">
            Khám phá thực đơn chuẩn vị mỗi ngày, tính toán dinh dưỡng chi tiết và tự động loại trừ nguyên liệu dị ứng của bạn.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center max-w-2xl mx-auto bg-white dark:bg-stone-900 rounded-full p-2 shadow-2xl border border-white/50 dark:border-stone-700 focus-within:ring-2 focus-within:ring-rose-400/50 transition-all"
          >
            <div className="pl-4 pr-2 text-rose-500 shrink-0">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-base" />
            </div>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Nhập món ngon đang tìm kiếm (VD: Sườn xào, Canh chua, Bò...)"
              className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-400 text-sm sm:text-base font-semibold focus:outline-none px-2 caret-rose-600"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 px-2 text-xs font-bold transition-colors cursor-pointer"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
            <Button
              type="submit"
              className="bg-primary hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-full shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Tìm Kiếm
            </Button>
          </form>

          {/* Quick Tag Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-rose-200 font-semibold mr-1">Tìm kiếm phổ biến:</span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className="text-xs font-medium bg-white/15 hover:bg-white/30 text-white px-3 py-1 rounded-full border border-white/25 backdrop-blur-sm transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 2. MÓN NGON XU HƯỚNG (TRENDING SECTION) ================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-600 font-black text-xs uppercase tracking-wider">
              <FontAwesomeIcon icon={faHeart} className="text-rose-500 animate-pulse" />
              <span>Được yêu thích nhất</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              Món Ngon <span className="text-primary">Xu Hướng</span>
            </h2>
          </div>
          <Link
            href="/tai-nguyen"
            className="text-xs font-bold text-primary hover:text-rose-700 flex items-center gap-1.5 transition-colors group"
          >
            <span>Xem thêm tất cả công thức</span>
            <FontAwesomeIcon icon={faArrowRight} className="text-[10px] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingDishes.map((dish) => (
              <MonNgonCard
                key={dish.id}
                dish={dish}
                userId={userId}
                onInteractionChange={() => fetchDishes()}
              />
            ))}
          </div>
        )}
      </section>

      {/* ================= 3. MÓN NGON MỚI RA LÒ (FRESH DISHES GRID) ================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-wider">
              <FontAwesomeIcon icon={faBowlFood} className="text-amber-500" />
              <span>Công thức mới cập nhật</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              Món Ngon <span className="text-primary">Mới Ra Lò</span>
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Hiển thị món ăn an toàn đã tự động lọc bỏ dị ứng của bạn
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-muted/60 animate-pulse" />
            ))}
          </div>
        ) : dishes.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-3xl border border-dashed border-border p-8 space-y-3">
            <FontAwesomeIcon icon={faUtensils} className="text-3xl text-muted-foreground/40" />
            <h3 className="font-bold text-foreground">Không tìm thấy món ăn phù hợp</h3>
            <p className="text-xs text-muted-foreground">
              Thử tìm kiếm với từ khóa khác hoặc kiểm tra lại bộ lọc dị ứng trong hồ sơ cá nhân.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dishes.map((dish) => (
                <MonNgonCard
                  key={dish.id}
                  dish={dish}
                  userId={userId}
                  onInteractionChange={() => fetchDishes()}
                />
              ))}
            </div>

            {dishes.length < totalDishes && (
              <div className="pt-6 text-center">
                <Button
                  variant="outline"
                  onClick={loadMoreDishes}
                  disabled={loadingMore}
                  className="rounded-full px-8 py-3 text-xs font-black border-primary/40 text-primary hover:bg-primary hover:text-white transition-all shadow-md cursor-pointer"
                >
                  <FontAwesomeIcon icon={faRotate} className={`mr-2 ${loadingMore ? 'animate-spin' : ''}`} />
                  <span>
                    {loadingMore
                      ? 'Đang tải thêm món ngon...'
                      : `Xem Thêm 12 Món Ngon (Còn lại ${(totalDishes - dishes.length).toLocaleString('vi-VN')} món)`}
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================= 4. INTERACTIVE BANNER: 30 GIÂY MINI-GAMES ================= */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-rose-600 to-amber-600 text-white p-8 sm:p-12 shadow-lg">
        <div className="max-w-2xl space-y-4">
          <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
            Chỉ 30 giây khám phá món ngon
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Khám Phá Thực Đơn Dành Riêng Cho Bạn
          </h2>
          <p className="text-xs sm:text-sm text-rose-100 leading-relaxed">
            Chưa biết hôm nay ăn gì? Trải nghiệm <strong>Quẹt thẻ phong cách Tinder</strong> hoặc <strong>Mở gói thẻ Gacha ẩm thực</strong> với thuật toán gợi ý loại bỏ 100% nguyên liệu bạn bị dị ứng!
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/mini-games?tab=tinder">
              <Button className="bg-white hover:bg-stone-100 text-rose-700 font-black text-xs px-6 py-2.5 rounded-full shadow-md active:scale-95 cursor-pointer">
                <FontAwesomeIcon icon={faFire} className="mr-1.5 text-xs text-rose-600" />
                Quẹt Món Tinder
              </Button>
            </Link>
            <Link href="/mini-games?tab=gacha">
              <Button className="bg-white hover:bg-stone-100 text-amber-900 font-black text-xs px-6 py-2.5 rounded-full shadow-md active:scale-95 cursor-pointer border-0">
                <FontAwesomeIcon icon={faGamepad} className="mr-1.5 text-xs text-amber-600" />
                Mở Gói Thẻ Gacha
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 5. THỰC ĐƠN DINH DƯỠNG (VIỆN DINH DƯỠNG QUỐC GIA) ================= */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-rose-600 font-black text-xs uppercase tracking-wider">
            <FontAwesomeIcon icon={faShieldHeart} className="text-rose-500" />
            <span>Tiêu chuẩn Viện Dinh Dưỡng</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Thực Đơn <span className="text-primary">Dinh Dưỡng</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Lựa chọn theo nhu cầu sức khỏe và thể trạng cơ thể của bạn
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {NUTRITION_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md scale-102'
                    : 'border-border/80 bg-card hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                <div className={`size-14 rounded-full flex items-center justify-center text-xl mb-3 border ${cat.color}`}>
                  <FontAwesomeIcon icon={cat.icon} />
                </div>
                <span className="font-extrabold text-xs text-foreground line-clamp-1">{cat.label}</span>
                <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{cat.desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= 6. MÁCH NHỎ TỪ ĐẦU BẾP ================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
              <FontAwesomeIcon icon={faLightbulb} className="text-amber-500" />
              <span>Góc chia sẻ kinh nghiệm</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Mách <span className="text-primary">Nhỏ</span> Từ Đầu Bếp
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIPS_ITEMS.map((tip, idx) => (
            <div
              key={idx}
              className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base">
                  <FontAwesomeIcon icon={tip.icon} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                  {tip.badge}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-foreground">{tip.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

