"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// ─── Types ────────────────────────────────────

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  googleLogin: (credential: string, role?: string) => Promise<AuthResult>;
  logout: () => void;
  resendVerification: (email: string) => Promise<AuthResult>;
}

interface AuthResult {
  success: boolean;
  message: string;
  code?: string;
}

interface RegisterData {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  company?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── Context ──────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Invalid stored data, clear it
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    setLoading(false);
  }, []);

  // Persist auth state
  const saveAuth = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  }, []);

  // ─── Login ────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();

        if (json.success && json.data?.token) {
          saveAuth(json.data.token, json.data.user);
          return { success: true, message: json.message };
        }

        return {
          success: false,
          message: json.message || "Erreur de connexion.",
          code: json.code,
        };
      } catch {
        return {
          success: false,
          message: "Impossible de contacter le serveur.",
        };
      }
    },
    [saveAuth]
  );

  // ─── Register ─────────────────────────────────

  const register = useCallback(
    async (data: RegisterData): Promise<AuthResult> => {
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();

        return {
          success: json.success,
          message: json.message || "Erreur lors de l'inscription.",
        };
      } catch {
        return {
          success: false,
          message: "Impossible de contacter le serveur.",
        };
      }
    },
    [saveAuth]
  );

  // ─── Google Login ─────────────────────────────

  const googleLogin = useCallback(
    async (code: string, role?: string): Promise<AuthResult> => {
      try {
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, role }),
        });
        const json = await res.json();

        if (json.success && json.data?.token) {
          saveAuth(json.data.token, json.data.user);
          return { success: true, message: json.message };
        }

        return {
          success: false,
          message: json.message || "Erreur de connexion Google.",
        };
      } catch {
        return {
          success: false,
          message: "Impossible de contacter le serveur.",
        };
      }
    },
    [saveAuth]
  );

  // ─── Resend Verification ──────────────────────

  const resendVerification = useCallback(
    async (email: string): Promise<AuthResult> => {
      try {
        const res = await fetch(`${API_BASE}/auth/resend-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const json = await res.json();

        return {
          success: json.success,
          message: json.message,
        };
      } catch {
        return {
          success: false,
          message: "Impossible de contacter le serveur.",
        };
      }
    },
    []
  );

  // ─── Logout ───────────────────────────────────

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("freelanceit_onboarded");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        googleLogin,
        logout,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
