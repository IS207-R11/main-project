import { Suspense } from "react";
import type { Metadata } from "next";
import { MonNgonHome } from "@/components/home/MonNgonHome";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "AnGi | Món Ngon Mỗi Ngày & Ẩm Thực Chuẩn Vị Việt",
  description:
    "Hơn 2.500 công thức món ngon chuẩn hóa từ Ajinomoto và Viện Dinh Dưỡng Quốc Gia. Tự động tính toán năng lượng calo và loại trừ nguyên liệu dị ứng.",
};

function HomeLoadingSkeleton() {
  return (
    <div className="w-full flex flex-col items-center gap-6 py-12">
      <Skeleton className="h-12 w-96 rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 transition-colors duration-500">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 pt-6">
        <Suspense fallback={<HomeLoadingSkeleton />}>
          <MonNgonHome />
        </Suspense>
      </div>
    </div>
  );
}
