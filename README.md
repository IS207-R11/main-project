# AnGi

Hệ thống gợi ý và quản lý món ăn thông minh AnGi (Full-stack: Next.js Client & Laravel Backend RESTful API).

---

## 1. Cài đặt và khởi chạy Backend (Server)

### Yêu cầu môi trường

- **PHP**: Phiên bản 8.3 trở lên.
- **Composer**: Phiên bản 2.x trở lên.
- **PHP Extensions**: Đảm bảo đã bật các extension: `mbstring`, `openssl`, `pdo_mysql`, `mysqli`, `intl`, `curl`, `fileinfo`.

### Bước 1: Cấu hình kết nối Database

Đảm bảo tồn tại file `server/.env` chứa các biến kết nối cơ sở dữ liệu:

- `DB_CONNECTION`: Loại kết nối (mặc định: `mysql`).
- `DB_HOST`: Địa chỉ máy host server database.
- `DB_PORT`: Số port server database (mặc định: `3306`).
- `DB_DATABASE`: Tên database.
- `DB_USERNAME`: Tên đăng nhập.
- `DB_PASSWORD`: Mật khẩu.
- `MYSQL_ATTR_SSL_CA`: Đường dẫn lưu chứng chỉ SSL (`ca.pem`) nếu kết nối Cloud Database có SSL.

Kiểm tra kết nối tới cơ sở dữ liệu:

```sh
cd server
php artisan db:show
```

### Bước 2: Cài đặt các gói phụ thuộc (Composer Dependencies)

Tại thư mục `server`, chạy lệnh:

```sh
composer install
```

### Bước 3: Sinh tài liệu API Swagger (OpenAPI)

Để sinh hoặc cập nhật tài liệu Swagger UI:

```sh
php artisan l5-swagger:generate
```

### Bước 4: Khởi chạy Server Backend

Chạy máy chủ phát triển cục bộ (Local Development Server):

```sh
php artisan serve
```

Server sẽ chạy tại địa chỉ: **`http://localhost:8000`**

- **Health Check Endpoint**: `http://localhost:8000/api/`
- **Giao diện Swagger UI Documentation**: `http://localhost:8000/api/documentation`

### Bước 5: Chạy kiểm thử tự động (Automated Testing)

Hệ thống tích hợp bộ kiểm thử tính năng hoàn chỉnh (Feature Tests) sử dụng Pest PHP:

```sh
# Chạy toàn bộ test suite
php artisan test

# Chạy riêng API tests
php artisan test --filter=ApiTest
```

---

## 2. Cài đặt và khởi chạy Frontend (Client)

### Yêu cầu môi trường

- **Node.js**: Phiên bản 18.x trở lên (khuyên dùng Node.js 20 LTS trở lên).
- **Trình quản lý gói**: `npm` (phiên bản 9.x trở lên).

### Bước 1: Cài đặt các gói phụ thuộc (npm Dependencies)

Di chuyển vào thư mục `client` và tiến hành cài đặt:

```sh
cd client
npm install
```

### Bước 2: Cấu hình biến môi trường

Tạo hoặc cập nhật file `client/.env.local` (hoặc `client/.env`) để trỏ đến Backend API.

> **Lưu ý:** Nếu không cấu hình biến môi trường này, ứng dụng sẽ tự động trỏ đến máy chủ API triển khai trên Render.

### Bước 3: Khởi chạy Client ở môi trường phát triển (Development)

Khởi chạy máy chủ phát triển Next.js:

```sh
npm run dev
```

Ứng dụng Client sẽ chạy tại địa chỉ: **`http://localhost:3000`**.

### Bước 4: Các lệnh kiểm tra và đóng gói (Scripts)

```sh
# Kiểm tra lỗi kiểu dữ liệu TypeScript
npm run typecheck

# Kiểm tra định dạng và quy chuẩn mã nguồn với ESLint
npm run lint

# Tự động định dạng mã nguồn với Prettier
npm run format

# Chạy toàn bộ Unit & Component Tests với Vitest
npm test

# Đóng gói sản phẩm cho môi trường Production
npm run build

# Khởi chạy server production (sau khi đã build)
npm run start
```
