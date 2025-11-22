import { useState, useContext, createContext, useEffect, type ReactNode } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://cvnalogvvfzapxmozdyh.supabase.co";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("accessToken");
    if (stored) {
      setAccessToken(stored);
      const email = localStorage.getItem("userEmail") || "user";
      setUser({ id: stored.substring(0, 20), email });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.error || "Login failed");
    }

    const result = await response.json();
    const access_token = result.access_token;
    const authUser = result.user;
    setUser({ id: authUser.id, email: authUser.email });
    setAccessToken(access_token);
    localStorage.setItem("accessToken", access_token);
    localStorage.setItem("userEmail", authUser.email);
  };

  const signup = async (email: string, password: string) => {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.error || "Signup failed");
    }

    const result = await response.json();
    const access_token = result.access_token;
    const authUser = result.user;
    setUser({ id: authUser.id, email: authUser.email });
    setAccessToken(access_token);
    localStorage.setItem("accessToken", access_token);
    localStorage.setItem("userEmail", authUser.email);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
  };

  const contextValue: AuthContextType = { user, loading, accessToken, login, signup, logout };

  return (
    <AuthContext.Provider value={contextValue}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
