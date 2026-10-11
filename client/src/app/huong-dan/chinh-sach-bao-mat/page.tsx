import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserShield,
  faArrowLeft,
  faLock,
  faDatabase,
  faKey,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Chính Sách Bảo Mật | Ăn Gì?",
  description: "Chính sách bảo mật dữ liệu và bảo vệ quyền riêng tư người dùng tại Ăn Gì.",
};

export default function PrivacyPolicyPage() {
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 text-xs font-bold uppercase tracking-wider">
          <FontAwesomeIcon icon={faUserShield} />
          <span>Quyền riêng tư & Bảo mật</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground tracking-tight">
          Chính Sách Bảo Mật Thông Tin
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Chúng tôi coi trọng việc bảo vệ dữ liệu cá nhân của bạn. Chính sách này giải thích cách thức Ăn Gì thu thập, bảo vệ và tôn trọng quyền riêng tư của người dùng.
        </p>
      </div>

      {/* Privacy Sections */}
      <div className="grid gap-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base">
            <FontAwesomeIcon icon={faDatabase} className="text-primary" />
            <span>1. Thông Tin Chúng Tôi Thu Thập</span>
          </div>
          <p>
            Khi bạn tạo tài khoản, chúng tôi thu thập các thông tin cơ bản gồm: tên đăng nhập (username), địa chỉ email, mật khẩu đã mã hóa một chiều và thông tin hồ sơ sức khỏe (chiều cao, cân nặng, tình trạng thai kỳ - nếu bạn chủ động nhập để theo dõi).
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base">
            <FontAwesomeIcon icon={faLock} className="text-secondary" />
            <span>2. Mục Đích Sử Dụng Dữ Liệu</span>
          </div>
          <p>
            Dữ liệu của bạn chỉ được sử dụng cho các mục đích:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Xác thực phiên đăng nhập an toàn thông qua chuẩn JWT (JSON Web Token).</li>
            <li>Cá nhân hóa trải nghiệm gợi ý bữa ăn (món yêu thích, món ghét, lịch sử đã ăn).</li>
            <li>Tính toán các chỉ số sức khỏe định kỳ cho cá nhân bạn xem riêng.</li>
            <li>Tuyệt đối không bán dữ liệu cá nhân của người dùng cho bên thứ ba.</li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base">
            <FontAwesomeIcon icon={faKey} className="text-amber-500" />
            <span>3. Quyền Kiểm Soát Dữ Liệu Của Bạn</span>
          </div>
          <p>
            Bạn có toàn quyền chỉnh sửa thông tin tài khoản, cập nhật mật khẩu, xóa lịch sử món ăn đã lưu hoặc yêu cầu xóa hoàn toàn tài khoản bất kỳ lúc nào thông qua trang Hồ sơ cá nhân.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base">
            <FontAwesomeIcon icon={faShieldHalved} className="text-emerald-500" />
            <span>4. Bảo Mật Truyền Thông Tin</span>
          </div>
          <p>
            Mọi kết nối giữa trình duyệt của bạn và hệ thống máy chủ Ăn Gì đều được bảo vệ bởi giao thức HTTPS với cơ chế mã hóa truyền tải an toàn.
          </p>
        </div>
      </div>
    </div>
  );
}
