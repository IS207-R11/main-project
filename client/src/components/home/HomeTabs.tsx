"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandMagicSparkles,
  faFire,
  faDice,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { UnderlineTabs, type UnderlineTabItem } from "@/components/ui/UnderlineTabs";
import { GachaGame } from "@/components/home/GachaGame";
import { TinderGame } from "@/components/tinder/TinderGame";
import { GameSettingsDialog } from "@/components/home/GameSettingsDialog";
import { Settings } from "lucide-react";

type HomeTab = "gacha" | "tinder";

const HOME_TABS: UnderlineTabItem<HomeTab>[] = [
  {
    value: "gacha",
    label: "Vòng Quay Gacha",
    icon: <FontAwesomeIcon icon={faDice} className="text-sm" />,
  },
  {
    value: "tinder",
    label: "Tinder Quẹt Món",
    icon: <FontAwesomeIcon icon={faFire} className="text-sm text-rose-500" />,
  },
];

export function HomeTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const initialTab: HomeTab = tabParam === "tinder" ? "tinder" : "gacha";

  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Sync state if URL query param changes
  useEffect(() => {
    if (tabParam === "tinder" || tabParam === "gacha") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (nextTab: HomeTab) => {
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === "gacha") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }
    const queryString = params.toString();
    const newPath = queryString ? `/?${queryString}` : "/";
    router.replace(newPath, { scroll: false });
  };

  return (
    <div className="w-full">
      {/* ================= HERO HEADER ================= */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-6 transition-all duration-300">
        {activeTab === "gacha" ? (
          <>
            <Badge className="bg-secondary/15 text-foreground font-black px-3.5 py-1 rounded-full border border-secondary/30 text-xs shadow-xs">
              <span>Trải Nghiệm Gacha Ẩm Thực</span>
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Hôm Nay Bạn Muốn Ăn Gì?
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Mở gói thẻ bài ngẫu nhiên để khám phá món ăn dinh dưỡng thơm ngon, chuẩn thông số calo và cân bằng dưỡng chất.
            </p>
          </>
        ) : (
          <>
            <Badge className="bg-rose-500/15 text-foreground font-black px-3.5 py-1 rounded-full border border-rose-500/30 text-xs shadow-xs">
              <span>Khám Phá Phong Cách Tinder</span>
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Quẹt Món Ăn Bạn Thích
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Lướt nhanh qua các món ăn hấp dẫn. Quẹt phải nếu món vừa ý, quẹt trái để bỏ qua và tìm món khác!
            </p>
          </>
        )}
      </div>

      {/* ================= NAVIGATION TABS & SETTINGS ================= */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
        <div className="w-full max-w-md">
          <UnderlineTabs
            tabs={HOME_TABS}
            activeTab={activeTab}
            onChange={handleTabChange}
            align="full"
            className="border-b border-border/80"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          className="h-10 w-10 shrink-0 rounded-2xl border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all shadow-xs"
          title={activeTab === "gacha" ? "Cài đặt vòng quay" : "Cài đặt quẹt món"}
        >
          <Settings className="w-4.5 h-4.5" />
        </Button>
      </div>

      <GameSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        activeTab={activeTab}
      />

      {/* ================= TAB CONTENTS ================= */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => handleTabChange(val as HomeTab)}
        className="w-full"
      >
        <TabsContent value="gacha" className="outline-none focus:outline-none">
          <GachaGame />
        </TabsContent>

        <TabsContent value="tinder" className="outline-none focus:outline-none">
          <TinderGame />
        </TabsContent>
      </Tabs>
    </div>
  );
}
