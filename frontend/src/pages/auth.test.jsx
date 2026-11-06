import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProtectedRoute from "../components/ProtectedRoute";
import { makeAuth, renderWithAuth, users } from "../test/renderWithAuth";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

describe("LoginPage", () => {
  it("báo lỗi khi bỏ trống email/mật khẩu và không gọi API", async () => {
    const auth = makeAuth();
    renderWithAuth(<LoginPage />, { auth });

    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Vui lòng nhập email và mật khẩu.");
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("đăng nhập thành công thì chuyển sang trang khóa học", async () => {
    const auth = makeAuth({ login: vi.fn().mockResolvedValue(users.student) });
    renderWithAuth(<LoginPage />, { auth });

    await userEvent.type(screen.getByLabelText("Email"), " a@test.com ");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "12345678");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(auth.login).toHaveBeenCalledWith("a@test.com", "12345678");
    expect(await screen.findByText("Trang khóa học")).toBeInTheDocument();
  });

  it("hiển thị thông báo lỗi từ backend", async () => {
    const error = { response: { data: { message: "Email hoặc mật khẩu không chính xác." } } };
    const auth = makeAuth({ login: vi.fn().mockRejectedValue(error) });
    renderWithAuth(<LoginPage />, { auth });

    await userEvent.type(screen.getByLabelText("Email"), "a@test.com");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "sai-mat-khau");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email hoặc mật khẩu không chính xác.");
  });
});

describe("RegisterPage", () => {
  it("kiểm tra dữ liệu trước khi gửi", async () => {
    const auth = makeAuth();
    renderWithAuth(<RegisterPage />, { auth });

    await userEvent.type(screen.getByLabelText("Họ tên"), "Nguyễn Văn A");
    await userEvent.type(screen.getByLabelText("Email"), "a@test.com");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "123");
    await userEvent.type(screen.getByLabelText("Xác nhận mật khẩu"), "123");
    await userEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Mật khẩu phải có từ 8 đến 72 ký tự.");
    expect(auth.register).not.toHaveBeenCalled();
  });

  it("gọi register với dữ liệu đã chuẩn hóa", async () => {
    const auth = makeAuth({ register: vi.fn().mockResolvedValue(users.student) });
    renderWithAuth(<RegisterPage />, { auth });

    await userEvent.type(screen.getByLabelText("Họ tên"), "  Nguyễn Văn A ");
    await userEvent.type(screen.getByLabelText("Email"), "a@test.com");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "12345678");
    await userEvent.type(screen.getByLabelText("Xác nhận mật khẩu"), "12345678");
    await userEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(auth.register).toHaveBeenCalledWith("Nguyễn Văn A", "a@test.com", "12345678");
    expect(await screen.findByText("Trang khóa học")).toBeInTheDocument();
  });
});

describe("ProtectedRoute", () => {
  const renderGuard = (auth, roles) =>
    renderWithAuth(<ProtectedRoute roles={roles} />, { auth, route: "/secret", path: "/secret" });

  it("chuyển về /login khi chưa đăng nhập", () => {
    renderGuard(makeAuth());
    expect(screen.getByText("Trang đăng nhập")).toBeInTheDocument();
  });

  it("chặn vai trò không được phép", () => {
    renderGuard(makeAuth({ user: users.student }), ["instructor", "admin"]);
    expect(screen.getByText("Không có quyền truy cập")).toBeInTheDocument();
  });

  it("hiển thị trạng thái đang tải khi đang khôi phục phiên", () => {
    renderGuard(makeAuth({ loading: true }));
    expect(screen.getByText(/Đang tải phiên đăng nhập/)).toBeInTheDocument();
  });
});
