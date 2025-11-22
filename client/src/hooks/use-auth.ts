import { useState, useContext, createContext, useEffect, type ReactNode, createElement } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://cvnalogvvfzapxmozdyh.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

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

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("accessToken");
    const storedEmail = localStorage.getItem("userEmail");
    if (stored && storedEmail) {
      setAccessToken(stored);
      setUser({ id: stored.substring(0, 20), email: storedEmail });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.error || error.msg || "Login failed");
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error("Login failed - no access token received");
    }

    const token = data.access_token;
    const authUser = data.user;
    
    if (!authUser || !authUser.id) {
      throw new Error("Login failed - invalid user data");
    }
    
    setUser({ id: authUser.id, email: authUser.email });
    setAccessToken(token);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("userEmail", authUser.email);
  };

  const signup = async (email: string, password: string) => {
    const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!signupResponse.ok) {
      const error = await signupResponse.json();
      throw new Error(error.error_description || error.error || error.msg || "Signup failed");
    }

    const signupData = await signupResponse.json();
    
    if (!signupData.id || !signupData.email) {
      throw new Error("Signup failed - invalid response");
    }

    // After signup, automatically log in to get access token
    const loginResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(error.error_description || error.error || error.msg || "Login after signup failed");
    }

    const loginData = await loginResponse.json();
    
    if (!loginData.access_token) {
      throw new Error("Signup succeeded but could not get access token");
    }

    const token = loginData.access_token;
    const authUser = loginData.user;
    
    if (!authUser || !authUser.id) {
      throw new Error("Invalid user data after signup");
    }
    
    setUser({ id: authUser.id, email: authUser.email });
    setAccessToken(token);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("userEmail", authUser.email);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
  };

  const value: AuthContextType = {
    user,
    loading,
    accessToken,
    login,
    signup,
    logout,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
