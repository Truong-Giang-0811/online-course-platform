import { useRef, useState } from "react";
import { getErrorMessage } from "../api/client";

// Nút chọn file → gọi upload(file) → trả kết quả qua onUploaded. Lỗi hiển thị qua onError.
export default function FileUploadButton({ label, accept, maxSizeMb, upload, onUploaded, onError }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      onError(`File vượt quá ${maxSizeMb}MB.`);
      return;
    }
    setUploading(true);
    onError("");
    try {
      const res = await upload(file);
      onUploaded(res.data);
    } catch (err) {
      onError(getErrorMessage(err, "Upload thất bại."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} hidden aria-label={label} onChange={handleChange} />
      <button type="button" className="btn btn-sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? "Đang tải lên..." : label}
      </button>
    </>
  );
}
