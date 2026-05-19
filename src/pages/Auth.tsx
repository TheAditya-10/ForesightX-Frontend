import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { googleLoginUrl, login, register, type SignupProfileInput } from "@/lib/platform-api";
import { saveSession } from "@/lib/session";

type Mode = "login" | "signup";
type SignupStep = 0 | 1 | 2;

const passwordRules = [
  "minimum 8 characters",
  "one uppercase letter",
  "one lowercase letter",
  "one number",
  "one symbol",
];

function getPasswordError(value: string) {
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Password must include one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must include one lowercase letter.";
  if (!/\d/.test(value)) return "Password must include one number.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Password must include one symbol.";
  return null;
}

const AuthShell = ({ mode }: { mode: Mode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pan, setPan] = useState("");
  const [city, setCity] = useState("");
  const [riskLevel, setRiskLevel] = useState<SignupProfileInput["riskLevel"]>("medium");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Avatar pool (randomized on first render)
  const AVATARS = [
    "/illustrations/avatars/avatar-1.svg",
    "/illustrations/avatars/avatar-2.svg",
    "/illustrations/avatars/avatar-3.svg",
    "/illustrations/avatars/avatar-4.svg",
    "/illustrations/avatars/avatar-5.svg",
    "/illustrations/avatars/avatar-6.svg",
  ];

  const avatars = useMemo(() => {
    const pool = AVATARS.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 4);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && signupStep < 2) {
      setSignupStep((signupStep + 1) as SignupStep);
      setError(null);
      return;
    }

    const passwordError = getPasswordError(password);
    if (mode === "signup" && passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const auth =
        mode === "login"
          ? await login(email, password)
          : await register(email, password, {
              name,
              email,
              phone,
              pan,
              city,
              photo: "",
              riskLevel,
            });
      saveSession({
        accessToken: auth.tokens.access_token,
        refreshToken: auth.tokens.refresh_token,
        user: {
          id: auth.user.id,
          email: auth.user.email,
          role: auth.user.role,
        },
      });
      navigate("/dashboard/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";
  const stepLabel = ["Personal details", "Contact details", "Security"][signupStep];

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden border-r border-border bg-surface lg:block">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_60%_60%_at_30%_40%,#000_20%,transparent_75%)]" />

        {/* Decorative illustration - centered and responsive for light/dark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <img
            src="/illustrations/hero-light.svg"
            alt="ForeSightX illustration"
            className="block dark:hidden lg:block max-w-[520px] w-full px-8 opacity-95"
          />
          <img
            src="/illustrations/hero-dark.svg"
            alt="ForeSightX illustration"
            className="hidden dark:block lg:block max-w-[520px] w-full px-8 opacity-95"
          />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between p-10">
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
                {avatars.map((src, i) => (
                  <img key={i} src={src} alt={`Trader avatar ${i + 1}`} className="h-8 w-8 rounded-full border-2 border-background object-cover" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Trusted by 24k+ traders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-6">
          <Link to="/" className="lg:hidden"><Logo /></Link>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-6">
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
              {isLogin ? "Use your credentials to access ForeSightX." : stepLabel}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full ${step <= signupStep ? "bg-accent" : "bg-border"}`}
                    />
                  ))}
                </div>
              )}

              {!isLogin && signupStep === 0 && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" placeholder="Aarav Sharma" value={name} onChange={(e) => setName(e.target.value)} required className="h-11" />
                </div>
              )}

              {(isLogin || (!isLogin && signupStep === 0)) && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@foresightx.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>
              )}

              {!isLogin && signupStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN</Label>
                    <Input id="pan" placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Mumbai, IN" value={city} onChange={(e) => setCity(e.target.value)} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="riskLevel">Risk level</Label>
                    <select
                      id="riskLevel"
                      value={riskLevel}
                      onChange={(e) => setRiskLevel(e.target.value as SignupProfileInput["riskLevel"])}
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </>
              )}

              {(isLogin || (!isLogin && signupStep === 2)) && (
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
                  {!isLogin && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Password rules: {passwordRules.join(", ")}.
                    </p>
                  )}
                </div>
              )}
              {error && <p className="text-sm text-loss">{error}</p>}

              <div className="flex gap-2">
                {!isLogin && signupStep > 0 && (
                  <Button type="button" variant="outline" className="h-11 flex-1 rounded-lg" onClick={() => setSignupStep((signupStep - 1) as SignupStep)} disabled={loading}>
                    Back
                  </Button>
                )}
                <Button type="submit" className="h-11 flex-1 rounded-lg shadow-glow" disabled={loading}>
                  {loading ? "Please wait…" : isLogin ? "Sign in" : signupStep < 2 ? "Continue" : "Create account"}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

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
