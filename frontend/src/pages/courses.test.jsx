import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { categoryApi, courseApi, lessonApi, sectionApi } from "../api/services";
import { makeAuth, renderWithAuth, users } from "../test/renderWithAuth";
import CourseDetailPage from "./CourseDetailPage";
import CourseFormPage from "./CourseFormPage";
import CoursesPage from "./CoursesPage";

vi.mock("../api/services", () => ({
  categoryApi: { list: vi.fn() },
  courseApi: {
    list: vi.fn(), mine: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(),
    remove: vi.fn(), publish: vi.fn(), unpublish: vi.fn(),
  },
  sectionApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), reorder: vi.fn() },
  lessonApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), reorder: vi.fn() },
}));

const category = { _id: "c1", name: "Lập trình Web" };
const makeCourse = (overrides = {}) => ({
  _id: "k1",
  title: "React từ cơ bản",
  description: "Học React",
  coverImageUrl: "",
  price: 199000,
  status: "draft",
  category,
  tags: [],
  instructor: { _id: users.instructor.id, fullName: users.instructor.fullName },
  ...overrides,
});
const page = (data) => ({ data, pagination: { total: data.length, page: 1, limit: 9, totalPages: 1 } });

beforeEach(() => {
  vi.mocked(categoryApi.list).mockResolvedValue(page([category]));
  vi.mocked(sectionApi.list).mockResolvedValue({ data: [] });
  vi.mocked(lessonApi.list).mockResolvedValue({ data: [] });
});

describe("CoursesPage", () => {
  it("học viên xem danh sách khóa học, không có lọc trạng thái hay nút tạo", async () => {
    vi.mocked(courseApi.list).mockResolvedValue(page([makeCourse({ status: "published" })]));
    renderWithAuth(<CoursesPage />, { auth: makeAuth({ user: users.student }) });

    expect(await screen.findByText("React từ cơ bản")).toBeInTheDocument();
    expect(screen.getByText("199.000 ₫")).toBeInTheDocument();
    expect(screen.queryByLabelText("Lọc trạng thái")).not.toBeInTheDocument();
    expect(screen.queryByText("+ Tạo khóa học")).not.toBeInTheDocument();
  });

  it("giảng viên dùng /courses/mine và lọc theo trạng thái", async () => {
    vi.mocked(courseApi.mine).mockResolvedValue(page([makeCourse()]));
    renderWithAuth(<CoursesPage mine />, { auth: makeAuth({ user: users.instructor }) });

    expect(await screen.findByText("Nháp")).toBeInTheDocument();
    expect(screen.getByText("+ Tạo khóa học")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Lọc trạng thái"), "published");
    await waitFor(() =>
      expect(courseApi.mine).toHaveBeenLastCalledWith(expect.objectContaining({ status: "published", page: 1 }))
    );
    expect(courseApi.list).not.toHaveBeenCalled();
  });
});

describe("CourseFormPage", () => {
  it("kiểm tra dữ liệu và tạo khóa học", async () => {
    vi.mocked(courseApi.create).mockResolvedValue({ data: makeCourse() });
    renderWithAuth(<CourseFormPage />, { auth: makeAuth({ user: users.instructor }), route: "/courses/new", path: "/courses/new" });

    await userEvent.click(screen.getByRole("button", { name: "Tạo khóa học" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Tiêu đề và mô tả khóa học là bắt buộc.");

    await userEvent.type(screen.getByLabelText("Tiêu đề *"), "React từ cơ bản");
    await userEvent.type(screen.getByLabelText("Mô tả *"), "Học React");
    await screen.findByRole("option", { name: "Lập trình Web" });
    await userEvent.selectOptions(screen.getByLabelText("Danh mục *"), "c1");
    await userEvent.clear(screen.getByLabelText("Giá (VNĐ)"));
    await userEvent.type(screen.getByLabelText("Giá (VNĐ)"), "199000");
    await userEvent.click(screen.getByRole("button", { name: "Tạo khóa học" }));

    expect(courseApi.create).toHaveBeenCalledWith({
      title: "React từ cơ bản",
      description: "Học React",
      coverImageUrl: "",
      category: "c1",
      price: 199000,
    });
  });

  it("admin phải nhập Instructor ID khi tạo khóa học", async () => {
    renderWithAuth(<CourseFormPage />, { auth: makeAuth({ user: users.admin }), route: "/courses/new", path: "/courses/new" });

    expect(screen.getByLabelText("Instructor ID *")).toBeInTheDocument();
  });
});

describe("CourseDetailPage", () => {
  const renderDetail = (user) =>
    renderWithAuth(<CourseDetailPage />, { auth: makeAuth({ user }), route: "/courses/k1", path: "/courses/:id" });

  it("học viên chỉ xem thông tin, không thấy quản lý nội dung", async () => {
    vi.mocked(courseApi.get).mockResolvedValue({ data: makeCourse({ status: "published" }) });
    renderDetail(users.student);

    expect(await screen.findByRole("heading", { name: "React từ cơ bản" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xuất bản" })).not.toBeInTheDocument();
    expect(screen.queryByText("Nội dung khóa học")).not.toBeInTheDocument();
    expect(sectionApi.list).not.toHaveBeenCalled();
  });

  it("giảng viên sở hữu xuất bản khóa học và thấy lỗi từ backend", async () => {
    vi.mocked(courseApi.get).mockResolvedValue({ data: makeCourse() });
    vi.mocked(courseApi.publish).mockRejectedValue({
      response: { data: { message: "Cần tạo ít nhất một chương trước khi xuất bản." } },
    });
    renderDetail(users.instructor);

    await userEvent.click(await screen.findByRole("button", { name: "Xuất bản" }));

    expect(courseApi.publish).toHaveBeenCalledWith("k1");
    expect(await screen.findByText("Cần tạo ít nhất một chương trước khi xuất bản.")).toBeInTheDocument();
  });

  it("khóa học đã xuất bản: hiện nút gỡ xuất bản, ẩn sửa/xóa", async () => {
    vi.mocked(courseApi.get).mockResolvedValue({ data: makeCourse({ status: "published" }) });
    vi.mocked(courseApi.unpublish).mockResolvedValue({ message: "Gỡ xuất bản khóa học thành công." });
    renderDetail(users.instructor);

    await userEvent.click(await screen.findByRole("button", { name: "Gỡ xuất bản" }));

    expect(courseApi.unpublish).toHaveBeenCalledWith("k1");
    expect(screen.queryByText("Chỉnh sửa")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xóa khóa học" })).not.toBeInTheDocument();
  });

  it("thêm chương và thêm bài học", async () => {
    vi.mocked(courseApi.get).mockResolvedValue({ data: makeCourse() });
    vi.mocked(sectionApi.list).mockResolvedValue({ data: [{ _id: "s1", title: "Giới thiệu", order: 0 }] });
    vi.mocked(sectionApi.create).mockResolvedValue({ data: {} });
    vi.mocked(lessonApi.create).mockResolvedValue({ data: {} });
    renderDetail(users.instructor);

    await screen.findByText(/Chương 1: Giới thiệu/);
    await userEvent.type(screen.getByPlaceholderText("Tên chương mới"), "Hooks");
    await userEvent.click(screen.getByRole("button", { name: "+ Thêm chương" }));
    expect(sectionApi.create).toHaveBeenCalledWith("k1", { title: "Hooks" });

    await userEvent.click(screen.getByRole("button", { name: "+ Thêm bài học" }));
    await userEvent.type(screen.getByLabelText("Tiêu đề bài học *"), "useState");
    await userEvent.clear(screen.getByLabelText("Thời lượng (giây)"));
    await userEvent.type(screen.getByLabelText("Thời lượng (giây)"), "300");
    await userEvent.click(screen.getByLabelText(/Cho phép xem trước/));
    await userEvent.click(screen.getByRole("button", { name: "Thêm bài học" }));

    expect(lessonApi.create).toHaveBeenCalledWith("k1", "s1", {
      title: "useState",
      videoUrl: "",
      content: "",
      durationSeconds: 300,
      isPreview: true,
      resources: [],
    });
  });

  it("đổi thứ tự chương gửi đủ danh sách sectionIds", async () => {
    vi.mocked(courseApi.get).mockResolvedValue({ data: makeCourse() });
    const sections = [
      { _id: "s1", title: "A", order: 0 },
      { _id: "s2", title: "B", order: 1 },
    ];
    vi.mocked(sectionApi.list).mockResolvedValue({ data: sections });
    vi.mocked(sectionApi.reorder).mockResolvedValue({ data: [sections[1], sections[0]] });
    renderDetail(users.instructor);

    await screen.findByText(/Chương 2: B/);
    await userEvent.click(screen.getAllByRole("button", { name: "Đưa chương xuống" })[0]);

    expect(sectionApi.reorder).toHaveBeenCalledWith("k1", ["s2", "s1"]);
    expect(await screen.findByText(/Chương 1: B/)).toBeInTheDocument();
  });
});
