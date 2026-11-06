import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { categoryApi } from "../api/services";
import { makeAuth, renderWithAuth, users } from "../test/renderWithAuth";
import CategoriesPage from "./CategoriesPage";

vi.mock("../api/services", () => ({
  categoryApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), setStatus: vi.fn(), remove: vi.fn() },
}));

const categories = [
  { _id: "c1", name: "Lập trình Web", slug: "lap-trinh-web", description: "HTML, CSS", isActive: true },
  { _id: "c2", name: "Thiết kế", slug: "thiet-ke", description: "", isActive: false },
];

describe("CategoriesPage", () => {
  beforeEach(() => {
    vi.mocked(categoryApi.list).mockResolvedValue({
      data: categories,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
  });

  it("học viên chỉ xem danh sách, không có nút quản trị", async () => {
    renderWithAuth(<CategoriesPage />, { auth: makeAuth({ user: users.student }) });

    expect(await screen.findByText("Lập trình Web")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Biểu mẫu danh mục" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xóa" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Lọc trạng thái")).not.toBeInTheDocument();
  });

  it("admin tạo danh mục mới", async () => {
    vi.mocked(categoryApi.create).mockResolvedValue({ message: "Tạo danh mục thành công." });
    renderWithAuth(<CategoriesPage />, { auth: makeAuth({ user: users.admin }) });
    await screen.findByText("Lập trình Web");

    await userEvent.type(screen.getByLabelText("Tên danh mục"), "  Dữ liệu ");
    await userEvent.click(screen.getByRole("button", { name: "Thêm danh mục" }));

    expect(categoryApi.create).toHaveBeenCalledWith({ name: "Dữ liệu", description: "" });
    expect(await screen.findByText("Tạo danh mục thành công.")).toBeInTheDocument();
  });

  it("admin bật/tắt trạng thái và sửa danh mục", async () => {
    vi.mocked(categoryApi.setStatus).mockResolvedValue({ message: "Ngừng hoạt động danh mục thành công." });
    vi.mocked(categoryApi.update).mockResolvedValue({ message: "Cập nhật danh mục thành công." });
    renderWithAuth(<CategoriesPage />, { auth: makeAuth({ user: users.admin }) });

    const row = (await screen.findByText("Lập trình Web")).closest("tr");
    await userEvent.click(within(row).getByRole("button", { name: "Ngừng" }));
    expect(categoryApi.setStatus).toHaveBeenCalledWith("c1", false);

    await userEvent.click(within(row).getByRole("button", { name: "Sửa" }));
    const nameInput = screen.getByLabelText("Tên danh mục");
    expect(nameInput).toHaveValue("Lập trình Web");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Web Frontend");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(categoryApi.update).toHaveBeenCalledWith("c1", { name: "Web Frontend", description: "HTML, CSS" });
  });

  it("hiển thị lỗi từ backend khi xóa danh mục đang được dùng", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(categoryApi.remove).mockRejectedValue({
      response: { data: { message: "Không thể xóa danh mục đang được khóa học sử dụng." } },
    });
    renderWithAuth(<CategoriesPage />, { auth: makeAuth({ user: users.admin }) });

    const row = (await screen.findByText("Lập trình Web")).closest("tr");
    await userEvent.click(within(row).getByRole("button", { name: "Xóa" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể xóa danh mục");
  });

  it("tìm kiếm gửi keyword lên API", async () => {
    renderWithAuth(<CategoriesPage />, { auth: makeAuth({ user: users.student }) });
    await screen.findByText("Lập trình Web");

    await userEvent.type(screen.getByPlaceholderText(/Tìm theo tên/), "web");
    await userEvent.click(screen.getByRole("button", { name: "Tìm" }));

    await waitFor(() =>
      expect(categoryApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: "web", page: 1 }))
    );
  });
});
