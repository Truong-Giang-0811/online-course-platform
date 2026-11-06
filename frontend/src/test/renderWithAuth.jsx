import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext } from "../context/auth-context";

export const makeAuth = (overrides = {}) => ({
  user: null,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  logoutAll: vi.fn(),
  ...overrides,
});

// Render một phần tử bên trong router + AuthContext giả.
export const renderWithAuth = (ui, { auth = makeAuth(), route = "/", path = "*" } = {}) =>
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="/login" element={<p>Trang đăng nhập</p>} />
          <Route path="/courses" element={<p>Trang khóa học</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

export const users = {
  student: { id: "u-student", fullName: "Học Viên A", email: "a@test.com", role: "student", status: "active" },
  instructor: { id: "u-inst", fullName: "Giảng Viên B", email: "b@test.com", role: "instructor", status: "active" },
  admin: { id: "u-admin", fullName: "Admin C", email: "c@test.com", role: "admin", status: "active" },
};
