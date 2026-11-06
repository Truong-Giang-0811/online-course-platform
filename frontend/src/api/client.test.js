import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api, { getErrorMessage, onSessionExpired, tokenStorage } from "./client";

// Adapter giả thay cho HTTP thật: trả về theo hàm handler(config).
const mockAdapter = (handler) => {
  api.defaults.adapter = vi.fn(async (config) => {
    const { status = 200, data = {} } = await handler(config);
    const response = { data, status, statusText: "", headers: {}, config };
    if (status >= 400) {
      throw new axios.AxiosError("Request failed", "ERR_BAD_RESPONSE", config, null, response);
    }
    return response;
  });
  return api.defaults.adapter;
};

describe("api client", () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it("gắn access token vào header Authorization", async () => {
    tokenStorage.set({ accessToken: "access-1", refreshToken: "refresh-1" });
    const adapter = mockAdapter(() => ({ data: { ok: true } }));

    await api.get("/auth/me");

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe("Bearer access-1");
  });

  it("khi gặp 401 thì refresh token rồi gửi lại request", async () => {
    tokenStorage.set({ accessToken: "old", refreshToken: "refresh-old" });
    const refreshSpy = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { accessToken: "new", refreshToken: "refresh-new" } },
    });
    mockAdapter((config) =>
      config.headers.Authorization === "Bearer new" ? { data: { ok: true } } : { status: 401, data: { message: "expired" } }
    );

    const res = await api.get("/courses");

    expect(res.data).toEqual({ ok: true });
    expect(refreshSpy).toHaveBeenCalledWith("/api/auth/refresh", { refreshToken: "refresh-old" });
    expect(tokenStorage.getAccess()).toBe("new");
    expect(tokenStorage.getRefresh()).toBe("refresh-new");
  });

  it("nhiều request 401 cùng lúc chỉ gọi refresh một lần (tránh dùng lại refresh token)", async () => {
    tokenStorage.set({ accessToken: "old", refreshToken: "refresh-old" });
    const refreshSpy = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { accessToken: "new", refreshToken: "refresh-new" } },
    });
    mockAdapter((config) => (config.headers.Authorization === "Bearer new" ? { data: {} } : { status: 401 }));

    await Promise.all([api.get("/courses"), api.get("/categories"), api.get("/auth/me")]);

    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it("refresh thất bại thì xóa token và báo phiên hết hạn", async () => {
    tokenStorage.set({ accessToken: "old", refreshToken: "refresh-old" });
    vi.spyOn(axios, "post").mockRejectedValue(new Error("revoked"));
    mockAdapter(() => ({ status: 401 }));
    const listener = vi.fn();
    const unsubscribe = onSessionExpired(listener);

    await expect(api.get("/courses")).rejects.toThrow("revoked");

    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getRefresh()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("không refresh khi đăng nhập sai (401 từ /auth/login)", async () => {
    tokenStorage.set({ refreshToken: "refresh-old" });
    const refreshSpy = vi.spyOn(axios, "post");
    mockAdapter(() => ({ status: 401, data: { message: "Email hoặc mật khẩu không chính xác." } }));

    const error = await api.post("/auth/login", {}).catch((e) => e);

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(getErrorMessage(error)).toBe("Email hoặc mật khẩu không chính xác.");
  });
});
