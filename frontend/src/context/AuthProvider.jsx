import { useCallback, useEffect, useMemo, useState } from "react";
import { onSessionExpired, tokenStorage } from "../api/client";
import { authApi } from "../api/services";
import { AuthContext } from "./auth-context";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.getAccess() || tokenStorage.getRefresh()));

  // Khôi phục phiên đăng nhập từ token đã lưu.
  useEffect(() => {
    if (!loading) return;
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => onSessionExpired(() => setUser(null)), []);

  const handleAuthResult = useCallback((res) => {
    const { user: nextUser, accessToken, refreshToken } = res.data;
    tokenStorage.set({ accessToken, refreshToken });
    setUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback(
    (email, password) => authApi.login({ email, password }).then(handleAuthResult),
    [handleAuthResult]
  );

  const register = useCallback(
    (fullName, email, password) => authApi.register({ fullName, email, password }).then(handleAuthResult),
    [handleAuthResult]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout(tokenStorage.getRefresh());
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, logoutAll }),
    [user, loading, login, register, logout, logoutAll]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
