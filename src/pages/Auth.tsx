import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createProfile, googleLoginUrl, login, register } from "@/lib/platform-api";
import { saveSession } from "@/lib/session";

type Mode = "login" | "signup";

const AuthShell = ({ mode }: { mode: Mode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const auth =
        mode === "login"
          ? await login(email, password)
          : await register(email, password);
      saveSession({
        accessToken: auth.tokens.access_token,
        refreshToken: auth.tokens.refresh_token,
        user: {
          id: auth.user.id,
          email: auth.user.email,
          role: auth.user.role,
        },
      });
      if (mode === "signup") {
        try {
          await createProfile(auth.user.id, auth.user.email);
        } catch {
          // Profile may already exist; continue.
        }
      }
      navigate("/dashboard/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden border-r border-border bg-surface lg:block">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_30%_40%,#000_20%,transparent_75%)]" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/"><Logo /></Link>
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
              {isLogin ? "Welcome back." : "Markets reward those who see ahead."}
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              {isLogin
                ? "Pick up exactly where you left off — your watchlists, holdings and predictions are ready."
                : "Set up your edge in under a minute. AI-driven insights, curated news, and elegant tools — all in one place."}
            </p>
            <div className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-gradient-accent" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Trusted by 24k+ traders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="lg:hidden"><Logo /></Link>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
          >
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {isLogin ? "Sign in" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? "Use your credentials to access ForeSightX." : "Just a few details. You can complete your profile later."}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" placeholder="Aarav Sharma" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@foresightx.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                      Forgot?
                    </button>
                  )}
                </div>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
              </div>
              {error && <p className="text-sm text-loss">{error}</p>}

              <Button type="submit" className="h-11 w-full rounded-lg shadow-glow" disabled={loading}>
                {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>

              <div className="relative my-4 flex items-center">
                <div className="h-px flex-1 bg-border" />
                <span className="px-3 text-xs uppercase tracking-wider text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button type="button" variant="outline" className="h-11 w-full rounded-lg" onClick={() => (window.location.href = googleLoginUrl())}>
                Continue with Google
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>Don't have an account?{" "}
                  <Link to="/signup" className="font-medium text-accent hover:underline">Sign up</Link>
                </>
              ) : (
                <>Already a member?{" "}
                  <Link to="/login" className="font-medium text-accent hover:underline">Sign in</Link>
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export const LoginPage = () => <AuthShell mode="login" />;
export const SignupPage = () => <AuthShell mode="signup" />;
