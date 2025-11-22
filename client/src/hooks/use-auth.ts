import { useState, useContext, createContext, useEffect, type ReactNode } from "react";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("accessToken");
    if (stored) {
      setAccessToken(stored);
      fetch("/api/profile", {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((res) => res.json())
        .then((profile) => {
          setUser({ id: profile.id, email: profile.email || "user" });
        })
        .catch(() => {
          localStorage.removeItem("accessToken");
          setAccessToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const { user: authUser, session } = await response.json();
    setUser({ id: authUser.id, email: authUser.email });
    setAccessToken(session.access_token);
    localStorage.setItem("accessToken", session.access_token);
  };

  const signup = async (email: string, password: string) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Signup failed");
    }

    const { user: authUser, session } = await response.json();
    setUser({ id: authUser.id, email: authUser.email });
    setAccessToken(session.access_token);
    localStorage.setItem("accessToken", session.access_token);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
  };

  return (
    <AuthContext.Provider value={{ user, loading, accessToken, login, signup, logout }}>
      {children}
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
