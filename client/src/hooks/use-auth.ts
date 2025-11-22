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
  signupMessage: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearSignupMessage: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signupMessage, setSignupMessage] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const stored = localStorage.getItem("accessToken");
        const storedEmail = localStorage.getItem("userEmail");
        const storedUserId = localStorage.getItem("userId");
        
        if (stored && storedEmail && storedUserId) {
          // Validate token with Supabase
          const validateResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
              "Authorization": `Bearer ${stored}`,
              "apikey": SUPABASE_ANON_KEY,
            },
          });

          if (validateResponse.ok) {
            const userData = await validateResponse.json();
            if (userData && userData.id) {
              setAccessToken(stored);
              setUser({ id: userData.id, email: userData.email });
            } else {
              // Invalid token, clear storage
              localStorage.removeItem("accessToken");
              localStorage.removeItem("userEmail");
              localStorage.removeItem("userId");
            }
          } else {
            // Token validation failed, clear storage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userId");
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
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
      const errorMsg = error.error_description || error.error || error.msg || "Login failed";
      
      // Check if email is not confirmed
      if (errorMsg.includes("Email not confirmed") || errorMsg.includes("invalid_credentials")) {
        throw new Error("Email not confirmed or invalid credentials. Please check your email for confirmation link.");
      }
      throw new Error(errorMsg);
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

    // Check if email is confirmed
    if (!authUser.email_confirmed_at) {
      throw new Error("Please confirm your email before logging in. Check your inbox for the confirmation link.");
    }
    
    setUser({ id: authUser.id, email: authUser.email });
    setAccessToken(token);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("userEmail", authUser.email);
    localStorage.setItem("userId", authUser.id);
    setSignupMessage(null);
  };

  const signup = async (email: string, password: string) => {
    // Get the current domain for redirect URL
    const redirectUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/` 
      : "http://localhost:5000/";

    const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ 
        email, 
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      }),
    });

    if (!signupResponse.ok) {
      const error = await signupResponse.json();
      throw new Error(error.error_description || error.error || error.msg || "Signup failed");
    }

    const signupData = await signupResponse.json();
    
    if (!signupData.id || !signupData.email) {
      throw new Error("Signup failed - invalid response");
    }

    // Do NOT log user in after signup
    // User must confirm their email first
    // Clear any existing auth state
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    setUser(null);
    setAccessToken(null);
    
    // Show message to check email
    const message = `Account created! We've sent a confirmation link to ${email}. Please check your email to confirm your account before logging in.`;
    setSignupMessage(message);
  };

  const clearSignupMessage = () => {
    setSignupMessage(null);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    setSignupMessage(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    accessToken,
    signupMessage,
    login,
    signup,
    logout,
    clearSignupMessage,
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
