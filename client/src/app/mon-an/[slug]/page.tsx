'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  faCheck,
  faLightbulb,
  faBowlRice,
  faArrowLeft,
  faShareNodes,
  faAppleWhole,
  faShieldHeart,
  faPlay,
  faPersonWalking,
  faPersonRunning,
  faBicycle,
  faCalculator,
  faPrint,
  faKitchenSet,
  faListCheck,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Helper to parse preparation text into structured bullet sentences
function parsePreparationText(text: string) {
  if (!text) return { intro: '', bullets: [] as string[] };

  const rawLines = text
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  let intro = '';
  const bullets: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    // Check if the first line is an introductory sentence ending with ':'
    if (
      i === 0 &&
      line.endsWith(':') &&
      (line.toLowerCase().includes('sơ chế') ||
        line.toLowerCase().includes('tham khảo') ||
        line.toLowerCase().includes('chuẩn bị') ||
        line.toLowerCase().includes('nguyên liệu'))
    ) {
      intro = line;
      continue;
    }

    const clean = line.replace(/^[-*•–—\s]+/, '').trim();
    if (!clean) continue;

    // Split sentences inside each paragraph/line by sentence ends (. ! ?) followed by uppercase/digit
    const sentences = clean
      .split(/(?<=[.!?])\s+(?=[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ\d])/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length > 0) {
      bullets.push(...sentences);
    } else {
      bullets.push(clean);
    }
  }

  return { intro, bullets };
}
import { AllergyActionModal } from '@/components/food/AllergyActionModal';
import { useAuth } from '@/context/AuthContext';

export default function DishDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { user } = useAuth();
  const userId = user?.user_id || user?.id || 1;

  const [dish, setDish] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavourited, setIsFavourited] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [isDisliked, setIsDisliked] = useState(false);
  const [allergyModalOpen, setAllergyModalOpen] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [showVideo, setShowVideo] = useState(false);

  const fetchDish = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/system-dishes/${slug}?user_id=${userId}`);
      const data = await res.json();
      if (data.status === 'success') {
        setDish(data.data);
        setIsFavourited(!!data.data.is_favourited);
        setFavCount(data.data.favourite_count || 0);
        setIsDisliked(!!data.data.is_disliked);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchDish();
  }, [slug]);

  const toggleCheck = (idx: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleFavourite = async () => {
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
      }
    } catch {
      setIsFavourited(!nextState);
      setFavCount((c) => (nextState ? c - 1 : c + 1));
    }
  };

  const handleDislike = async () => {
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
            ? `Đã ẩn món này khỏi gợi ý cá nhân của bạn.`
            : `Đã bỏ trạng thái không thích.`
        );
      }
    } catch {
      toast.error('Lỗi kết nối.');
    }
  };

  // Extract YouTube ID if video_url is present
  const youtubeEmbedUrl = useMemo(() => {
    const rawUrl = dish?.parsed_instructions?.video_url;
    if (!rawUrl) return null;
    const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
  }, [dish]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Không tìm thấy món ăn</h2>
        <Link href="/">
          <Button variant="outline" className="rounded-xl">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Quay về trang chủ
          </Button>
        </Link>
      </div>
    );
  }

  const parsed = dish.parsed_instructions || {};
  const servings = parseInt(String(parsed.servings || '4').replace(/\D/g, ''), 10) || 4;
  const cookTime = parsed.cook_time || parsed.prep_time || '25 phút';
  const difficulty = parsed.difficulty || 'Dễ';
  const totalCalo = Math.round(parseFloat(dish.total_calo) || 420);
  const caloPerServing = Math.round(totalCalo / servings);

  // Macro estimates (based on standard Vietnamese dietary distribution: 25% Protein, 28% Fat, 47% Carbs)
  const proteinGrams = Math.round((caloPerServing * 0.25) / 4);
  const fatGrams = Math.round((caloPerServing * 0.28) / 9);
  const carbsGrams = Math.round((caloPerServing * 0.47) / 4);
  const fiberGrams = Math.round(carbsGrams * 0.12) || 4;

  // Meal energy % based on standard 650 Kcal adult lunch/dinner
  const mealEnergyPercent = Math.min(100, Math.round((caloPerServing / 650) * 100));

  // Exercise burning estimates
  const walkMinutes = Math.round(caloPerServing / 4.5);
  const runMinutes = Math.round(caloPerServing / 9.5);
  const bikeMinutes = Math.round(caloPerServing / 7.2);

  // Unify Ingredients
  const ingredientsList: { name: string; amount: string; detail?: string }[] = [];
  if (Array.isArray(dish.ingredients) && dish.ingredients.length > 0) {
    dish.ingredients.forEach((ing: any) => {
      ingredientsList.push({
        name: ing.name,
        amount: ing.quantity_display || `${ing.weight_in_grams}g`,
      });
    });
  } else if (Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
    parsed.ingredients.forEach((line: string) => {
      const parts = line.split(/[\t:]+/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        ingredientsList.push({
          name: parts[0],
          amount: parts[1],
          detail: parts.slice(2).join(' '),
        });
      } else {
        ingredientsList.push({
          name: line.trim(),
          amount: '',
        });
      }
    });
  }

  // Unify Preparation
  const preparationText: string = parsed.preparation || parsed.so_che || '';
  const { intro: prepIntro, bullets: preparationBullets } = parsePreparationText(preparationText);

  // Unify Steps
  const rawSteps = parsed.steps || parsed.thuc_hien || [];
  const stepsList: { step: number; title: string; content: string }[] = [];
  if (Array.isArray(rawSteps)) {
    rawSteps.forEach((st: any, i: number) => {
      if (typeof st === 'string') {
        const colonIdx = st.indexOf(':');
        if (colonIdx > 0 && colonIdx < 30) {
          stepsList.push({
            step: i + 1,
            title: st.slice(0, colonIdx).trim(),
            content: st.slice(colonIdx + 1).trim(),
          });
        } else {
          stepsList.push({
            step: i + 1,
            title: `Bước ${i + 1}`,
            content: st.trim(),
          });
        }
      } else if (typeof st === 'object' && st !== null) {
        stepsList.push({
          step: st.step || i + 1,
          title: st.title || `Bước ${i + 1}`,
          content: st.content || st.text || '',
        });
      }
    });
  }

  // Unify Serving
  const servingText: string = parsed.serving || parsed.cach_dung || '';

  // Unify Chef Tips
  const tipsText: string = parsed.tips || parsed.mach_nho || parsed.expert_tip || '';

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-14 z-30">
        <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-2 overflow-hidden">
            <Link href="/" className="hover:text-primary transition-colors shrink-0">
              Trang Chủ
            </Link>
            <span>/</span>
            <Link href="/tai-nguyen" className="hover:text-primary transition-colors shrink-0">
              Món Ăn
            </Link>
            <span>/</span>
            <span className="text-foreground font-bold truncate max-w-[180px] sm:max-w-xs">{dish.title}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success('Đã sao chép liên kết công thức!');
              }}
              className="h-7 text-xs gap-1.5 rounded-full hover:bg-muted"
            >
              <FontAwesomeIcon icon={faShareNodes} className="text-xs" />
              <span className="hidden sm:inline">Chia sẻ</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.print()}
              className="h-7 text-xs gap-1.5 rounded-full hover:bg-muted hidden sm:inline-flex"
            >
              <FontAwesomeIcon icon={faPrint} className="text-xs" />
              <span>In</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 pt-8 space-y-10">
        {/* ================= 1. HEADER & QUICK STATS ================= */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-black text-xs px-3.5 py-1 rounded-full border border-primary/20">
            <FontAwesomeIcon icon={faUtensils} className="text-xs" />
            <span>Công Thức Chuẩn Hóa Món Ngon Mỗi Ngày</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
            {dish.title}
          </h1>

          {/* Quick Stats Pill Row */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 pt-1">
            <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-1.5 rounded-2xl text-xs font-semibold shadow-xs">
              <FontAwesomeIcon icon={faUsers} className="text-secondary text-xs" />
              <span>Khẩu phần: <strong className="text-foreground">{servings} người</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-1.5 rounded-2xl text-xs font-semibold shadow-xs">
              <FontAwesomeIcon icon={faClock} className="text-amber-500 text-xs" />
              <span>Thời gian: <strong className="text-foreground">{cookTime}</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-1.5 rounded-2xl text-xs font-semibold shadow-xs">
              <span className="text-emerald-500 font-bold">●</span>
              <span>Độ khó: <strong className="text-foreground">{difficulty}</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 px-3.5 py-1.5 rounded-2xl text-xs font-bold shadow-xs">
              <FontAwesomeIcon icon={faFire} className="text-rose-500 text-xs" />
              <span>Tổng calo: <strong>{totalCalo} Kcal</strong></span>
            </div>

            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-3.5 py-1.5 rounded-2xl text-xs font-bold shadow-xs">
              <FontAwesomeIcon icon={faCalculator} className="text-amber-500 text-xs" />
              <span>1 khẩu phần: <strong>{caloPerServing} Kcal</strong></span>
            </div>
          </div>
        </div>

        {/* ================= 2. HERO IMAGE & VIDEO PLAYER & ACTIONS ================= */}
        <div className="space-y-4">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-2xl bg-muted border border-border">
            {showVideo && youtubeEmbedUrl ? (
              <iframe
                src={youtubeEmbedUrl}
                title={dish.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img
                src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80'}
                alt={dish.title}
                className="h-full w-full object-cover"
              />
            )}

            {/* Video toggle badge if video_url exists */}
            {youtubeEmbedUrl && (
              <button
                type="button"
                onClick={() => setShowVideo(!showVideo)}
                className="absolute bottom-4 right-4 bg-black/80 hover:bg-black text-white px-4 py-2 rounded-2xl backdrop-blur-md text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <FontAwesomeIcon icon={faPlay} className="text-rose-500 text-xs" />
                <span>{showVideo ? 'Xem Ảnh Món Ăn' : 'Xem Video Hướng Dẫn'}</span>
              </button>
            )}
          </div>

          {/* Action Row: Favourite, Dislike, Allergy */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card rounded-2xl border border-border shadow-xs">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleFavourite}
                className={`rounded-2xl gap-2 font-black text-xs px-5 py-2.5 shadow-sm transition-all cursor-pointer ${
                  isFavourited
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-primary hover:bg-rose-700 text-white'
                }`}
              >
                <FontAwesomeIcon icon={isFavourited ? faHeartSolid : faHeartRegular} />
                <span>{isFavourited ? 'Đã Lưu Công Thức' : 'Lưu Công Thức'}</span>
                <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-[11px]">
                  {favCount}
                </span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDislike}
                className={`rounded-2xl text-xs font-semibold gap-1.5 ${
                  isDisliked ? 'bg-rose-500/15 border-rose-500 text-rose-500' : 'border-border'
                }`}
                title="Ẩn món này khỏi danh sách gợi ý của bạn"
              >
                <FontAwesomeIcon icon={faThumbsDown} className="text-xs" />
                <span>{isDisliked ? 'Đã Không Thích' : 'Không Thích'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllergyModalOpen(true)}
                className={`rounded-2xl text-xs font-semibold gap-1.5 ${
                  dish.is_allergic ? 'bg-amber-500/15 border-amber-500 text-amber-600' : 'border-border'
                }`}
                title="Báo dị ứng để tự động loại trừ mọi món tương tự"
              >
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-xs text-amber-500" />
                <span>Báo Dị Ứng</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ================= 3. MÔ TẢ (DESCRIPTION) ================= */}
        {parsed.description && (
          <section className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
              <FontAwesomeIcon icon={faUtensils} />
              <span>Mô Tả Hương Vị Món Ăn</span>
            </div>
            <div className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line border-l-4 border-primary pl-4 py-1 italic">
              {parsed.description}
            </div>
          </section>
        )}

        {/* ================= 4. NGUYÊN LIỆU (INGREDIENTS CHECKLIST) ================= */}
        <section className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/80 pb-3 gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                <FontAwesomeIcon icon={faListCheck} className="text-primary" />
                Nguyên Liệu Chuẩn Bị
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Định lượng chuẩn cho khẩu phần <strong>{servings} người ăn</strong>
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-medium self-start sm:self-center">
              (Chạm vào để đánh dấu đã mua)
            </span>
          </div>

          {/* Unit Convention Notice Box: M = muỗng canh, m = muỗng cafe */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-950 dark:text-amber-200 shadow-2xs">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
              <FontAwesomeIcon icon={faCircleInfo} className="text-amber-500 text-sm shrink-0" />
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-foreground">Lưu ý quy ước:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-card/90 border border-amber-500/30 text-xs font-bold shadow-2xs">
                  <span className="text-rose-600 font-black text-sm">M</span>: muỗng canh <span className="text-[11px] text-muted-foreground font-normal">(~15ml)</span>
                </span>
                <span className="text-muted-foreground font-bold">-</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-card/90 border border-amber-500/30 text-xs font-bold shadow-2xs">
                  <span className="text-amber-600 dark:text-amber-400 font-black text-sm">m</span>: muỗng cafe <span className="text-[11px] text-muted-foreground font-normal">(~5ml)</span>
                </span>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium hidden md:inline">
              Quy chuẩn nêm nếm Món Ngon Mỗi Ngày
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ingredientsList.map((ing, idx) => {
              const isChecked = !!checkedIngredients[idx];
              const isBigSpoon = Boolean(
                ing.amount &&
                (ing.amount.endsWith('M') || (ing.amount.includes('M') && !ing.amount.includes('m')))
              );
              const isSmallSpoon = Boolean(
                ing.amount &&
                (ing.amount.endsWith('m') || (ing.amount.includes('m') && !ing.amount.includes('ml') && !ing.amount.includes('muỗng')))
              );

              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? 'bg-muted/40 border-border/50 text-muted-foreground line-through'
                      : 'bg-card border-border hover:border-primary/50 text-foreground font-semibold shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-5 rounded-lg border flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-primary border-primary text-white' : 'border-border bg-card'
                      }`}
                    >
                      {isChecked && <FontAwesomeIcon icon={faCheck} className="text-[10px]" />}
                    </div>
                    <span className="text-sm leading-tight">{ing.name}</span>
                  </div>
                  {ing.amount && (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ml-2 border transition-all ${
                        isBigSpoon
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                          : isSmallSpoon
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                      title={
                        isBigSpoon
                          ? `${ing.amount}: M là muỗng canh (~15ml)`
                          : isSmallSpoon
                          ? `${ing.amount}: m là muỗng cafe (~5ml)`
                          : ing.amount
                      }
                    >
                      {ing.amount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= 5. SƠ CHẾ (PREPARATION) ================= */}
        {(preparationBullets.length > 0 || preparationText) && (
          <section className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-4">
            <div className="border-b border-border/80 pb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faKitchenSet} className="text-amber-500 text-lg" />
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  Sơ Chế & Ướp Gia Vị
                </h2>
              </div>
              {preparationBullets.length > 0 && (
                <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/50">
                  {preparationBullets.length} bước sơ chế
                </span>
              )}
            </div>

            {prepIntro && (
              <p className="text-sm italic text-muted-foreground bg-muted/30 px-4 py-2.5 rounded-2xl border border-border/60">
                {prepIntro}
              </p>
            )}

            {preparationBullets.length > 0 ? (
              <div className="space-y-2.5">
                {preparationBullets.map((bullet, idx) => {
                  const colonIdx = bullet.indexOf(':');
                  const hasLabel =
                    colonIdx > 0 && colonIdx <= 35 && !bullet.slice(0, colonIdx).includes('http');
                  const label = hasLabel ? bullet.slice(0, colonIdx + 1) : '';
                  const body = hasLabel ? bullet.slice(colonIdx + 1).trim() : bullet;

                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-2xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/40"
                    >
                      <span className="text-primary font-black text-base select-none shrink-0 mt-0.5 leading-none">
                        –
                      </span>
                      <div className="flex-1 text-sm sm:text-base text-foreground leading-relaxed">
                        {hasLabel ? (
                          <>
                            <strong className="font-extrabold text-foreground mr-1.5">
                              {label}
                            </strong>
                            <span>{body}</span>
                          </>
                        ) : (
                          <span>{bullet}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line space-y-2">
                {preparationText}
              </div>
            )}
          </section>
        )}

        {/* ================= 6. THỰC HIỆN (COOKING STEPS) ================= */}
        {stepsList.length > 0 && (
          <section className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-6">
            <div className="border-b border-border/80 pb-3 flex items-center gap-2">
              <span className="size-3 rounded-full bg-primary" />
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Các Bước Thực Hiện
              </h2>
            </div>

            <div className="space-y-6">
              {stepsList.map((st, idx) => (
                <div key={idx} className="flex gap-4 sm:gap-6 items-start">
                  <div className="size-9 rounded-2xl bg-gradient-to-br from-primary to-rose-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md mt-0.5">
                    {st.step}
                  </div>
                  <div className="space-y-1.5 flex-1 pt-1">
                    <h3 className="font-extrabold text-base text-foreground">
                      {st.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {st.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================= 7. CÁCH DÙNG (SERVING SUGGESTION) ================= */}
        {servingText && (
          <section className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-4">
            <div className="border-b border-border/80 pb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faBowlRice} className="text-rose-500 text-lg" />
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Cách Dùng & Trình Bày
              </h2>
            </div>
            <div className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
              {servingText}
            </div>
          </section>
        )}

        {/* ================= 8. MÁCH NHỎ TỪ ĐẦU BẾP (CHEF'S TIPS) ================= */}
        {tipsText && (
          <section className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm uppercase tracking-wider">
              <FontAwesomeIcon icon={faLightbulb} className="text-amber-500 text-base" />
              <span>Mách Nhỏ Từ Đầu Bếp Ajinomoto</span>
            </div>
            <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-line">
              {tipsText}
            </p>
          </section>
        )}

        {/* ================= 9. BẢNG TÍNH TOÁN CALO & DINH DƯỠNG CHI TIẾT ================= */}
        <section className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-md space-y-6">
          <div className="border-b border-border/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-rose-600 font-black text-xs uppercase tracking-wider">
                <FontAwesomeIcon icon={faShieldHeart} />
                <span>Tiêu Chuẩn Viện Dinh Dưỡng Quốc Gia</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                Bảng Phân Tích Dinh Dưỡng & Năng Lượng Calo
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Công thức chuẩn hóa: <code>T = Σ [Wi × (1 - Ri) × (Ni / 100)]</code>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Badge className="bg-rose-600 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-xs">
                Tổng: {totalCalo} Kcal
              </Badge>
              <Badge className="bg-amber-600 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-xs">
                1 phần: {caloPerServing} Kcal
              </Badge>
            </div>
          </div>

          {/* Macro Breakdown 4 Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                Chất Đạm (Protein)
              </span>
              <p className="text-2xl font-black text-foreground">{proteinGrams}g</p>
              <span className="text-[10px] text-muted-foreground font-medium">~25% năng lượng</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Chất Béo (Fat)
              </span>
              <p className="text-2xl font-black text-foreground">{fatGrams}g</p>
              <span className="text-[10px] text-muted-foreground font-medium">~28% năng lượng</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center space-y-1">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                Tinh Bột (Carbs)
              </span>
              <p className="text-2xl font-black text-foreground">{carbsGrams}g</p>
              <span className="text-[10px] text-muted-foreground font-medium">~47% năng lượng</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                Chất Xơ (Fiber)
              </span>
              <p className="text-2xl font-black text-foreground">{fiberGrams}g</p>
              <span className="text-[10px] text-muted-foreground font-medium">Hỗ trợ tiêu hóa</span>
            </div>
          </div>

          {/* Energy Progress Bar for 1 meal */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span>Mức năng lượng trên 1 bữa chính tiêu chuẩn (650 Kcal):</span>
              <span className="text-primary font-black">{mealEnergyPercent}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-500"
                style={{ width: `${mealEnergyPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {mealEnergyPercent <= 60
                ? '🟢 Món ăn thanh nhẹ, ít calo, cực kỳ thích hợp cho chế độ ăn kiêng, eat clean hoặc giữ dáng.'
                : mealEnergyPercent <= 100
                ? '🟡 Mức năng lượng cân bằng lý tưởng cho bữa ăn chính đầy đủ dưỡng chất.'
                : '🔴 Món ăn năng lượng dồi dào, thích hợp cho người vận động thể thao hoặc bữa ăn sum họp thịnh soạn.'}
            </p>
          </div>

          {/* Detailed Ingredient Nutrition Table */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <div className="pt-2 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCalculator} className="text-primary" />
                <span>Chi Tiết Năng Lượng Từng Nguyên Liệu (Viện Dinh Dưỡng):</span>
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider bg-muted/50">
                      <th className="py-2.5 px-3">Nguyên Liệu</th>
                      <th className="py-2.5 px-3 text-center">Khối Lượng (g)</th>
                      <th className="py-2.5 px-3 text-center">Thải Bỏ (%)</th>
                      <th className="py-2.5 px-3 text-center">Calo / 100g</th>
                      <th className="py-2.5 px-3 text-right">Năng Lượng (Kcal)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {dish.ingredients.map((ing: any, i: number) => {
                      const w = parseFloat(ing.weight_in_grams) || 50;
                      const r = parseFloat(ing.refuse_rate) || 5;
                      const n = parseFloat(ing.calo_per_100g) || 100;
                      const itemCalo = Math.round(w * (1.0 - r / 100.0) * (n / 100.0) * 10) / 10;
                      return (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-semibold text-foreground">{ing.name}</td>
                          <td className="py-2.5 px-3 text-center text-muted-foreground">{w}g</td>
                          <td className="py-2.5 px-3 text-center text-muted-foreground">{r}%</td>
                          <td className="py-2.5 px-3 text-center text-muted-foreground">{n} Kcal</td>
                          <td className="py-2.5 px-3 text-right font-bold text-primary">{itemCalo} Kcal</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border font-extrabold bg-muted/30">
                      <td colSpan={4} className="py-3 px-3 text-right text-foreground">Tổng Năng Lượng Món Ăn:</td>
                      <td className="py-3 px-3 text-right text-sm text-primary font-black">{totalCalo} Kcal</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Activity Burning Estimates */}
          <div className="pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faFire} className="text-amber-500" />
              <span>Thời Gian Hoạt Động Tiêu Hao 1 Khẩu Phần ({caloPerServing} Kcal):</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0">
                  <FontAwesomeIcon icon={faPersonWalking} />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Đi bộ nhanh</span>
                  <strong className="text-sm text-foreground">{walkMinutes} phút</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border">
                <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg shrink-0">
                  <FontAwesomeIcon icon={faPersonRunning} />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Chạy bộ vừa</span>
                  <strong className="text-sm text-foreground">{runMinutes} phút</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border">
                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg shrink-0">
                  <FontAwesomeIcon icon={faBicycle} />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Đạp xe</span>
                  <strong className="text-sm text-foreground">{bikeMinutes} phút</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Allergy Modal */}
      <AllergyActionModal
        isOpen={allergyModalOpen}
        onClose={() => setAllergyModalOpen(false)}
        dish={dish}
        userId={userId}
        onConfirmSuccess={() => fetchDish()}
      />
    </div>
  );
}
