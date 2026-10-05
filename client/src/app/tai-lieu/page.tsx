import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCode,
  faDatabase,
  faListCheck,
  faCircleInfo,
  faStar,
  faSliders,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Tài Liệu Dự Án | Ăn gì?",
  description:
    "Tài liệu mô tả nguồn dữ liệu, quy tắc phân loại độ hiếm (SSR, SR, UC, C), luồng hoạt động và quy tắc làm giàu dữ liệu món ăn.",
  openGraph: {
    title: "Tài Liệu Dự Án | Ăn gì?",
    description:
      "Tài liệu kỹ thuật, quy tắc phân loại độ hiếm và luồng xử lý dữ liệu của Ăn gì?.",
    type: "website",
    locale: "vi_VN",
  },
};

const rarityRules = [
  {
    code: "SSR",
    name: "Thượng Hạng (Siêu Hiếm)",
    priceRange: "Từ 120.000 ₫ trở lên",
    badgeClass: "bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black",
    borderClass: "border-amber-400/80",
    desc: "Món ăn cao cấp, phần ăn lớn đặc biệt, hải sản hảo hạng hoặc set lẩu thượng hạng với hàm lượng dinh dưỡng dồi dào.",
    examples: "Lẩu Hải Sản, Bò Nướng Tảng, Sashimi Tổng Hợp, Cua Hoàng Đế...",
  },
  {
    code: "SR",
    name: "Đặc Sắc (Hiếm)",
    priceRange: "80.000 ₫ – 119.000 ₫",
    badgeClass: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold",
    borderClass: "border-purple-400/70",
    desc: "Món ăn chất lượng cao, các món đặc sản vùng miền, món nướng, lẩu mini hoặc món ăn gia đình tròn vị.",
    examples: "Bò Lúc Lắc, Sườn Nướng BBQ, Cơm Niêu Đặc Biệt, Gà Đốt Ô Thum...",
  },
  {
    code: "UC",
    name: "Trung Cấp (Không Phổ Biến)",
    priceRange: "50.000 ₫ – 79.000 ₫",
    badgeClass: "bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold",
    borderClass: "border-sky-400/60",
    desc: "Món ăn văn phòng phổ biến, phần ăn chuẩn chỉnh đầy đủ dưỡng chất cho bữa trưa và bữa tối năng suất.",
    examples: "Cơm Tấm Sườn Bì Chả, Bún Bò Huế Đặc Biệt, Phở Bò Tái Nạm, Mì Ý Sốt Bò Bằm...",
  },
  {
    code: "C",
    name: "Phổ Biến (Tiết Kiệm)",
    priceRange: "Dưới 50.000 ₫",
    badgeClass: "bg-secondary text-white font-semibold",
    borderClass: "border-border",
    desc: "Món ăn bình dân quen thuộc, món ăn đường phố nhẹ nhàng hoặc bữa sáng nhanh gọn, tiện lợi mỗi ngày.",
    examples: "Bánh Mì Thịt Nướng, Bánh Cuốn Nóng, Xôi Gà Xé, Hủ Tiếu Gõ...",
  },
];

const dataSources = [
  {
    name: "foods.json",
    desc: "Dữ liệu món ăn đầu vào bao gồm tên món, giá cả, hình ảnh và phân loại cơ bản, cần được làm giàu thông số dinh dưỡng và phân loại khung giờ ăn.",
  },
  {
    name: "viendinhduong-nutritions.json",
    desc: "Cơ sở dữ liệu dinh dưỡng chuẩn của Viện Dinh Dưỡng Quốc Gia Việt Nam. Luôn được ưu tiên tra cứu hàng đầu theo tên tiếng Việt để đảm bảo độ chính xác với ẩm thực Việt.",
  },
  {
    name: "Gemini API (Model Lite)",
    desc: "Trích xuất danh sách thành phần nguyên liệu chính của món ăn (tiếng Việt và tiếng Anh) và phân loại khung giờ ăn phù hợp. AI chỉ trích xuất cấu trúc, tuyệt đối không tự bịa đặt số liệu.",
  },
  {
    name: "API Ninjas Nutrition",
    desc: "Nguồn dữ liệu dinh dưỡng quốc tế dự phòng, được tra cứu theo tên tiếng Anh khi cơ sở dữ liệu Viện Dinh Dưỡng bị thiếu thông tin Calo hoặc Đạm (Protein).",
  },
];

const modules = [
  "os, re, sys, json, time, difflib, unicodedata (Thư viện chuẩn Python)",
  "requests — Giao tiếp HTTP API với các dịch vụ dữ liệu",
  "google-genai / google.generativeai — SDK gọi Google Gemini",
];

const flowSteps = [
  {
    title: "Nạp dữ liệu gốc",
    desc: "Đọc và nạp toàn bộ danh mục từ foods.json cùng bộ từ điển dinh dưỡng viendinhduong-nutritions.json vào bộ nhớ.",
  },
  {
    title: "Xây dựng chỉ mục tra cứu VDD",
    desc: "Khởi tạo công cụ VDDMatcher thực hiện chuẩn hóa tên gọi, từ đồng nghĩa và thuật toán so khớp mờ (Fuzzy Matching) để tối ưu độ chính xác.",
  },
  {
    title: "Trích xuất thành phần & Khung giờ qua Gemini",
    desc: "Chia danh sách món ăn thành từng nhóm nhỏ (batch 12 món), gửi prompt yêu cầu Gemini nhận diện thành phần và đề xuất khung giờ ăn phù hợp.",
  },
  {
    title: "Tra cứu & Ghép nối dữ liệu dinh dưỡng",
    desc: "Với từng thành phần: tra cứu Viện Dinh Dưỡng trước bằng tiếng Việt; nếu thiếu thông số calo/protein sẽ tự động gọi dự phòng sang API Ninjas bằng tiếng Anh.",
  },
  {
    title: "Tổng hợp và Hợp nhất thông số",
    desc: "Dữ liệu Viện Dinh Dưỡng giữ quyền ưu tiên cao nhất, API Ninjas bù đắp dữ liệu thiếu; nếu cả hai nguồn đều không có thông tin thì để giá trị null.",
  },
  {
    title: "Bộ nhớ đệm (Caching) & Kiểm soát tốc độ",
    desc: "Lưu cache toàn bộ thành phần đã tra cứu để loại bỏ các request trùng lặp; tự động nghỉ 0.3 giây giữa các lần gọi API Ninjas.",
  },
  {
    title: "Gán độ hiếm, sao lưu và cập nhật",
    desc: "Tính toán tự động độ hiếm (SSR, SR, UC, C) và phân bổ dinh dưỡng vào từng món, tạo bản sao lưu an toàn foods.json.bak rồi ghi đè file foods.json.",
  },
];

const rules = [
  "Không bịa đặt số liệu: Khi cả hai nguồn dữ liệu dinh dưỡng đều không có thông tin thì giữ nguyên giá trị null.",
  "Bảo mật tuyệt đối: Không lưu vết hoặc để lộ API Key trong mã nguồn, ghi chú hay tài liệu công khai.",
  "Chuẩn hóa khung giờ ăn: Khung giờ ăn chỉ chấp nhận duy nhất 4 giá trị chuẩn: “Sáng sớm”, “Giữa trưa”, “Chiều”, “Tối”.",
  "Phân định rõ vai trò AI: Gemini chỉ làm nhiệm vụ trích xuất danh sách nguyên liệu, không tự tạo thông số calo hay đạm.",
  "Tối ưu hiệu năng: Bắt buộc áp dụng cơ chế Cache và xử lý theo từng Batch để tiết kiệm tài nguyên mạng và hạn mức Token.",
];

const notes = [
  "Cấu hình API Key: Thiết lập thông qua các biến môi trường hệ thống: GEMINI_API_KEY, API_NINJAS_KEY.",
  "Các cờ dòng lệnh (CLI): Hỗ trợ các tham số linh hoạt khi chạy script: --debug, --debug-vdd, --dry-run, --limit N.",
  "Sao lưu dữ liệu tự động: Luôn tự động tạo bản sao lưu foods.json.bak trước khi ghi đè dữ liệu mới.",
];

export default function TaiLieuPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
      {/* Header */}
      <header className="mb-12 border-b border-border pb-8 space-y-3">
        <Badge className="bg-secondary/15 text-foreground font-black px-3.5 py-1 rounded-full border border-secondary/30 text-xs shadow-xs">
          <FontAwesomeIcon icon={faBook} className="mr-1.5 text-xs text-secondary" />
          <span>Tài Liệu Kỹ Thuật Dự Án</span>
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Tài Liệu Dự Án Ăn Gì?
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Tổng quan kiến trúc dữ liệu, quy tắc phân loại độ hiếm thẻ bài, luồng xử lý và các nguyên tắc làm giàu dinh dưỡng món ăn.
        </p>
      </header>

      {/* 1. Tổng quan */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-foreground flex items-center gap-2">
          <FontAwesomeIcon icon={faCircleInfo} className="text-secondary text-lg" />
          1. Tổng Quan Dự Án
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Dự án <strong className="text-foreground">Ăn gì?</strong> xây dựng một trải nghiệm khám phá ẩm thực thông minh và thú vị thông qua hệ thống thẻ bài gacha. Script xử lý <code className="rounded-lg bg-muted px-2 py-1 text-xs font-mono font-bold text-foreground">get-name.py</code> đóng vai trò làm giàu dữ liệu món ăn, tính toán chuẩn hóa thông số calo/dinh dưỡng và phân bổ khung giờ ăn hợp lý.
        </p>

        <h3 className="mb-3 text-base font-bold text-foreground">
          Thư Viện &amp; Module Sử Dụng
        </h3>
        <ul className="ml-5 list-disc space-y-1.5 text-sm text-muted-foreground">
          {modules.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>

      {/* 2. Quy tắc phân loại độ hiếm (Rarity System) */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-foreground flex items-center gap-2">
          <FontAwesomeIcon icon={faStar} className="text-secondary text-lg" />
          2. Quy Tắc Phân Loại Độ Hiếm (Rarity)
        </h2>
        <p className="mb-6 leading-relaxed text-muted-foreground">
          Mỗi món ăn trong hệ thống được gắn thẻ bài với 4 cấp độ hiếm khác nhau dựa trên mức giá niêm yết, phản ánh độ phong phú của nguyên liệu và quy mô bữa ăn:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rarityRules.map((r) => (
            <div
              key={r.code}
              className={`rounded-3xl border bg-card p-5 shadow-xs space-y-3 transition-all ${r.borderClass}`}
            >
              <div className="flex items-center justify-between">
                <Badge className={`px-2.5 py-0.5 text-xs rounded-full uppercase shadow-xs ${r.badgeClass}`}>
                  {r.code}
                </Badge>
                <span className="text-xs font-bold text-secondary font-mono">
                  {r.priceRange}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">
                  {r.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {r.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                <strong className="text-foreground">Ví dụ: </strong>
                <span>{r.examples}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Nguồn dữ liệu */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-foreground flex items-center gap-2">
          <FontAwesomeIcon icon={faDatabase} className="text-secondary text-lg" />
          3. Nguồn Dữ Liệu
        </h2>
        <div className="space-y-4">
          {dataSources.map((src) => (
            <div
              key={src.name}
              className="rounded-2xl border border-border bg-card p-5 shadow-xs"
            >
              <h3 className="mb-1.5 font-mono text-sm font-bold text-primary">
                {src.name}
              </h3>
              <p className="text-sm leading-relaxed text-foreground">{src.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Luồng xử lý dữ liệu chi tiết */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-foreground flex items-center gap-2">
          <FontAwesomeIcon icon={faCode} className="text-secondary text-lg" />
          4. Luồng Xử Lý Dữ Liệu Chi Tiết
        </h2>
        <ol className="space-y-4">
          {flowSteps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-xs">
                {i + 1}
              </span>
              <div className="pt-1">
                <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 5. Quy tắc chuẩn hóa */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-foreground flex items-center gap-2">
          <FontAwesomeIcon icon={faListCheck} className="text-secondary text-lg" />
          5. Quy Tắc Chuẩn Hóa Cốt Lõi
        </h2>
        <ul className="space-y-3">
          {rules.map((r, i) => (
            <li
              key={i}
              className="rounded-2xl border border-border bg-card p-4 shadow-xs"
            >
              <p className="text-sm leading-relaxed text-foreground font-medium">• {r}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Ghi chú kỹ thuật & Tham số */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-foreground flex items-center gap-2">
          <FontAwesomeIcon icon={faSliders} className="text-secondary text-lg" />
          6. Ghi Chú Kỹ Thuật &amp; Cấu Hình
        </h2>
        <ul className="space-y-3">
          {notes.map((n, i) => (
            <li key={i} className="rounded-2xl border border-border bg-card p-4 shadow-xs">
              <p className="text-sm text-foreground font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faKey} className="text-secondary text-xs" />
                <span>{n}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-border pt-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          Cập nhật đồng bộ theo phiên bản mới nhất của cơ sở dữ liệu và script xử lý.
        </p>
        <span className="font-mono text-[11px] text-muted-foreground">Ăn gì? © 2026</span>
      </footer>
    </main>
  );
}