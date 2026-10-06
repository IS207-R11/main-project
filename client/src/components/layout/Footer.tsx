"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faStar, faCompass, faBook, faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { ReportModal } from "@/components/reports/ReportModal";

export const Footer: React.FC = () => {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-border/80 bg-card/60 backdrop-blur-xs py-12 transition-colors duration-300 mt-auto">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
            {/* Brand info & Story */}
            <div className="space-y-4 md:col-span-7">
              <div className="flex items-center gap-3.5">
                <Image
                  src="/logos/main-logo.png"
                  alt="Logo Ăn gì?"
                  width={48}
                  height={60}
                  draggable={false}
                  className="h-14 w-auto object-contain shrink-0 select-none"
                />
                <span className="font-heading font-extrabold text-3xl sm:text-4xl text-foreground tracking-tight flex items-center gap-1.5">
                  ĂN GÌ <span className="text-secondary">?</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pr-0 md:pr-6">
                <strong>ĂN GÌ?</strong> bắt đầu từ một câu hỏi rất quen thuộc: “Hôm nay ăn gì?” Một câu hỏi nhỏ nhưng đôi khi lại khiến chúng ta mất rất nhiều thời gian để lựa chọn. Vì vậy, <strong>ĂN GÌ?</strong> ra đời để biến những phút phân vân ấy thành một hành trình khám phá đầy thú vị. Mỗi người có một khẩu vị và thói quen ăn uống riêng. <strong>ĂN GÌ?</strong> dựa trên những sở thích và lịch sử ăn uống đó để đưa ra những gợi ý phù hợp, để mỗi lần bấm “Gợi ý” đều có thể mở ra một lựa chọn mới.
              </p>
              <div className="inline-flex items-center gap-2 text-[11px] font-bold text-foreground bg-muted/80 px-3.5 py-1.5 rounded-full border border-border/60">
                <FontAwesomeIcon icon={faStar} className="text-secondary text-xs" />
                <span>Khám Phá Dễ Dàng • Dinh Dưỡng Minh Bạch • Trải Nghiệm Thú Vị</span>
              </div>
            </div>

            {/* Quick links */}
            <div className="space-y-3 md:col-span-3">
              <h4 className="text-xs text-foreground uppercase tracking-wider font-bold">
                Điều Hướng
              </h4>
              <ul className="space-y-2.5 text-xs font-semibold text-muted-foreground">
                <li>
                  <Link
                    href="/"
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faCompass} className="text-[10px] text-secondary" />
                    <span>Trang Chủ (Gacha Gợi Ý)</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tai-nguyen"
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faBook} className="text-[10px] text-secondary" />
                    <span>Tài Nguyên (Kho Tàng Món Ăn)</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/huong-dan/quy-dinh-dong-gop"
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faStar} className="text-[10px] text-secondary" />
                    <span>Quy Định Đóng Góp</span>
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-muted-foreground"
                  >
                    <FontAwesomeIcon icon={faCommentDots} className="text-[10px] text-rose-500" />
                    <span>Góp Ý & Báo Lỗi</span>
                  </button>
                </li>
              </ul>
            </div>

          {/* Brand Philosophy */}
          <div className="space-y-3 md:col-span-2">
            <h4 className="text-xs text-foreground uppercase tracking-wider font-bold">
              Ý Nghĩa
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mỗi món ăn là một câu chuyện dinh dưỡng và niềm vui thưởng thức.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-3">
          <p>© 2026 Ăn gì? Tất cả các quyền được bảo lưu.</p>
          <div className="flex items-center gap-1.5">
            <span>Đồng hành cùng bữa ăn ngon</span>
            <FontAwesomeIcon icon={faHeart} className="text-destructive text-xs" />
            <span>mỗi ngày</span>
          </div>
        </div>
        </div>
      </footer>
      <ReportModal open={reportOpen} onOpenChange={setReportOpen} />
    </>
  );
};
