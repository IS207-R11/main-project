# Báo Cáo Dự Án AnGi - Nền Tảng Gợi Ý Ẩm Thực & Dinh Dưỡng

## 1. Tổng quan & Định hướng thiết kế
- **Mục tiêu**: Xây dựng nền tảng ẩm thực Việt Nam kết hợp tra cứu dinh dưỡng chuẩn hóa và mạng xã hội chia sẻ công thức.
- **Phong cách thiết kế**:
  - Tham khảo thực tế từ **Món Ngon Mỗi Ngày** (Ajinomoto) và **Cookpad Việt Nam**.
  - Loại bỏ hoàn toàn phong cách tối mờ/neon (AI Slop); sử dụng tông màu ấm cúng (Đỏ Ajinomoto `#D32F2F`, Cam Cookpad `#FA8C16`, Nền giấy ấm `#FAF8F5`).

---

## 2. Thiết kế Cơ sở Dữ liệu (10 Bảng Chuẩn Hóa)

| STT | Tên Bảng | Vai trò & Mục đích |
|:---:|---|---|
| 1 | `users` | Tài khoản, phân quyền (`USER`, `ADMIN`), trạng thái (`ACTIVE`, `BANNED`). |
| 2 | `user_allergy_ingredients` | Danh mục nguyên liệu dị ứng của từng người dùng. |
| 3 | `nutrition_ingredients` | Bảng nguyên liệu dinh dưỡng chuẩn Viện Dinh Dưỡng Quốc Gia (calo/100g, tỷ lệ thải bỏ %). |
| 4 | `system_dishes` | Món ăn chuẩn hóa hệ thống (Ajinomoto), lưu calo tính sẵn, số lượt thích công khai. |
| 5 | `system_dish_ingredients` | Định lượng nguyên liệu chi tiết cho từng món chuẩn vị (gram & quy đổi hiển thị). |
| 6 | `user_dish_interactions` | Tương tác: `FAVOURITE` (công khai), `DISLIKE` (riêng tư), `ALLERGY` (riêng tư). |
| 7 | `community_topics` | Chủ đề công thức Cookpad, hỗ trợ phát hiện trùng lặp. |
| 8 | `community_posts` | Công thức nấu ăn người dùng chia sẻ (nguyên liệu, các bước, ảnh/video, khẩu phần, thời gian). |
| 9 | `community_comments` | Bình luận dạng nhánh và ảnh thực hành nấu (Cooksnap). |
| 10 | `moderation_reports` | Báo cáo vi phạm (Spam, Thù địch, Phản cảm, Độc hại) kèm cơ chế tự động ẩn. |

---

## 3. Các Phân Hệ Chức Năng Đã Hoàn Thành

### 3.1. Món Ăn Hệ Thống & Tính Toán Dinh Dưỡng
- **Công thức tính năng lượng tự động**:
  $$T = \sum_{i=1}^n \left( W_i \times (1 - R_i) \times \frac{N_i}{100} \right)$$
  *(Trong đó: $W_i$ là khối lượng gram, $R_i$ là tỷ lệ thải bỏ $0 \le R_i \le 1$, $N_i$ là Kcal/100g).*
- **Trang chủ (`/`)**: Tìm kiếm theo từ khóa phổ biến, gợi ý món theo xu hướng, 6 mục tiêu dinh dưỡng (*Giảm mỡ/Eat Clean*, *Cơ xương*, *Bổ máu*, *Trí não*, *Nấu nhanh 15p*).
- **Trang chi tiết món (`/mon-an/[slug]`)**: Bảng thành phần dinh dưỡng chuẩn hóa, checklist nguyên liệu tương tác, gợi ý thực đơn cơm nhà 3 món (Mặn, Canh, Rau/Xào).
- **Cơ chế an toàn dị ứng & Bảo mật**:
  - Tự động loại trừ 100% món ăn chứa nguyên liệu người dùng bị dị ứng.
  - Hộp thoại chọn nguyên liệu dị ứng cụ thể khi người dùng đánh dấu dị ứng món ăn.
  - Bảo mật quyền riêng tư: Tuyệt đối không hiển thị số lượt Dislike hoặc Dị ứng ra bên ngoài; chỉ công khai lượt Yêu thích (`favourite_count`).

### 3.2. Mini-Games Tương Tác (`/mini-games`)
- **Tinder Quẹt Món**: Vuốt phải (chọn món vào thực đơn hôm nay), vuốt trái (bỏ qua), nút tương tác nhanh (Thích, Không thích, Báo dị ứng).
- **Gacha Mở Thẻ Bài**: 4 gói chủ đề (*Bữa sáng nhanh gọn*, *Eat Clean ≤ 400 kcal*, *Cơm tối gia đình*, *Ngẫu nhiên*), hiệu ứng xé túi mù và lật thẻ 3D, ưu tiên tăng tỷ lệ xuất hiện các món đã yêu thích.

### 3.3. Mạng Xã Hội Ẩm Thực Cookpad (`/cong-dong`)
- Thanh chủ đề ngang kèm kiểm tra trùng lặp.
- Bảng vinh danh Top 3 công thức được yêu thích nhất (Huy chương Vàng, Bạc, Đồng).
- Bộ lọc loại trừ nguyên liệu dị ứng/không ăn được ở sidebar.
- Đăng công thức nấu ăn mới (`/cong-dong/tao-mon`): Thêm nguyên liệu và các bước làm trực quan.
- Chi tiết bài viết (`/cong-dong/bai-viet/[id]`): Gửi ảnh thực hành Cooksnap, bình luận trao đổi, nút báo cáo vi phạm.

### 3.4. Quản Trị Hệ Thống & Kiểm Duyệt (`/admin`)
- **Hàng đợi kiểm duyệt (Moderation Queue)**:
  - Tự động tạm ẩn nội dung khi nhận từ 3 báo cáo trở lên.
  - Admin có quyền: Duyệt & Xóa nội dung vi phạm, Khóa vĩnh viễn tài khoản người dùng (`BAN_USER`), Bỏ qua báo cáo sai.
- **Công cụ tạo món chuẩn vị (System Dishes Manager)**:
  - Tích hợp **Live Nutrition Calculator Preview**: Tự động tính toán tổng năng lượng trực tiếp ngay khi nhập khối lượng từng nguyên liệu.

### 3.5. Quản Lý Hồ Sơ Cá Nhân (`/profile`)
- Tab quản lý hồ sơ dinh dưỡng: Người dùng tự do bật/tắt nguyên liệu dị ứng, xem lại các món đã thích và hoàn tác các món đã đánh dấu không thích.

---

## 4. Kết Quả Nghiệm Thu Kỹ Thuật & Toàn Bộ Kiểm Thử (Testing)

- **TypeScript Typecheck (`npm run typecheck`)**: **0 errors** (toàn bộ codebase đạt chuẩn an toàn kiểu dữ liệu).
- **Production Build (`next build`)**: **27/27 pages và API routes** biên dịch và tối ưu hóa thành công 100%.
- **Unit & Component Testing (Vitest)**: **20/20 test files PASSED, 96/96 tests PASSED** (đạt 100%).
- **Kiểm thử E2E & Tích hợp API (`test_e2e_apis.py`)**: **30/30 test cases PASSED** (100% các luồng API, tính toán dinh dưỡng, lọc dị ứng, kiểm duyệt tự động ẩn $\ge 3$ báo cáo và điều hướng các trang frontend).
- **Kết nối Database**: Đồng bộ hóa dữ liệu trực tiếp trên hệ thống MySQL Cloud Aiven.

---

## 5. Hướng Dẫn Chạy Thử Nghiệm

```bash
# 1. Chạy ứng dụng giao diện (Client Next.js)
cd client
npm run dev

# 2. Truy cập ứng dụng qua trình duyệt
http://localhost:3000
```

