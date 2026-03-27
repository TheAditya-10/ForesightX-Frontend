import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Activity,
  BellRing,
  BrainCircuit,
  LayoutDashboard,
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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  analyzeTicker,
  fetchHistory,
  fetchIndicators,
  fetchNews,
  fetchPortfolio,
  fetchPrice,
  fetchRisk,
} from "./api";
import { buildFallbackBundle } from "./fallback";
import type {
  AnalyzeEvent,
  AppControls,
  AppDataBundle,
  PortfolioHolding,
  ServiceMode,
} from "./types";

type ViewKey = "dashboard" | "explainability" | "portfolio" | "alerts";

const PROJECT_TITLE = "ForesightX Digital Oracle";

const navItems: Array<{
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
  summary: string;
}> = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    summary: "Market state, chart flow, and action signal",
  },
  {
    key: "explainability",
    label: "Explainability",
    icon: BrainCircuit,
    summary: "Tool trace and model reasoning surfaces",
  },
  {
    key: "portfolio",
    label: "Portfolio",
    icon: Wallet,
    summary: "Holdings, exposure, and risk posture",
  },
  {
    key: "alerts",
    label: "Alerts",
    icon: BellRing,
    summary: "AI alerts and event stream synthesized from services",
  },
];

const chartColors = ["#a4e6ff", "#26faa9", "#d1bcff", "#ffb4ab", "#00d1ff"];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
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

function toneFromAction(action: AppDataBundle["analysis"]["action"]) {
  if (action === "BUY") {
    return "positive";
  }

  if (action === "SELL") {
    return "negative";
  }

  return "neutral";
}

function App() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [controls, setControls] = useState<AppControls>({
    userId: "demo-user",
    ticker: "AAPL",
    event: "market_update",
  });
  const [draftTicker, setDraftTicker] = useState("AAPL");
  const [draftUserId, setDraftUserId] = useState("demo-user");
  const [draftEvent, setDraftEvent] = useState<AnalyzeEvent>("market_update");
  const [bundle, setBundle] = useState<AppDataBundle>(() =>
    buildFallbackBundle({
      userId: "demo-user",
      ticker: "AAPL",
      event: "market_update",
    })
  );
  const [serviceModes, setServiceModes] = useState({
    market: "fallback" as ServiceMode,
    analysis: "fallback" as ServiceMode,
    profile: "fallback" as ServiceMode,
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Showing fallback preview until services respond.");
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${PROJECT_TITLE} | ${navItems.find((item) => item.key === activeView)?.label ?? "Dashboard"}`;
  }, [activeView]);

  useEffect(() => {
    void refreshData(controls);
  }, [controls]);

  async function refreshData(nextControls: AppControls) {
    setLoading(true);
    const fallback = buildFallbackBundle(nextControls);

    const [priceResult, indicatorResult, historyResult, newsResult, analysisResult, portfolioResult, riskResult] =
      await Promise.allSettled([
        fetchPrice(nextControls.ticker),
        fetchIndicators(nextControls.ticker),
        fetchHistory(nextControls.ticker),
        fetchNews(nextControls.ticker),
        analyzeTicker({
          user_id: nextControls.userId,
          ticker: nextControls.ticker,
          event: nextControls.event,
        }),
        fetchPortfolio(nextControls.userId),
        fetchRisk(nextControls.userId),
      ]);

    const marketMode = resolveMode([priceResult, indicatorResult, historyResult, newsResult]);
    const analysisMode = resolveMode([analysisResult]);
    const profileMode = resolveMode([portfolioResult, riskResult]);

    setBundle({
      price: resolveValue(priceResult, fallback.price),
      indicators: resolveValue(indicatorResult, fallback.indicators),
      history: resolveValue(historyResult, fallback.history),
      news: resolveValue(newsResult, fallback.news),
      analysis: resolveValue(analysisResult, fallback.analysis),
      portfolio: resolveValue(portfolioResult, fallback.portfolio),
      risk: resolveValue(riskResult, fallback.risk),
    });
    setServiceModes({
      market: marketMode,
      analysis: analysisMode,
      profile: profileMode,
    });
    setLastSync(new Date().toISOString());

    const allModes = [marketMode, analysisMode, profileMode];
    if (allModes.every((mode) => mode === "live")) {
      setStatusMessage("All microservices are live. The frontend is reading current service data.");
    } else if (allModes.every((mode) => mode === "fallback")) {
      setStatusMessage("Services did not respond from the browser path. Showing a fallback preview wired to the same contracts.");
    } else {
      setStatusMessage("Some services responded live and some fell back. The UI remains usable while the stack stabilizes.");
    }

    setLoading(false);
  }

  const historySeries = useMemo(
    () =>
      bundle.history.points.map((point) => ({
        time: new Date(point.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
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
        tone: toneFromAction(bundle.analysis.action),
        body: bundle.analysis.reason[0],
        meta: `Confidence ${Math.round(bundle.analysis.confidence * 100)}%`,
      },
      {
        title: `Risk posture: ${bundle.risk.risk_level}`,
        tone: bundle.risk.risk_level.toLowerCase().includes("high") ? "negative" : "neutral",
        body: `Indicator signal is ${bundle.indicators.signal} with RSI at ${bundle.indicators.rsi.toFixed(1)}.`,
        meta: `Profile service for ${bundle.portfolio.user_id}`,
      },
      ...bundle.news.headlines.slice(0, 3).map((headline) => ({
        title: headline.headline,
        tone: "info",
        body: `${headline.source} at ${formatDateTime(headline.timestamp)}`,
        meta: bundle.price.ticker,
      })),
    ];

    return synthesized;
  }, [bundle]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setControls({
      userId: draftUserId.trim() || "demo-user",
      ticker: draftTicker.trim().toUpperCase() || "AAPL",
      event: draftEvent,
    });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="eyebrow">Microservice Control Surface</p>
            <h1>ForesightX</h1>
            <p className="muted-copy">
              Stitch-driven visual language, rebuilt as one integrated product UI over orchestration,
              data, and profile services.
            </p>
          </div>
        </div>

        <div className="service-stack">
          <ServicePill label="Market" mode={serviceModes.market} />
          <ServicePill label="Analysis" mode={serviceModes.analysis} />
          <ServicePill label="Profile" mode={serviceModes.profile} />
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
          <p className="sidebar-stat-label">Project posture</p>
          <strong>{statusMessage}</strong>
          <span>Last sync {formatDateTime(lastSync)}</span>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Live Operator Console</p>
            <h2>{navItems.find((item) => item.key === activeView)?.label}</h2>
          </div>

          <form className="control-bar" onSubmit={handleSubmit}>
            <label className="input-shell">
              <Search size={16} />
              <input
                onChange={(event) => setDraftTicker(event.target.value)}
                placeholder="Ticker"
                value={draftTicker}
              />
            </label>
            <label className="input-shell narrow">
              <span>User</span>
              <input onChange={(event) => setDraftUserId(event.target.value)} value={draftUserId} />
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
            <button className="primary-button" disabled={loading} type="submit">
              <RefreshCcw className={loading ? "spin" : ""} size={16} />
              {loading ? "Refreshing" : "Sync Frontend"}
            </button>
          </form>
        </header>

        <section className="status-banner">
          <span>{loading ? "Refreshing service state..." : statusMessage}</span>
          <strong>
            {bundle.price.ticker} · {bundle.analysis.action} · {Math.round(bundle.analysis.confidence * 100)}%
          </strong>
        </section>

        {activeView === "dashboard" ? (
          <DashboardView
            analysisConfidence={bundle.analysis.confidence}
            analysisReasons={bundle.analysis.reason}
            historySeries={historySeries}
            indicators={bundle.indicators}
            news={bundle.news.headlines}
            performanceDelta={performanceDelta}
            portfolioValue={bundle.portfolio.total_value}
            price={bundle.price.price}
            ticker={bundle.price.ticker}
          />
        ) : null}

        {activeView === "explainability" ? (
          <ExplainabilityView analysis={bundle.analysis} ticker={bundle.price.ticker} />
        ) : null}

        {activeView === "portfolio" ? (
          <PortfolioView allocationSeries={allocationSeries} portfolio={bundle.portfolio} risk={bundle.risk.risk_level} />
        ) : null}

        {activeView === "alerts" ? <AlertsView alerts={alerts} /> : null}
      </main>
    </div>
  );
}

function ServicePill({ label, mode }: { label: string; mode: ServiceMode }) {
  return (
    <div className={`service-pill mode-${mode}`}>
      <span>{label}</span>
      <strong>{mode}</strong>
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
  portfolioValue,
  performanceDelta,
  indicators,
  historySeries,
  analysisConfidence,
  analysisReasons,
  news,
}: {
  ticker: string;
  price: number;
  portfolioValue: number;
  performanceDelta: number;
  indicators: AppDataBundle["indicators"];
  historySeries: Array<{ time: string; close: number }>;
  analysisConfidence: number;
  analysisReasons: string[];
  news: AppDataBundle["news"]["headlines"];
}) {
  return (
    <div className="view-grid">
      <div className="metric-grid">
        <MetricCard label="Spot price" value={formatCurrency(price)} hint={ticker} tone="positive" />
        <MetricCard
          label="Intraday drift"
          value={formatPercent(performanceDelta)}
          hint="Derived from recent history points"
          tone={performanceDelta >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="AI confidence"
          value={formatPercent(analysisConfidence * 100)}
          hint="Orchestration decision score"
          tone="neutral"
        />
        <MetricCard label="Portfolio value" value={formatCurrency(portfolioValue)} hint="Profile service total value" tone="neutral" />
      </div>

      <div className="content-grid two-left">
        <Panel eyebrow="Market Flow" icon={<Activity size={18} />} title={`${ticker} momentum surface`}>
          <div className="chart-shell">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={historySeries}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#a4e6ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a4e6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(133,147,153,0.1)" vertical={false} />
                <XAxis dataKey="time" stroke="#859399" tickLine={false} axisLine={false} />
                <YAxis stroke="#859399" tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#111417",
                    border: "1px solid rgba(164,230,255,0.16)",
                    borderRadius: 16,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#a4e6ff"
                  fill="url(#priceGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel eyebrow="Decision Layer" icon={<BrainCircuit size={18} />} title="Oracle recommendation">
          <div className="reason-stack">
            {analysisReasons.map((reason) => (
              <article className="reason-card" key={reason}>
                <span className="reason-dot" />
                <p>{reason}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Signal Stack" icon={<Shield size={18} />} title="Indicator posture">
          <div className="indicator-grid">
            <div className="indicator-item">
              <span>RSI</span>
              <strong>{indicators.rsi.toFixed(1)}</strong>
            </div>
            <div className="indicator-item">
              <span>MACD</span>
              <strong>{indicators.macd.toFixed(2)}</strong>
            </div>
            <div className="indicator-item">
              <span>Signal</span>
              <strong>{indicators.signal}</strong>
            </div>
          </div>
        </Panel>

        <Panel eyebrow="News Pulse" icon={<Newspaper size={18} />} title="Market narrative">
          <div className="feed-list">
            {news.map((item) => (
              <article className="feed-item" key={`${item.source}-${item.timestamp}-${item.headline}`}>
                <strong>{item.headline}</strong>
                <span>
                  {item.source} · {formatDateTime(item.timestamp)}
                </span>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ExplainabilityView({
  analysis,
  ticker,
}: {
  analysis: AppDataBundle["analysis"];
  ticker: string;
}) {
  return (
    <div className="content-grid split-even">
      <Panel eyebrow="Reason Graph" icon={<Network size={18} />} title={`Why ${ticker} is ${analysis.action}`}>
        <div className="reason-stack">
          {analysis.reason.map((reason, index) => (
            <article className="trace-card" key={reason}>
              <span className="trace-step">0{index + 1}</span>
              <div>
                <strong>{reason}</strong>
                <small>Confidence layer contribution</small>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Execution Trace" icon={<BrainCircuit size={18} />} title="Tool and node flow">
        <div className="trace-flow">
          {analysis.trace.execution_order.map((step, index) => (
            <div className="trace-node" key={step}>
              <span>{index + 1}</span>
              <div>
                <strong>{step}</strong>
                <small>
                  Tools:{" "}
                  {analysis.trace.tools_used[index] ?? analysis.trace.tools_used.at(-1) ?? "decision_engine"}
                </small>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Intermediate Data" icon={<Sparkles size={18} />} title="Model payload">
        <pre className="code-block">
          {JSON.stringify(analysis.trace.intermediate_data, null, 2)}
        </pre>
      </Panel>

      <Panel eyebrow="Output Contract" icon={<Shield size={18} />} title="Response envelope">
        <div className="contract-grid">
          <div>
            <span>Action</span>
            <strong>{analysis.action}</strong>
          </div>
          <div>
            <span>Confidence</span>
            <strong>{formatPercent(analysis.confidence * 100)}</strong>
          </div>
          <div>
            <span>Generated</span>
            <strong>{formatDateTime(analysis.trace.generated_at)}</strong>
          </div>
        </div>
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
              <Pie
                data={allocationSeries}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
              >
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

export default App;
