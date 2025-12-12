// frontend/src/contexts/AuthContext.jsx
import React, {
  createContext,
  useEffect,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext.jsx";

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  // ---------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Shown only during initial boot
  const [isLoading, setIsLoading] = useState(true);

  // Shown during login/register buttons
  const [loading, setLoading] = useState(false);

  // Prevents refresh loop right after manual login
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  const { showToast } = useToast();

  // ---------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------
  const login = useCallback(async (email, password) => {
    setLoading(true);

    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      const token = data?.accessToken;

      if (token) {
        localStorage.setItem("token", token);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      setUser(data.user || null);
      setIsAuthenticated(true);
      setJustLoggedIn(true);

      return data.user;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------
  // REGISTER
  // ---------------------------------------------------------------------
  const register = useCallback(
    async (userData) => {
      setLoading(true);

      try {
        await api.post("/api/auth/register", userData);
        showToast("Registration successful! You can now log in.", "success");
      } catch (err) {
        console.error("Registration failed:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // ---------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.warn("Logout API failed, clearing local session anyway.");
    }

    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;

    setUser(null);
    setIsAuthenticated(false);
    setJustLoggedIn(false);

    showToast("You have been logged out.", "info");
  }, [showToast]);

  // ---------------------------------------------------------------------
  // TOKEN REFRESH EVENT LISTENERS
  // ---------------------------------------------------------------------
  useEffect(() => {
    const onTokenRefreshed = (event) => {
      const token = event.detail?.accessToken;
      if (!token) return;

      localStorage.setItem("token", token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    };

    const onAuthError = () => {
      console.warn("❌ Token refresh failed — forcing logout.");
      logout();
    };

    globalThis.addEventListener("token-refreshed", onTokenRefreshed);
    globalThis.addEventListener("auth-error", onAuthError);

    return () => {
      globalThis.removeEventListener("token-refreshed", onTokenRefreshed);
      globalThis.removeEventListener("auth-error", onAuthError);
    };
  }, [logout]);

  // ---------------------------------------------------------------------
  // REFRESH TOKEN HANDLER
  // ---------------------------------------------------------------------
  const refreshAndRetry = useCallback(async (signal) => {
    const resp = await api.post("/api/auth/refresh", {}, { signal });
    const token = resp?.data?.accessToken;

    if (!token) throw new Error("Refresh did not return a token");

    localStorage.setItem("token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    const me = await api.get("/api/auth/me", { signal });

    setUser(me.data);
    setIsAuthenticated(true);

    globalThis.dispatchEvent(
      new CustomEvent("token-refreshed", { detail: { accessToken: token } })
    );
  }, []);

  // ---------------------------------------------------------------------
  // INITIAL SESSION RESTORE
  // ---------------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const init = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoading(false);
        return;
      }

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      try {
        const me = await api.get("/api/auth/me", { signal });
        setUser(me.data);
        setIsAuthenticated(true);
      } catch (err) {
        const status = err?.response?.status;

        if (status === 401) {
          try {
            await refreshAndRetry(signal);
          } catch {
            logout();
          }
        }
      }

      setIsLoading(false);
    };

    // Do not fire init() again right after login
    if (!justLoggedIn) {
      init();
    } else {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [justLoggedIn, refreshAndRetry, logout]);

  // ---------------------------------------------------------------------
  // PROVIDER VALUE
  // ---------------------------------------------------------------------
  const providerValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      loading,
      login,
      register,
      logout,
      setUser,
    }),
    [user, isAuthenticated, isLoading, loading, login, register, logout]
  );

  // ---------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------
  return (
    <AuthContext.Provider value={providerValue}>
      {isLoading ? (
        <div className="loading">Initializing session...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
