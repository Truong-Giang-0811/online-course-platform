# Dữ liệu test thủ công trên frontend

Đăng nhập bằng tài khoản **giảng viên** (`SEED_INSTRUCTOR_EMAIL` / `SEED_INSTRUCTOR_PASSWORD` trong `backend/.env`).

## Ảnh bìa – `anh/`

| File | Dùng để | Kết quả mong đợi |
| --- | --- | --- |
| `anh-bia-html-css.png` | Tạo khóa học → **Tải ảnh lên** | Ô URL tự điền link Cloudinary, hiện ảnh xem trước |
| `anh-bia-javascript.png` | như trên | như trên |
| `anh-bia-python.png` | như trên | như trên |
| `anh-qua-lon-hon-5MB.png` (5,6MB) | Thử giới hạn dung lượng | Báo lỗi "File vượt quá 5MB", không upload |

## Tài liệu – `tai-lieu/`

Trong form bài học → **Tải file lên**:

| File | Kết quả mong đợi |
| --- | --- |
| `Ghi chú bài học.txt` | Thêm 1 dòng tài liệu, tên tiếng Việt giữ nguyên, loại `txt` |
| `Bài tập về nhà.txt` | như trên |
| `Slide bài học.pdf` | Upload được; **tải về chỉ được nếu đã bật PDF trên Cloudinary** (xem lưu ý) |

## Link YouTube

Dán vào ô **Video URL** của bài học — form hiện khung xem trước video ngay bên dưới, danh sách bài học có nhãn **▶ YouTube**.

| Dạng link | Link |
| --- | --- |
| watch | https://www.youtube.com/watch?v=PkZNo7MFNFg |
| youtu.be | https://youtu.be/pQN-pnXPaVg |
| có thời điểm bắt đầu | https://www.youtube.com/watch?v=hdI2bqOjy3c&t=60s |
| shorts / embed | https://www.youtube.com/embed/yfoY53QXEnI |

Link sai để kiểm tra báo lỗi:

| Link | Kết quả mong đợi |
| --- | --- |
| `youtube.com/watch?v=PkZNo7MFNFg` (thiếu https://) | Báo "videoUrl phải là URL http/https hợp lệ." |
| `https://example.com/video.mp4` | Lưu được, hiện "Không nhận diện được link YouTube — sẽ lưu như link video thường." |

## Kịch bản gợi ý

1. **Khóa học** → **+ Tạo khóa học** → nhập tiêu đề, mô tả, chọn danh mục, tải `anh-bia-javascript.png` → **Tạo khóa học**.
2. Bấm **Xuất bản** ngay → phải báo "Cần tạo ít nhất một chương trước khi xuất bản."
3. Thêm chương "Nền tảng JavaScript" → **+ Thêm bài học** → dán link YouTube → tải `Ghi chú bài học.txt` → **Thêm bài học**.
4. **Xuất bản** → thành công. Đăng nhập tài khoản học viên để thấy khóa học trong danh sách.

## Lưu ý về PDF/ZIP

Tài khoản Cloudinary miễn phí mặc định **chặn tải file PDF và ZIP** (trả lỗi 401 khi mở link). Muốn tải được:
Cloudinary Console → **Settings → Security** → bật **Allow delivery of PDF and ZIP files** → Save.
