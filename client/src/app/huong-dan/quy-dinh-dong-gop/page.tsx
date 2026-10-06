import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faImage,
  faShieldHalved,
  faTriangleExclamation,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Quy Định Đóng Góp | Ăn Gì?",
  description: "Quy định tổng quan về đóng góp thực phẩm và món ăn vào thư viện cộng đồng Ăn Gì.",
};

export default function ContributionRulesPage() {
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
          <FontAwesomeIcon icon={faBookOpen} />
          <span>Hướng dẫn cộng đồng</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground tracking-tight">
          Quy Định Đóng Góp Thực Phẩm
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Nhằm xây dựng thư viện ẩm thực phong phú, chính xác và văn minh, các thành viên tham gia đóng góp món ăn vào hệ thống Ăn Gì vui lòng tuân thủ các quy chuẩn sau:
        </p>
      </div>

      {/* Rules Content */}
      <div className="grid gap-6">
        {/* Rule 1: Tên & Mô tả */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              01
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Tiêu Chuẩn Tên Gọi & Mô Tả Món Ăn
            </h2>
          </div>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 pl-12 list-disc leading-relaxed">
            <li>Tên món ăn cần viết đúng chính tả tiếng Việt, có dấu rõ ràng (Ví dụ: &ldquo;Phở Bò Tái Nạm&rdquo;, &ldquo;Bún Chả Hà Nội&rdquo;).</li>
            <li>Tránh sử dụng từ ngữ thô tục, mang tính quảng cáo cá nhân hoặc đặt tên sai lệch với bản chất món ăn.</li>
            <li>Phần mô tả nên nêu ngắn gọn hương vị đặc trưng, xuất xứ vùng miền hoặc cách thưởng thức để người dùng khác dễ hình dung.</li>
          </ul>
        </div>

        {/* Rule 2: Hình ảnh món ăn */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
              <FontAwesomeIcon icon={faImage} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Yêu Cầu Về Hình Ảnh Tải Lên
            </h2>
          </div>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 pl-12 list-disc leading-relaxed">
            <li>Ảnh phải thể hiện rõ nét món ăn, độ sáng hài hòa, góc chụp hấp dẫn và sạch sẽ.</li>
            <li>Định dạng hỗ trợ: JPEG, PNG, JPG, WEBP. Dung lượng tệp tối đa không vượt quá <strong>5MB</strong>.</li>
            <li>Tuyệt đối không tải lên hình ảnh nhạy cảm, bạo lực, vi phạm thuần phong mỹ tục hoặc chứa nội dung bản quyền không được phép.</li>
          </ul>
        </div>

        {/* Rule 3: Quy trình kiểm duyệt */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Quy Trình Kiểm Duyệt Món Ăn (ACTIVE / PENDING)
            </h2>
          </div>
          <div className="pl-12 text-xs sm:text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>
              Mỗi khi bạn gửi một món mới, hệ thống sẽ tự động gán trạng thái <span className="font-bold text-amber-500">PENDING (Chờ duyệt)</span>. Đội ngũ Quản trị viên (Admin) và Điều phối viên (Moderator) sẽ kiểm tra tính xác thực trước khi chuyển sang trạng thái <span className="font-bold text-emerald-600">ACTIVE (Đã duyệt)</span> để xuất hiện trên toàn bộ hệ thống gợi ý và Gacha.
            </p>
          </div>
        </div>

        {/* Rule 4: Chế tài xử lý */}
        <div className="p-6 rounded-3xl bg-card border border-amber-500/30 bg-amber-500/5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Chế Tài Xử Lý Vi Phạm
            </h2>
          </div>
          <p className="pl-12 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Các tài khoản cố tình spam, tải lên nội dung rác hoặc lặp đi lặp lại hành vi vi phạm quy chuẩn đóng góp sẽ bị khóa quyền đóng góp món ăn hoặc đình chỉ tài khoản theo quyết định của Ban quản trị.
          </p>
        </div>
      </div>
    </div>
  );
}
