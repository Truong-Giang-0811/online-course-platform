# OrbitLearn – Phase 1 UI Foundation

## Công nghệ
- React 19 + Vite 8 (giữ nguyên)
- Tailwind CSS 4 qua `@tailwindcss/vite`
- shadcn/ui cấu hình `new-york`, JavaScript/JSX
- next-themes cho Light/Dark
- Lucide React, class-variance-authority, clsx, tailwind-merge

## Cài đặt
Chạy tại thư mục frontend:
```bash
npm install
npm run dev
```

## Kiểm tra
```bash
npm run build
npm test
```

## Ghi chú tích hợp
- Giữ nguyên API proxy `/api` -> `http://localhost:5001`.
- Giữ nguyên AuthProvider, API services, route và nghiệp vụ hiện tại.
- Theme được lưu ở localStorage với key `orbitlearn-theme`.
- Đã thêm `src/test/setup.js` vì `vite.config.js` tham chiếu tới file này.
- ZIP đầu vào có lẫn thư mục backend trong `src`; bản Phase 1 chỉ đóng gói source frontend, không đưa các thư mục controllers/models/middlewares/server backend vào.
- `components.json` và `vite.config.js` đã cấu hình alias `@/` trỏ tới `src/` để dùng thống nhất trong các component.
