import axios from "axios";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// Vite proxy chuyển /api sang backend (xem vite.config.js).
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Các listener được gọi khi phiên đăng nhập hết hạn hẳn (refresh thất bại).
const sessionExpiredListeners = new Set();
export const onSessionExpired = (listener) => {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
};

// Backend xoay vòng refresh token: chỉ cho phép một request refresh tại một thời điểm,
// nếu không token cũ bị dùng lại và cả family bị thu hồi.
let refreshPromise = null;

export const refreshTokens = () => {
  if (!refreshPromise) {
    const refreshToken = tokenStorage.getRefresh();
    refreshPromise = (refreshToken
      ? axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
      : Promise.reject(new Error("Không có refresh token."))
    )
      .then((res) => {
        tokenStorage.set(res.data.data);
        return res.data.data;
      })
      .catch((error) => {
        tokenStorage.clear();
        sessionExpiredListeners.forEach((listener) => listener());
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const shouldRefresh =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !NO_REFRESH_PATHS.some((path) => original.url?.startsWith(path)) &&
      tokenStorage.getRefresh();

    if (!shouldRefresh) throw error;

    original._retry = true;
    const { accessToken } = await refreshTokens();
    original.headers.Authorization = `Bearer ${accessToken}`;
    return api(original);
  }
);

export const getErrorMessage = (error, fallback = "Đã xảy ra lỗi.") =>
  error?.response?.data?.message || error?.message || fallback;

export default api;
