import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Activity,
  BellRing,
  Bot,
  BrainCircuit,
  CandlestickChart,
  Cpu,
  Database,
  KeyRound,
  LayoutDashboard,
  LineChart as LineChartIcon,
  LogOut,
  Network,
  Newspaper,
  RefreshCcw,
  Search,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  analyzeTicker,
  buildGoogleLoginUrl,
  fetchAnalysisJobs,
  fetchAuthHealth,
  fetchDataHealth,
  fetchHistory,
  fetchIndicators,
  fetchLatestPrediction,
  fetchModels,
  fetchNews,
  fetchOrchestrationHealth,
  fetchPatternHealth,
  fetchPortfolio,
  fetchPredictionHistory,
  fetchPrice,
  fetchProfileHealth,
  fetchRisk,
  fetchSignalPrediction,
  login,
  logout,
  refreshSession,
  register,
  updatePortfolioPosition,
  verifySession,
} from "./api";
import { buildFallbackBundle } from "./fallback";
import type {
  AnalyzeEvent,
  AppControls,
  AppDataBundle,
  AuthResponse,
  PortfolioHolding,
  ServiceHealth,
  ServiceKey,
  ServiceMode,
  SessionState,
} from "./types";

type ViewKey = "dashboard" | "explainability" | "portfolio" | "models" | "alerts";
type AuthTab = "login" | "register";

const ACCESS_TOKEN_KEY = "foresightx_access_token";
const REFRESH_TOKEN_KEY = "foresightx_refresh_token";
const USER_KEY = "foresightx_user";

const chartColors = ["#a4e6ff", "#26faa9", "#d1bcff", "#ffb4ab", "#00d1ff"];

const navItems: Array<{
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
  summary: string;
}> = [
  {
    key: "dashboard",
    label: "Command Center",
    icon: LayoutDashboard,
    summary: "Market, portfolio, and AI posture in one investor-facing surface",
  },
  {
    key: "explainability",
    label: "Explainability",
    icon: BrainCircuit,
    summary: "Decision trace, node execution, and orchestration job history",
  },
  {
    key: "portfolio",
    label: "Portfolio",
    icon: Wallet,
    summary: "Live holdings, exposure, risk, and position updates",
  },
  {
    key: "models",
    label: "Pattern Lab",
    icon: LineChartIcon,
    summary: "Prediction service models, forecasts, and historical errors",
  },
  {
    key: "alerts",
    label: "Alerts",
    icon: BellRing,
    summary: "Synthesized AI alerts, service status, and market events",
  },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function resolveMode(results: PromiseSettledResult<unknown>[]): ServiceMode {
  const fulfilled = results.filter((result) => result.status === "fulfilled").length;

  if (fulfilled === results.length) {
    return "live";
  }

  if (fulfilled === 0) {
    return "fallback";
  }

  return "mixed";
}

function resolveValue<T>(result: PromiseSettledResult<T>, fallback: T) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function healthTone(status: string) {
  if (status === "ok" || status === "ready") {
    return "positive";
  }

  if (status === "degraded") {
    return "warning";
  }

  return "negative";
}

function loadStoredSession() {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);

  if (!accessToken || !refreshToken || !rawUser) {
    return null;
  }

  try {
    return {
      accessToken,
      refreshToken,
      user: JSON.parse(rawUser),
    } as SessionState;
  } catch {
    return null;
  }
}

function persistSession(response: AuthResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.tokens.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));

  return {
    user: response.user,
    accessToken: response.tokens.access_token,
    refreshToken: response.tokens.refresh_token,
  } satisfies SessionState;
}

function clearStoredSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function App() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [controls, setControls] = useState<AppControls>({ ticker: "AAPL", event: "market_update" });
  const [draftTicker, setDraftTicker] = useState("AAPL");
  const [draftEvent, setDraftEvent] = useState<AnalyzeEvent>("market_update");
  const [session, setSession] = useState<SessionState | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<AppDataBundle>(() =>
    buildFallbackBundle({ ticker: "AAPL", event: "market_update" }, null)
  );
  const [serviceModes, setServiceModes] = useState<Record<ServiceKey, ServiceMode>>({
    auth: "fallback",
    data: "fallback",
    profile: "fallback",
    pattern: "fallback",
    orchestration: "fallback",
  });
  const [platformMessage, setPlatformMessage] = useState(
    "Authenticate or enter preview to initialize the platform surface."
  );
  const [platformLoading, setPlatformLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState(10);
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);

  const effectiveUserId = session?.user.id ?? "preview-user";

  useEffect(() => {
    document.title = `ForesightX | ${navItems.find((item) => item.key === activeView)?.label ?? "Platform"}`;
  }, [activeView]);

  useEffect(() => {
    void bootstrapSession();
  }, []);

  useEffect(() => {
    if (!session && !previewMode) {
      return;
    }

    void refreshPlatform();
  }, [controls, session, previewMode]);

  async function bootstrapSession() {
    const stored = loadStoredSession();

    if (!stored) {
      setAuthLoading(false);
      return;
    }

    try {
      const verify = await verifySession(stored.accessToken);
      setSession({
        ...stored,
        user: verify.user,
      });
    } catch {
      try {
        const refreshed = await refreshSession({ refresh_token: stored.refreshToken });
        setSession(persistSession(refreshed));
      } catch {
        clearStoredSession();
        setSession(null);
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError(null);

    try {
      const response =
        authTab === "register"
          ? await register({ email: authEmail, password: authPassword })
          : await login({ email: authEmail, password: authPassword });

      setSession(persistSession(response));
      setPreviewMode(false);
      setAuthEmail("");
      setAuthPassword("");
    } catch (error) {
      setAuthError("Authentication failed. Check the auth service and your credentials.");
    } finally {
      setAuthBusy(false);
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    if (session) {
      try {
        await logout({ refresh_token: session.refreshToken }, session.accessToken);
      } catch {
        // Logout should still clear the local session if the backend is unavailable.
      }
    }

    clearStoredSession();
    setSession(null);
    setPreviewMode(false);
  }

  async function refreshPlatform() {
    const fallback = buildFallbackBundle(controls, session, "degraded");
    setPlatformLoading(true);
    setTradeMessage(null);

    const [
      authHealthResult,
      dataHealthResult,
      profileHealthResult,
      patternHealthResult,
      orchestrationHealthResult,
      priceResult,
      indicatorsResult,
      historyResult,
      newsResult,
      analysisResult,
      jobsResult,
      portfolioResult,
      riskResult,
      latestPredictionResult,
      signalPredictionResult,
      predictionHistoryResult,
      modelsResult,
    ] = await Promise.allSettled([
      fetchAuthHealth(),
      fetchDataHealth(),
      fetchProfileHealth(),
      fetchPatternHealth(),
      fetchOrchestrationHealth(),
      fetchPrice(controls.ticker),
      fetchIndicators(controls.ticker),
      fetchHistory(controls.ticker),
      fetchNews(controls.ticker),
      analyzeTicker({
        user_id: effectiveUserId,
        ticker: controls.ticker,
        event: controls.event,
      }),
      fetchAnalysisJobs(effectiveUserId, 12),
      fetchPortfolio(effectiveUserId),
      fetchRisk(effectiveUserId),
      fetchLatestPrediction({ symbol: controls.ticker }),
      fetchSignalPrediction({ ticker: controls.ticker }),
      fetchPredictionHistory(controls.ticker, 24),
      fetchModels(),
    ]);

    const nextHealth: Record<ServiceKey, ServiceHealth> = {
      auth: resolveValue(authHealthResult, fallback.health.auth),
      data: resolveValue(dataHealthResult, fallback.health.data),
      profile: resolveValue(profileHealthResult, fallback.health.profile),
      pattern: resolveValue(patternHealthResult, fallback.health.pattern),
      orchestration: resolveValue(orchestrationHealthResult, fallback.health.orchestration),
    };

    setBundle({
      price: resolveValue(priceResult, fallback.price),
      indicators: resolveValue(indicatorsResult, fallback.indicators),
      history: resolveValue(historyResult, fallback.history),
      news: resolveValue(newsResult, fallback.news),
      analysis: resolveValue(analysisResult, fallback.analysis),
      jobs: resolveValue(jobsResult, { jobs: fallback.jobs }).jobs,
      portfolio: resolveValue(portfolioResult, fallback.portfolio),
      risk: resolveValue(riskResult, fallback.risk),
      latestPrediction: resolveValue(latestPredictionResult, fallback.latestPrediction),
      signalPrediction: resolveValue(signalPredictionResult, fallback.signalPrediction),
      predictionHistory: resolveValue(predictionHistoryResult, fallback.predictionHistory),
      models: resolveValue(modelsResult, { models: fallback.models }).models,
      health: nextHealth,
    });

    const nextModes: Record<ServiceKey, ServiceMode> = {
      auth: resolveMode([authHealthResult]),
      data: resolveMode([dataHealthResult, priceResult, indicatorsResult, historyResult, newsResult]),
      profile: resolveMode([profileHealthResult, portfolioResult, riskResult]),
      pattern: resolveMode([patternHealthResult, latestPredictionResult, signalPredictionResult, predictionHistoryResult, modelsResult]),
      orchestration: resolveMode([orchestrationHealthResult, analysisResult, jobsResult]),
    };
    setServiceModes(nextModes);
    setLastSync(new Date().toISOString());

    const liveCount = Object.values(nextModes).filter((mode) => mode === "live").length;
    if (liveCount === 5) {
      setPlatformMessage("All five microservices are responding live through the frontend gateway.");
    } else if (liveCount === 0) {
      setPlatformMessage("The UI is running in contract-aligned preview mode because live services were unavailable.");
    } else {
      setPlatformMessage(`${liveCount} of 5 microservices are live. The remaining surfaces are falling back to preview-safe data.`);
    }

    setPlatformLoading(false);
  }

  async function handleTrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTradeMessage(null);

    if (!session) {
      setTradeMessage("Portfolio updates require an authenticated user because the profile service stores user-owned positions.");
      return;
    }

    try {
      await updatePortfolioPosition({
        user_id: session.user.id,
        ticker: controls.ticker,
        quantity:
          bundle.analysis.action === "SELL"
            ? -Math.abs(tradeQuantity)
            : Math.abs(tradeQuantity),
      });
      setTradeMessage("Portfolio service updated successfully. Refreshing platform state.");
      await refreshPlatform();
    } catch {
      setTradeMessage("Profile update failed. Check the profile service, seeded user data, and position payload.");
    }
  }

  const marketSeries = useMemo(
    () =>
      bundle.history.points.map((point) => ({
        time: new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        close: point.close,
      })),
    [bundle.history.points]
  );

  const performanceDelta = useMemo(() => {
    const first = bundle.history.points[0]?.close ?? bundle.price.price;
    const last = bundle.history.points.at(-1)?.close ?? bundle.price.price;
    return ((last - first) / first) * 100;
  }, [bundle.history.points, bundle.price.price]);

  const allocationSeries = useMemo(() => {
    const total = bundle.portfolio.holdings.reduce((sum, holding) => sum + holding.current_value, 0);
    return bundle.portfolio.holdings.map((holding) => ({
      name: holding.ticker,
      value: holding.current_value,
      share: total > 0 ? (holding.current_value / total) * 100 : 0,
    }));
  }, [bundle.portfolio.holdings]);

  const alerts = useMemo(() => {
    const synthesized = [
      {
        title: `${bundle.analysis.action} signal on ${bundle.price.ticker}`,
        tone: bundle.analysis.action === "BUY" ? "positive" : bundle.analysis.action === "SELL" ? "negative" : "neutral",
        body: bundle.analysis.reason[0],
        meta: `Confidence ${Math.round(bundle.analysis.confidence * 100)}%`,
      },
      {
        title: `Pattern service predicts ${bundle.signalPrediction.prediction}`,
        tone: bundle.signalPrediction.prediction === "bullish" ? "positive" : "negative",
        body: `Expected move ${formatPercent(bundle.latestPrediction.predicted_return * 100, 2)} into next close.`,
        meta: `Model ${bundle.latestPrediction.model_type}`,
      },
      ...bundle.news.headlines.slice(0, 3).map((headline) => ({
        title: headline.headline,
        tone: "info",
        body: `${headline.source} · ${formatDateTime(headline.timestamp)}`,
        meta: bundle.price.ticker,
      })),
      ...Object.entries(bundle.health).map(([key, health]) => ({
        title: `${key} service is ${health.status}`,
        tone: healthTone(health.status),
        body: `Last heartbeat ${formatDateTime(health.timestamp)}`,
        meta: health.service,
      })),
    ];

    return synthesized;
  }, [bundle]);

  if (authLoading) {
    return <div className="splash-screen">Initializing ForesightX platform session...</div>;
  }

  if (!session && !previewMode) {
    return (
      <AuthScreen
        authBusy={authBusy}
        authEmail={authEmail}
        authError={authError}
        authPassword={authPassword}
        authTab={authTab}
        onAuthEmailChange={setAuthEmail}
        onAuthPasswordChange={setAuthPassword}
        onAuthSubmit={handleAuthSubmit}
        onAuthTabChange={setAuthTab}
        onPreview={() => {
          setPreviewMode(true);
          setPlatformMessage("Preview mode active. Sign in when you want to test auth and profile persistence.");
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="eyebrow">Investor-ready Platform</p>
            <h1>ForesightX</h1>
            <p className="muted-copy">
              Trading intelligence across auth, data, orchestration, pattern inference, and
              profile context.
            </p>
          </div>
        </div>

        <div className="service-stack">
          {(["auth", "data", "profile", "pattern", "orchestration"] as ServiceKey[]).map((key) => (
            <ServicePill health={bundle.health[key]} key={key} mode={serviceModes[key]} />
          ))}
        </div>

        <nav className="main-nav" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeView;

            return (
              <button
                key={item.key}
                className={isActive ? "nav-item active" : "nav-item"}
                onClick={() => setActiveView(item.key)}
                type="button"
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.summary}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <p className="sidebar-stat-label">Operator</p>
          <strong>{session ? session.user.email : "Preview mode"}</strong>
          <span>{session ? `User ${session.user.id}` : "Using local preview contract"}</span>
          <button className="ghost-button" onClick={session ? handleLogout : () => setPreviewMode(false)} type="button">
            {session ? <LogOut size={15} /> : <KeyRound size={15} />}
            {session ? "Logout" : "Exit Preview"}
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Local testing console</p>
            <h2>{navItems.find((item) => item.key === activeView)?.label}</h2>
          </div>

          <div className="topbar-actions">
            <form className="control-bar" onSubmit={(event) => {
              event.preventDefault();
              setControls({
                ticker: draftTicker.trim().toUpperCase() || "AAPL",
                event: draftEvent,
              });
            }}>
              <label className="input-shell">
                <Search size={16} />
                <input
                  onChange={(event) => setDraftTicker(event.target.value)}
                  placeholder="Ticker"
                  value={draftTicker}
                />
              </label>
              <label className="select-shell">
                <span>Event</span>
                <select
                  onChange={(event) => setDraftEvent(event.target.value as AnalyzeEvent)}
                  value={draftEvent}
                >
                  <option value="market_update">market_update</option>
                  <option value="portfolio_rebalance">portfolio_rebalance</option>
                  <option value="risk_alert">risk_alert</option>
                </select>
              </label>
              <button className="primary-button" disabled={platformLoading} type="submit">
                <RefreshCcw className={platformLoading ? "spin" : ""} size={16} />
                {platformLoading ? "Syncing" : "Sync Platform"}
              </button>
            </form>

            {session ? (
              <div className="identity-chip">
                <KeyRound size={16} />
                <span>{session.user.email}</span>
              </div>
            ) : (
              <div className="identity-chip preview">
                <Sparkles size={16} />
                <span>Preview mode</span>
              </div>
            )}
          </div>
        </header>

        <section className="status-banner">
          <span>{platformLoading ? "Refreshing platform state..." : platformMessage}</span>
          <strong>
            {bundle.price.ticker} · {bundle.analysis.action} · {Math.round(bundle.analysis.confidence * 100)}% ·{" "}
            {bundle.signalPrediction.prediction}
          </strong>
        </section>

        {activeView === "dashboard" ? (
          <DashboardView
            action={bundle.analysis.action}
            allocationSeries={allocationSeries}
            controls={controls}
            health={bundle.health}
            historySeries={marketSeries}
            indicators={bundle.indicators}
            latestPrediction={bundle.latestPrediction}
            news={bundle.news.headlines}
            performanceDelta={performanceDelta}
            platformLoading={platformLoading}
            portfolio={bundle.portfolio}
            price={bundle.price.price}
            signalPrediction={bundle.signalPrediction}
            ticker={bundle.price.ticker}
            onTrade={handleTrade}
            onTradeQuantityChange={setTradeQuantity}
            tradeMessage={tradeMessage}
            tradeQuantity={tradeQuantity}
          />
        ) : null}

        {activeView === "explainability" ? (
          <ExplainabilityView analysis={bundle.analysis} jobs={bundle.jobs} />
        ) : null}

        {activeView === "portfolio" ? (
          <PortfolioView
            allocationSeries={allocationSeries}
            portfolio={bundle.portfolio}
            risk={bundle.risk.risk_level}
          />
        ) : null}

        {activeView === "models" ? (
          <ModelsView
            latestPrediction={bundle.latestPrediction}
            models={bundle.models}
            predictionHistory={bundle.predictionHistory}
            signalPrediction={bundle.signalPrediction}
          />
        ) : null}

        {activeView === "alerts" ? <AlertsView alerts={alerts} /> : null}

        <footer className="workspace-foot">
          <span>Last sync {formatDateTime(lastSync)}</span>
          <a href={buildGoogleLoginUrl()} target="_self">Google OAuth</a>
        </footer>
      </main>
    </div>
  );
}

function AuthScreen({
  authBusy,
  authEmail,
  authError,
  authPassword,
  authTab,
  onAuthEmailChange,
  onAuthPasswordChange,
  onAuthSubmit,
  onAuthTabChange,
  onPreview,
}: {
  authBusy: boolean;
  authEmail: string;
  authError: string | null;
  authPassword: string;
  authTab: AuthTab;
  onAuthEmailChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onAuthSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onAuthTabChange: (tab: AuthTab) => void;
  onPreview: () => void;
}) {
  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <p className="eyebrow">ForesightX Trading Platform</p>
        <h1>Production-grade intelligence for investor demos and local stack testing.</h1>
        <p className="muted-copy">
          Auth handles identity and token rotation. Data serves market state. Pattern serves forecasts.
          Orchestration turns them into actions. Profile owns the user’s portfolio context.
        </p>

        <div className="hero-grid">
          <FeatureCard icon={<KeyRound size={18} />} title="Auth">
            JWT access, refresh rotation, Google OAuth, and profile bootstrap.
          </FeatureCard>
          <FeatureCard icon={<Database size={18} />} title="Data">
            Prices, indicators, history, and news for live market framing.
          </FeatureCard>
          <FeatureCard icon={<Bot size={18} />} title="Orchestration">
            Explainable decision engine with job trace persistence.
          </FeatureCard>
          <FeatureCard icon={<Cpu size={18} />} title="Pattern">
            Model registry, latest forecasts, signal prediction, and history.
          </FeatureCard>
          <FeatureCard icon={<Wallet size={18} />} title="Profile">
            User risk, holdings, total value, and mutation via trade updates.
          </FeatureCard>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs">
          <button className={authTab === "login" ? "active" : ""} onClick={() => onAuthTabChange("login")} type="button">
            Login
          </button>
          <button className={authTab === "register" ? "active" : ""} onClick={() => onAuthTabChange("register")} type="button">
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={onAuthSubmit}>
          <label>
            <span>Email</span>
            <input onChange={(event) => onAuthEmailChange(event.target.value)} type="email" value={authEmail} />
          </label>
          <label>
            <span>Password</span>
            <input
              minLength={8}
              onChange={(event) => onAuthPasswordChange(event.target.value)}
              type="password"
              value={authPassword}
            />
          </label>
          {authError ? <p className="auth-error">{authError}</p> : null}
          <button className="primary-button wide" disabled={authBusy} type="submit">
            {authBusy ? "Working..." : authTab === "login" ? "Login to Platform" : "Create Account"}
          </button>
        </form>

        <a className="ghost-link" href={buildGoogleLoginUrl()} target="_self">
          Continue with Google OAuth
        </a>
        <button className="ghost-button wide" onClick={onPreview} type="button">
          Enter preview without auth
        </button>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="feature-card">
      <span className="feature-icon">{icon}</span>
      <strong>{title}</strong>
      <p>{children}</p>
    </article>
  );
}

function ServicePill({
  health,
  mode,
}: {
  health: ServiceHealth;
  mode: ServiceMode;
}) {
  return (
    <div className={`service-pill mode-${mode}`}>
      <span>{health.service}</span>
      <strong>{health.status}</strong>
      <small>{mode}</small>
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  icon,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        <span className="panel-icon">{icon}</span>
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

function DashboardView({
  ticker,
  price,
  portfolio,
  performanceDelta,
  indicators,
  historySeries,
  latestPrediction,
  signalPrediction,
  news,
  health,
  tradeQuantity,
  tradeMessage,
  onTradeQuantityChange,
  onTrade,
  action,
}: {
  ticker: string;
  price: number;
  portfolio: AppDataBundle["portfolio"];
  performanceDelta: number;
  indicators: AppDataBundle["indicators"];
  historySeries: Array<{ time: string; close: number }>;
  latestPrediction: AppDataBundle["latestPrediction"];
  signalPrediction: AppDataBundle["signalPrediction"];
  news: AppDataBundle["news"]["headlines"];
  health: AppDataBundle["health"];
  tradeQuantity: number;
  tradeMessage: string | null;
  onTradeQuantityChange: (value: number) => void;
  onTrade: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  action: AppDataBundle["analysis"]["action"];
  controls: AppControls;
  allocationSeries: Array<{ name: string; value: number; share: number }>;
  platformLoading: boolean;
}) {
  return (
    <div className="view-grid">
      <div className="metric-grid">
        <MetricCard label="Spot price" value={formatCurrency(price)} hint={ticker} tone="positive" />
        <MetricCard
          label="Intraday drift"
          value={formatPercent(performanceDelta)}
          hint="From market history feed"
          tone={performanceDelta >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Model return"
          value={formatPercent(latestPrediction.predicted_return * 100, 2)}
          hint={`${signalPrediction.prediction} with ${formatPercent(signalPrediction.confidence * 100)}`}
          tone={signalPrediction.prediction === "bullish" ? "positive" : "negative"}
        />
        <MetricCard
          label="Portfolio value"
          value={formatCurrency(portfolio.total_value)}
          hint={`Risk ${portfolio.risk_level}`}
          tone="neutral"
        />
      </div>

      <div className="content-grid two-left">
        <Panel eyebrow="Market Flow" icon={<CandlestickChart size={18} />} title={`${ticker} price and momentum`}>
          <div className="chart-shell">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={historySeries}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#a4e6ff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#a4e6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(133,147,153,0.1)" vertical={false} />
                <XAxis dataKey="time" stroke="#859399" tickLine={false} axisLine={false} />
                <YAxis stroke="#859399" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#111417",
                    border: "1px solid rgba(164,230,255,0.16)",
                    borderRadius: 16,
                  }}
                />
                <Area type="monotone" dataKey="close" stroke="#a4e6ff" fill="url(#priceGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel eyebrow="Pattern Forecast" icon={<Cpu size={18} />} title="Prediction service output">
          <div className="forecast-card">
            <div>
              <span>Next close</span>
              <strong>{formatCurrency(latestPrediction.predicted_next_close)}</strong>
            </div>
            <div>
              <span>Direction</span>
              <strong>{latestPrediction.predicted_direction}</strong>
            </div>
            <div>
              <span>Features used</span>
              <strong>{latestPrediction.features_used}</strong>
            </div>
          </div>
          <div className="indicator-grid single">
            <div className="indicator-item">
              <span>Signal</span>
              <strong>{signalPrediction.prediction}</strong>
            </div>
            <div className="indicator-item">
              <span>Confidence</span>
              <strong>{formatPercent(signalPrediction.confidence * 100)}</strong>
            </div>
            <div className="indicator-item">
              <span>Predicted return</span>
              <strong>{formatPercent(signalPrediction.predicted_return * 100, 2)}</strong>
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Portfolio Action" icon={<Wallet size={18} />} title="Profile mutation test">
          <form className="trade-form" onSubmit={onTrade}>
            <div className="trade-callout">
              <span>Orchestration action</span>
              <strong>{action}</strong>
            </div>
            <label className="trade-input">
              <span>Quantity</span>
              <input
                min={1}
                onChange={(event) => onTradeQuantityChange(Number(event.target.value))}
                type="number"
                value={tradeQuantity}
              />
            </label>
            <button className="primary-button wide" type="submit">
              Apply trade to profile service
            </button>
            {tradeMessage ? <p className="trade-message">{tradeMessage}</p> : null}
          </form>
        </Panel>

        <Panel eyebrow="News and Health" icon={<Newspaper size={18} />} title="Signal context">
          <div className="feed-list">
            {news.slice(0, 2).map((item) => (
              <article className="feed-item" key={`${item.source}-${item.timestamp}-${item.headline}`}>
                <strong>{item.headline}</strong>
                <span>
                  {item.source} · {formatDateTime(item.timestamp)}
                </span>
              </article>
            ))}
            <article className="feed-item compact">
              <strong>Health summary</strong>
              <span>
                {Object.values(health)
                  .map((item) => `${item.service}:${item.status}`)
                  .join(" · ")}
              </span>
            </article>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ExplainabilityView({
  analysis,
  jobs,
}: {
  analysis: AppDataBundle["analysis"];
  jobs: AppDataBundle["jobs"];
}) {
  return (
    <div className="content-grid split-even">
      <Panel eyebrow="Current Trace" icon={<Network size={18} />} title="Latest decision graph">
        <div className="reason-stack">
          {analysis.reason.map((reason, index) => (
            <article className="trace-card" key={reason}>
              <span className="trace-step">0{index + 1}</span>
              <div>
                <strong>{reason}</strong>
                <small>Current orchestration response</small>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Node Flow" icon={<BrainCircuit size={18} />} title="Execution order and tools">
        <div className="trace-flow">
          {analysis.trace.execution_order.map((step, index) => (
            <div className="trace-node" key={step}>
              <span>{index + 1}</span>
              <div>
                <strong>{step}</strong>
                <small>{analysis.trace.tools_used.join(", ")}</small>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Job History" icon={<Database size={18} />} title="Persisted orchestration jobs">
        <div className="job-list">
          {jobs.map((job) => (
            <article className="job-card" key={job.job_id}>
              <div className="job-head">
                <strong>
                  {job.ticker} · {job.action ?? job.status}
                </strong>
                <span>{formatDateTime(job.created_at)}</span>
              </div>
              <p>{job.reasons[0] ?? "No rationale captured."}</p>
              <small>{job.events.length} events recorded</small>
            </article>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Intermediate Data" icon={<Sparkles size={18} />} title="Trace payload">
        <pre className="code-block">{JSON.stringify(analysis.trace.intermediate_data, null, 2)}</pre>
      </Panel>
    </div>
  );
}

function PortfolioView({
  portfolio,
  allocationSeries,
  risk,
}: {
  portfolio: AppDataBundle["portfolio"];
  allocationSeries: Array<{ name: string; value: number; share: number }>;
  risk: string;
}) {
  return (
    <div className="content-grid split-even">
      <Panel eyebrow="Capital" icon={<Wallet size={18} />} title="Portfolio composition">
        <div className="portfolio-summary">
          <div>
            <span>Total value</span>
            <strong>{formatCurrency(portfolio.total_value)}</strong>
          </div>
          <div>
            <span>Cash</span>
            <strong>{formatCurrency(portfolio.cash)}</strong>
          </div>
          <div>
            <span>Risk level</span>
            <strong>{risk}</strong>
          </div>
        </div>

        <div className="chart-shell compact">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie data={allocationSeries} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                {allocationSeries.map((entry, index) => (
                  <Cell fill={chartColors[index % chartColors.length]} key={entry.name} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  background: "#111417",
                  border: "1px solid rgba(164,230,255,0.16)",
                  borderRadius: 16,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel eyebrow="Exposure" icon={<Activity size={18} />} title="Holding weights">
        <div className="chart-shell compact">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={allocationSeries} layout="vertical">
              <CartesianGrid stroke="rgba(133,147,153,0.1)" horizontal={false} />
              <XAxis hide type="number" />
              <YAxis dataKey="name" stroke="#859399" tickLine={false} axisLine={false} type="category" width={72} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{
                  background: "#111417",
                  border: "1px solid rgba(164,230,255,0.16)",
                  borderRadius: 16,
                }}
              />
              <Bar dataKey="share" radius={[0, 8, 8, 0]}>
                {allocationSeries.map((entry, index) => (
                  <Cell fill={chartColors[index % chartColors.length]} key={entry.name} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel eyebrow="Positions" icon={<TrendingUp size={18} />} title="Holdings table">
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Qty</th>
                <th>Value</th>
                <th>P/L</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((holding) => (
                <HoldingRow holding={holding} key={holding.ticker} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ModelsView({
  latestPrediction,
  signalPrediction,
  predictionHistory,
  models,
}: {
  latestPrediction: AppDataBundle["latestPrediction"];
  signalPrediction: AppDataBundle["signalPrediction"];
  predictionHistory: AppDataBundle["predictionHistory"];
  models: AppDataBundle["models"];
}) {
  return (
    <div className="content-grid split-even">
      <Panel eyebrow="Forecast" icon={<Cpu size={18} />} title={`${latestPrediction.symbol} prediction history`}>
        <div className="chart-shell compact">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart
              data={predictionHistory.points.map((point) => ({
                time: new Date(point.as_of_date).toLocaleDateString([], { month: "short", day: "numeric" }),
                predicted: point.predicted_return * 100,
                actual: point.actual_return * 100,
              }))}
            >
              <CartesianGrid stroke="rgba(133,147,153,0.1)" vertical={false} />
              <XAxis dataKey="time" stroke="#859399" tickLine={false} axisLine={false} />
              <YAxis stroke="#859399" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#111417",
                  border: "1px solid rgba(164,230,255,0.16)",
                  borderRadius: 16,
                }}
              />
              <Line dataKey="predicted" stroke="#a4e6ff" strokeWidth={3} dot={false} />
              <Line dataKey="actual" stroke="#26faa9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="forecast-card">
          <div>
            <span>Predicted next close</span>
            <strong>{formatCurrency(latestPrediction.predicted_next_close)}</strong>
          </div>
          <div>
            <span>Signal</span>
            <strong>{signalPrediction.prediction}</strong>
          </div>
          <div>
            <span>Confidence</span>
            <strong>{formatPercent(signalPrediction.confidence * 100)}</strong>
          </div>
        </div>
      </Panel>

      <Panel eyebrow="Registry" icon={<Database size={18} />} title="Available pattern models">
        <div className="model-list">
          {models.map((model) => (
            <article className="model-card" key={model.symbol}>
              <div className="job-head">
                <strong>{model.symbol}</strong>
                <span>{model.model_type}</span>
              </div>
              <p>{Object.entries(model.metrics).map(([key, value]) => `${key}: ${value}`).join(" · ")}</p>
              <small>{model.features_count} engineered features</small>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AlertsView({
  alerts,
}: {
  alerts: Array<{ title: string; tone: string; body: string; meta: string }>;
}) {
  return (
    <div className="alerts-grid">
      {alerts.map((alert) => (
        <article className={`alert-card tone-${alert.tone}`} key={`${alert.title}-${alert.meta}`}>
          <div className="alert-head">
            <strong>{alert.title}</strong>
            <span>{alert.meta}</span>
          </div>
          <p>{alert.body}</p>
        </article>
      ))}
    </div>
  );
}

function HoldingRow({ holding }: { holding: PortfolioHolding }) {
  const positive = holding.unrealized_pnl >= 0;

  return (
    <tr>
      <td>
        <strong>{holding.ticker}</strong>
        <span>{formatCurrency(holding.current_price)}</span>
      </td>
      <td>{holding.quantity}</td>
      <td>{formatCurrency(holding.current_value)}</td>
      <td className={positive ? "positive-copy" : "negative-copy"}>
        {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {formatCurrency(holding.unrealized_pnl)}
      </td>
    </tr>
  );
}

export default App;
