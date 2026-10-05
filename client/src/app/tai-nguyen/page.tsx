import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUtensils } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { ResourcesExplorer } from "@/components/resources/ResourcesExplorer";
import { allFoods } from "@/lib/foodData";

export const metadata: Metadata = {
  title: "Kho Tàng Món Ăn | Ăn gì?",
  description:
    "Khám phá danh mục thẻ bài ẩm thực phong phú với đầy đủ hình ảnh, nguyên liệu và thông số calo, protein, carbs chi tiết.",
};

export default function ResourcesPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 transition-colors duration-500">
      {/* ================= PAGE HEADER ================= */}
      <section className="border-b border-border/80 bg-card/75 backdrop-blur-md py-10 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl text-center space-y-3">
          <Badge className="bg-secondary/15 text-foreground font-black px-3.5 py-1 rounded-full border border-secondary/30 text-xs shadow-xs">
            <FontAwesomeIcon icon={faUtensils} className="mr-1.5 text-xs text-secondary" />
            <span>Thư Viện Món Ăn</span>
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Kho Tàng Món Ăn
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tra cứu và lọc hơn {allFoods.length} món ăn truyền thống và hiện đại với dữ liệu dinh dưỡng chuẩn hóa khoa học.
          </p>
        </div>
      </section>

      {/* ================= RESOURCES EXPLORER ISLAND ================= */}
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        <ResourcesExplorer foods={allFoods} />
      </div>
    </div>
  );
}
