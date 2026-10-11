import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileContract,
  faArrowLeft,
  faHandshake,
  faUserShield,
  faScaleBalanced,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Điều Khoản Sử Dụng | Ăn Gì?",
  description: "Điều khoản sử dụng dịch vụ và nền tảng gợi ý ẩm thực Ăn Gì.",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumb / Back button */}
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-full">
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Trang chủ</span>
          </Button>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-card via-card to-muted/40 border border-border shadow-md space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-bold uppercase tracking-wider">
          <FontAwesomeIcon icon={faFileContract} />
          <span>Pháp lý & Quy định</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground tracking-tight">
          Điều Khoản Sử Dụng
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Chào mừng bạn đến với Ăn Gì. Bằng việc truy cập hoặc sử dụng ứng dụng, bạn đồng ý tuân thủ các điều khoản được quy định dưới đây.
        </p>
      </div>

      {/* Terms Sections */}
      <div className="grid gap-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base">
            <FontAwesomeIcon icon={faHandshake} className="text-primary" />
            <span>1. Mối Quan Hệ Giữa Bạn Và Ăn Gì</span>
          </div>
          <p>
            Các điều khoản này định hình mối quan hệ giữa bạn và dịch vụ Ăn Gì. Dịch vụ của chúng tôi cung cấp các công cụ gợi ý ẩm thực, vòng quay Gacha món ăn, và lưu trữ nhật ký sức khỏe cá nhân. Khi sử dụng dịch vụ, bạn cam kết sử dụng cho mục đích hợp pháp và có trách nhiệm.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base">
            <FontAwesomeIcon icon={faUserShield} className="text-secondary" />
            <span>2. Tôn Trọng Người Khác & Hành Vi Bị Cấm</span>
          </div>
          <p>
            Bạn không được sử dụng dịch vụ để quấy rối, tải lên nội dung độc hại, vi phạm quyền sở hữu trí tuệ của người khác hoặc can thiệp trái phép vào hệ thống kỹ thuật của Ăn Gì (bao gồm việc spam API hoặc khai thác lỗ hổng bảo mật).
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base">
            <FontAwesomeIcon icon={faScaleBalanced} className="text-amber-500" />
            <span>3. Nội Dung Do Người Dùng Tạo (UGC)</span>
          </div>
          <p>
            Bạn giữ quyền sở hữu đối với nội dung (như tên món ăn, mô tả, ảnh chụp) bạn tải lên. Tuy nhiên, bằng việc đóng góp vào thư viện công cộng, bạn cấp cho Ăn Gì quyền hiển thị, phân phối và lập chỉ mục nội dung đó trên toàn bộ nền tảng để phục vụ cộng đồng.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base">
            <FontAwesomeIcon icon={faShieldHalved} className="text-emerald-500" />
            <span>4. Giới Hạn Trách Nhiệm</span>
          </div>
          <p>
            Thông tin thực phẩm và gợi ý bữa ăn được cung cấp nhằm mục đích tham khảo và giải trí thường nhật. Ăn Gì không thay thế cho lời khuyên y tế, dinh dưỡng chuyên sâu hoặc chỉ định điều trị từ bác sĩ chuyên khoa.
          </p>
        </div>
      </div>
    </div>
  );
}
