'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire, faDice, faUtensils } from '@fortawesome/free-solid-svg-icons';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CulinaryTinder } from '@/components/games/CulinaryTinder';
import { CulinaryGacha } from '@/components/games/CulinaryGacha';

function MiniGamesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'tinder' | 'gacha'>(
    tabParam === 'gacha' ? 'gacha' : 'tinder'
  );

  useEffect(() => {
    if (tabParam === 'tinder' || tabParam === 'gacha') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'tinder' | 'gacha') => {
    setActiveTab(tab);
    router.replace(`/mini-games?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Page Header */}
      <section className="border-b border-border bg-card/60 backdrop-blur-md py-10 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl text-center space-y-3">
          <Badge className="bg-primary/10 text-primary font-black px-3.5 py-1 rounded-full border border-primary/20 text-xs shadow-xs">
            <FontAwesomeIcon icon={faUtensils} className="mr-1.5 text-xs" />
            <span>Gợi Ý Món Ăn Tương Tác 2026</span>
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            Hôm Nay Bạn Muốn Ăn Gì?
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Hệ thống gợi ý thông minh dựa trên kho dữ liệu Món Ngon Mỗi Ngày, tự động loại trừ 100% món ăn chứa nguyên liệu bạn dị ứng.
          </p>

          {/* Navigation Toggle Buttons */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => handleTabChange('tinder')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'tinder'
                  ? 'bg-rose-600 text-white shadow-md scale-102'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              <FontAwesomeIcon icon={faFire} className={activeTab === 'tinder' ? 'text-white' : 'text-rose-500'} />
              <span>Tinder Quẹt Món</span>
            </button>

            <button
              onClick={() => handleTabChange('gacha')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === 'gacha'
                  ? 'bg-amber-600 text-white shadow-md scale-102'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              <FontAwesomeIcon icon={faDice} className={activeTab === 'gacha' ? 'text-white' : 'text-amber-500'} />
              <span>Gacha Mở Thẻ Bài</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Game Island */}
      <div className="container mx-auto max-w-4xl px-4 pt-10">
        {activeTab === 'tinder' ? <CulinaryTinder /> : <CulinaryGacha />}
      </div>
    </div>
  );
}

export default function MiniGamesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-10 flex flex-col items-center justify-center space-y-4">
          <Skeleton className="h-10 w-48 rounded-full" />
          <Skeleton className="h-6 w-96 rounded-xl" />
          <Skeleton className="h-80 w-full max-w-md rounded-3xl" />
        </div>
      }
    >
      <MiniGamesContent />
    </Suspense>
  );
}
