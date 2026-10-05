import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { TimeGreetingBar } from "@/components/home/TimeGreetingBar";
import { GachaGame } from "@/components/home/GachaGame";
import { allFoods } from "@/lib/foodData";

export const metadata: Metadata = {
  title: "Trang Chủ | Ăn gì? - Gợi Ý & Khám Phá Ẩm Thực Thông Minh",
  description:
    "Mở gói thẻ bài ẩm thực để nhận gợi ý món ăn dinh dưỡng ngẫu nhiên được tinh chọn riêng cho khẩu vị và khung giờ ăn của bạn.",
};

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 transition-colors duration-500">
      {/* ================= TOP TIME & GREETING BAR ================= */}
      <TimeGreetingBar />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 pt-10">
        {/* ================= HERO HEADER ================= */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <Badge className="bg-secondary/15 text-foreground font-black px-3.5 py-1 rounded-full border border-secondary/30 text-xs shadow-xs">
            <FontAwesomeIcon
              icon={faWandMagicSparkles}
              className="mr-1.5 text-xs text-secondary"
            />
            <span>Trải Nghiệm Gacha Ẩm Thực</span>
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Hôm Nay Bạn Muốn Ăn Gì?
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Mở gói thẻ bài ngẫu nhiên để khám phá món ăn dinh dưỡng thơm ngon, chuẩn thông số calo và cân bằng dưỡng chất.
          </p>
        </div>

        {/* ================= GACHA GAME ISLAND ================= */}
        <GachaGame allFoods={allFoods} />
      </div>
    </div>
  );
}
