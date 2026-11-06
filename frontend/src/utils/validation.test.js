import { describe, expect, it } from "vitest";
import { isHttpUrl, validateCourse, validateLesson, validateRegister } from "./validation";

describe("validateRegister", () => {
  const valid = { fullName: "Nguyễn Văn A", email: "a@test.com", password: "12345678", confirmPassword: "12345678" };

  it("chấp nhận dữ liệu hợp lệ", () => {
    expect(validateRegister(valid)).toBe("");
  });

  it("từ chối họ tên quá ngắn", () => {
    expect(validateRegister({ ...valid, fullName: " A " })).toMatch(/Họ tên/);
  });

  it("từ chối email sai định dạng", () => {
    expect(validateRegister({ ...valid, email: "abc@" })).toBe("Email không hợp lệ.");
  });

  it("mật khẩu phải từ 8 đến 72 ký tự", () => {
    expect(validateRegister({ ...valid, password: "123", confirmPassword: "123" })).toMatch(/8 đến 72/);
    const long = "a".repeat(73);
    expect(validateRegister({ ...valid, password: long, confirmPassword: long })).toMatch(/8 đến 72/);
  });

  it("mật khẩu xác nhận phải khớp", () => {
    expect(validateRegister({ ...valid, confirmPassword: "khac12345" })).toMatch(/không khớp/);
  });
});

describe("validateCourse", () => {
  const valid = { title: "React cơ bản", description: "Mô tả", category: "c1", price: "0" };

  it("chấp nhận khóa học hợp lệ", () => {
    expect(validateCourse(valid)).toBe("");
  });

  it("bắt buộc tiêu đề, mô tả và danh mục", () => {
    expect(validateCourse({ ...valid, title: "  " })).toMatch(/bắt buộc/);
    expect(validateCourse({ ...valid, description: "" })).toMatch(/bắt buộc/);
    expect(validateCourse({ ...valid, category: "" })).toMatch(/danh mục/);
  });

  it("giá không được âm hoặc rỗng", () => {
    expect(validateCourse({ ...valid, price: "-1" })).toMatch(/Giá/);
    expect(validateCourse({ ...valid, price: "" })).toMatch(/Giá/);
  });
});

describe("validateLesson", () => {
  const valid = { title: "Bài 1", videoUrl: "", durationSeconds: "60", resources: [] };

  it("chấp nhận bài học hợp lệ", () => {
    expect(validateLesson(valid)).toBe("");
  });

  it("bắt buộc tiêu đề", () => {
    expect(validateLesson({ ...valid, title: "" })).toMatch(/tiêu đề/);
  });

  it("videoUrl phải là http/https", () => {
    expect(validateLesson({ ...valid, videoUrl: "ftp://x.com/a.mp4" })).toMatch(/videoUrl/);
    expect(validateLesson({ ...valid, videoUrl: "https://x.com/a.mp4" })).toBe("");
  });

  it("thời lượng phải là số nguyên không âm", () => {
    expect(validateLesson({ ...valid, durationSeconds: "1.5" })).toMatch(/Thời lượng/);
    expect(validateLesson({ ...valid, durationSeconds: "-3" })).toMatch(/Thời lượng/);
  });

  it("kiểm tra tài liệu đính kèm", () => {
    expect(validateLesson({ ...valid, resources: [{ name: "", url: "https://a.com" }] })).toMatch(/Tên tài liệu 1/);
    expect(validateLesson({ ...valid, resources: [{ name: "Slide", url: "abc" }] })).toMatch(/URL tài liệu 1/);
  });

  it("isHttpUrl", () => {
    expect(isHttpUrl("http://a.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
  });
});
