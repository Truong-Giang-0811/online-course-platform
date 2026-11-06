# Frontend – Online Course Platform

React 19 + Vite + React Router + Axios. Gọi backend qua proxy `/api` → `http://localhost:5001` (xem `vite.config.js`).

## Chạy

```bash
npm install
npm run dev      # http://localhost:5173 (cần backend chạy ở cổng 5001)
npm test         # Vitest + Testing Library
npm run lint
npm run build
```

Có thể đổi địa chỉ API bằng biến `VITE_API_URL` (khi đó backend cần bật CORS).

## Chức năng (theo backend hiện có)

| Trang | Vai trò | API |
| --- | --- | --- |
| Đăng ký / Đăng nhập / Đăng xuất | Tất cả | `/api/auth/*` (tự refresh token khi access token hết hạn) |
| Tài khoản, đăng xuất mọi phiên | Đã đăng nhập | `/api/auth/me`, `/api/auth/logout-all` |
| Danh mục: tìm kiếm, sắp xếp, phân trang | Tất cả | `GET /api/categories` |
| Danh mục: thêm, sửa, bật/tắt, xóa | Admin | `POST/PUT/PATCH/DELETE /api/categories` |
| Khóa học: tìm kiếm, lọc danh mục/trạng thái, phân trang | Tất cả | `GET /api/courses`, `GET /api/courses/mine` |
| Tạo / sửa / xóa / xuất bản / gỡ xuất bản khóa học | Giảng viên (chủ khóa học), Admin | `/api/courses/:id`, `/publish`, `/unpublish` |
| Chương: thêm, đổi tên, xóa, sắp xếp | Giảng viên (chủ), Admin | `/api/courses/:courseId/sections` |
| Bài học: thêm, sửa (video, nội dung, tài liệu, preview), xóa, sắp xếp | Giảng viên (chủ), Admin | `/api/courses/:courseId/sections/:sectionId/lessons` |

## Cấu trúc

- `src/api/client.js` – axios instance, lưu token, interceptor refresh (chỉ 1 request refresh cùng lúc vì backend xoay vòng refresh token).
- `src/api/services.js` – các hàm gọi API theo từng nhóm route.
- `src/context/` – `AuthProvider` + `useAuth`.
- `src/pages/`, `src/components/` – giao diện.
- `src/utils/validation.js` – kiểm tra dữ liệu giống quy tắc phía backend.
- `*.test.js(x)` – test cơ bản.
