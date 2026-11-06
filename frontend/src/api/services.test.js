import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "./client";
import { authApi, categoryApi, courseApi, lessonApi, sectionApi } from "./services";

// Kiểm tra mỗi hàm gọi đúng method + URL như backend/src/routes.
describe("api services", () => {
  beforeEach(() => {
    for (const method of ["get", "post", "put", "patch", "delete"]) {
      vi.spyOn(api, method).mockResolvedValue({ data: { success: true } });
    }
  });

  it("auth endpoints", async () => {
    await authApi.login({ email: "a@test.com", password: "x" });
    await authApi.register({ fullName: "A", email: "a@test.com", password: "x" });
    await authApi.logout("rt");
    await authApi.logoutAll();
    await authApi.me();

    expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "a@test.com", password: "x" });
    expect(api.post).toHaveBeenCalledWith("/auth/logout", { refreshToken: "rt" });
    expect(api.post).toHaveBeenCalledWith("/auth/logout-all");
    expect(api.get).toHaveBeenCalledWith("/auth/me");
  });

  it("category endpoints", async () => {
    await categoryApi.list({ page: 2 });
    await categoryApi.create({ name: "Web" });
    await categoryApi.update("c1", { name: "Web 2" });
    await categoryApi.setStatus("c1", false);
    await categoryApi.remove("c1");

    expect(api.get).toHaveBeenCalledWith("/categories", { params: { page: 2 } });
    expect(api.put).toHaveBeenCalledWith("/categories/c1", { name: "Web 2" });
    expect(api.patch).toHaveBeenCalledWith("/categories/c1/status", { isActive: false });
    expect(api.delete).toHaveBeenCalledWith("/categories/c1");
  });

  it("course endpoints", async () => {
    await courseApi.mine({ status: "draft" });
    await courseApi.publish("k1");
    await courseApi.unpublish("k1");

    expect(api.get).toHaveBeenCalledWith("/courses/mine", { params: { status: "draft" } });
    expect(api.patch).toHaveBeenCalledWith("/courses/k1/publish");
    expect(api.patch).toHaveBeenCalledWith("/courses/k1/unpublish");
  });

  it("section và lesson endpoints lồng trong course", async () => {
    await sectionApi.reorder("k1", ["s2", "s1"]);
    await lessonApi.create("k1", "s1", { title: "Bài 1" });
    await lessonApi.reorder("k1", "s1", ["l2", "l1"]);

    expect(api.put).toHaveBeenCalledWith("/courses/k1/sections/reorder", { sectionIds: ["s2", "s1"] });
    expect(api.post).toHaveBeenCalledWith("/courses/k1/sections/s1/lessons", { title: "Bài 1" });
    expect(api.put).toHaveBeenCalledWith("/courses/k1/sections/s1/lessons/reorder", { lessonIds: ["l2", "l1"] });
  });
});
