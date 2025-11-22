import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [, navigate] = useLocation();
  const { login, signup, signupMessage, clearSignupMessage } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "❌ Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    if (!password || password.length < 6) {
      toast({
        title: "❌ Invalid password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast({ title: "✅ Login successful!", description: "Redirecting to dashboard..." });
        navigate("/");
      } else {
        await signup(email, password);
        toast({ title: "✅ Account created!", description: "Check your email for confirmation link" });
        setEmail("");
        setPassword("");
      }
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAuth = () => {
    clearSignupMessage();
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Login to access your job applications"
              : "Sign up to start your job journey"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signupMessage ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md">
                <p className="text-sm text-blue-900 dark:text-blue-100">{signupMessage}</p>
              </div>
              <Button
                onClick={() => {
                  clearSignupMessage();
                  setIsLogin(true);
                  setEmail("");
                  setPassword("");
                }}
                className="w-full"
                data-testid="button-go-login"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-password"
                  />
                  {!isLogin && (
                    <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  data-testid="button-submit"
                >
                  {loading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={handleToggleAuth}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  data-testid="button-toggle-auth"
                >
                  {isLogin ? "Need an account? Sign up" : "Have an account? Login"}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
