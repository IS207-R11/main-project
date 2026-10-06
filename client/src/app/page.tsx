import { Suspense } from "react";
import type { Metadata } from "next";
import { HomeTabs } from "@/components/home/HomeTabs";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Trang Chủ | Ăn gì? - Gợi Ý & Khám Phá Ẩm Thực Thông Minh",
  description:
    "Mở gói thẻ bài ẩm thực hoặc quẹt món ăn thông minh để nhận gợi ý món ăn dinh dưỡng ngẫu nhiên được tinh chọn riêng cho khẩu vị của bạn.",
};

function HomeLoadingSkeleton() {
  return (
    <div className="w-full flex flex-col items-center gap-6 py-12">
      <Skeleton className="h-8 w-48 rounded-full" />
      <Skeleton className="h-12 w-96 rounded-xl" />
      <Skeleton className="h-5 w-80 rounded-md" />
      <div className="w-full max-w-md h-12 flex gap-4 mt-4">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
      <div className="w-full max-w-4xl h-96 mt-6">
        <Skeleton className="h-full w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 transition-colors duration-500">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 pt-10">
        <Suspense fallback={<HomeLoadingSkeleton />}>
          <HomeTabs />
        </Suspense>
      </div>
    </div>
  );
}
