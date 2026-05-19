import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, TrendingUp, TrendingDown, Activity, BarChart3, Plus, Minus } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { STOCKS, generateSeries, getIndicators, getNewsForSymbol, predictStock, type Timeframe } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchHistory,
  fetchIndicators,
  fetchNews,
  fetchPrediction,
  fetchPrice,
  fetchTradeRecommendation,
  updatePortfolioPosition,
} from "@/lib/platform-api";
import { getUserId } from "@/lib/session";

const TIMEFRAMES: { id: Timeframe; label: string; points: number }[] = [
  { id: "1D", label: "Today", points: 32 },
  { id: "1W", label: "1W", points: 40 },
  { id: "1M", label: "1M", points: 60 },
  { id: "1Y", label: "1Y", points: 120 },
];

const StockDetail = () => {
  const { symbol = "" } = useParams();
  const navigate = useNavigate();
  const stock = STOCKS.find((item) => item.symbol.toLowerCase() === symbol.toLowerCase());
  const ticker = (stock?.symbol ?? symbol).toUpperCase().trim();

  const [tf, setTf] = useState<Timeframe>("1D");
  const [seekOpen, setSeekOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  type SeriesPoint = { timestamp: number; price: number };
  const [history, setHistory] = useState<SeriesPoint[]>([]);
  const [indicators, setIndicators] = useState<ReturnType<typeof getIndicators> | null>(null);
  const [news, setNews] = useState(getNewsForSymbol(ticker || symbol));
  const [isSeekLoading, setIsSeekLoading] = useState(false);
  const [prediction, setPrediction] = useState<{
    nextHour: number;
    nextHourErr: number;
    nextDay: number;
    nextDayErr: number;
    dayAfter: number;
    dayAfterErr: number;
    trend: "bullish" | "bearish";
    confidence: number;
    verdict: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const stockName = stock?.name ?? ticker;
  const stockSector = stock?.sector ?? "Market";
  const displaySymbol = stock?.displaySymbol ?? ticker;
  const currentPrice = livePrice ?? stock?.price ?? 0;

  useEffect(() => {
    if (!ticker) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [priceResponse, historyResponse, indicatorResponse, newsResponse] = await Promise.all([
          fetchPrice(ticker),
          fetchHistory(ticker, TIMEFRAMES.find((entry) => entry.id === tf)?.points ?? 60),
          fetchIndicators(ticker),
          fetchNews(ticker),
        ]);
        if (!mounted) return;
        setLivePrice(priceResponse.price);
        setHistory(
          historyResponse.map((point) => ({
            timestamp: new Date(point.timestamp).getTime(),
            price: point.close,
          }))
        );
        setIndicators({
          rsi: indicatorResponse.rsi,
          macd: indicatorResponse.macd,
          sma50: priceResponse.price * 0.97,
          sma200: priceResponse.price * 0.91,
          volume: 1_000_000,
          pe: 20,
          high52: priceResponse.price * 1.14,
          low52: priceResponse.price * 0.76,
        });
        setNews(newsResponse);
      } catch {
        const fallback = stock?.price || 100;
        const gen = generateSeries(ticker, fallback, tf);
        const now = Date.now();
        const totalMs =
          tf === "1D"
            ? 6.5 * 60 * 60 * 1000
            : tf === "1W"
            ? 7 * 24 * 60 * 60 * 1000
            : tf === "1M"
            ? 30 * 24 * 60 * 60 * 1000
            : 365 * 24 * 60 * 60 * 1000;
        const interval = totalMs / Math.max(1, gen.length - 1);
        setHistory(
          gen.map((p, i) => ({ timestamp: Math.round(now - (gen.length - 1 - i) * interval), price: p.price }))
        );
        setIndicators(getIndicators(ticker, fallback));
        setNews(getNewsForSymbol(ticker));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ticker, tf, stock?.price]);

  // Fetch seek prediction and orchestration recommendation when the dialog is opened.
  const fetchSeekPrediction = async (signal?: AbortSignal) => {
    if (!ticker) return;
    setIsSeekLoading(true);
    try {
      const [patternResponse, recommendationResponse] = await Promise.all([
        fetchPrediction(ticker),
        fetchTradeRecommendation(getUserId(), ticker),
      ]);
      if (signal?.aborted) return;
      const [h1, d1, d2] = patternResponse.predictions;
      const referencePrice = livePrice ?? stock?.price ?? h1;
      const trend = d2 >= referencePrice ? "bullish" : "bearish";
      setPrediction({
        nextHour: h1,
        nextHourErr: Math.abs(patternResponse.intervals[0][1] - patternResponse.intervals[0][0]) / 2,
        nextDay: d1,
        nextDayErr: Math.abs(patternResponse.intervals[1][1] - patternResponse.intervals[1][0]) / 2,
        dayAfter: d2,
        dayAfterErr: Math.abs(patternResponse.intervals[2][1] - patternResponse.intervals[2][0]) / 2,
        trend,
        confidence: Math.round(recommendationResponse.confidence * 100),
        verdict: recommendationResponse.recommendation,
      });
    } catch (err) {
      if ((err as any)?.name === "AbortError") return;
      setPrediction(predictStock(ticker, currentPrice || stock?.price || 100));
    } finally {
      setIsSeekLoading(false);
    }
  };

  useEffect(() => {
    if (!seekOpen) return;
    const controller = new AbortController();
    fetchSeekPrediction(controller.signal);
    return () => controller.abort();
    // only re-run when dialog opens/closes or ticker changes
  }, [seekOpen, ticker]);

  useEffect(() => {
    if (!ticker) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/api/data/stream/${encodeURIComponent(ticker)}`);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; data?: { price?: number } };
        if (payload.type === "tick" && payload.data?.price && Number.isFinite(payload.data.price)) {
          const price = payload.data.price;
          const ts = Date.now();
          setLivePrice(price);
          setHistory((prev) => {
            const points = TIMEFRAMES.find((e) => e.id === tf)?.points ?? 60;
            const totalMs =
              tf === "1D"
                ? 6.5 * 60 * 60 * 1000
                : tf === "1W"
                ? 7 * 24 * 60 * 60 * 1000
                : tf === "1M"
                ? 30 * 24 * 60 * 60 * 1000
                : 365 * 24 * 60 * 60 * 1000;
            const interval = totalMs / Math.max(1, points - 1);
            if (prev.length === 0) return [{ timestamp: ts, price }];
            const last = prev[prev.length - 1];
            if (ts - last.timestamp < Math.max(1000, interval / 2)) {
              const next = prev.slice();
              next[next.length - 1] = { timestamp: ts, price };
              return next;
            } else {
              const next = [...prev, { timestamp: ts, price }];
              if (next.length > points) next.shift();
              return next;
            }
          });
        }
      } catch {
        // Ignore malformed stream payloads.
      }
    };
    return () => {
      socket.close();
    };
  }, [ticker, tf]);

  if (!ticker) {
    return (
      <DashboardLayout activeTab="search">
        <div className="text-center text-muted-foreground">
          Stock not found.{" "}
          <Link className="text-accent hover:underline" to="/dashboard/search">
            Search again
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const series = (() => {
    if (history.length > 0) return history;
    const gen = generateSeries(ticker, currentPrice || stock?.price || 100, tf);
    const now = Date.now();
    const totalMs =
      tf === "1D"
        ? 6.5 * 60 * 60 * 1000
        : tf === "1W"
        ? 7 * 24 * 60 * 60 * 1000
        : tf === "1M"
        ? 30 * 24 * 60 * 60 * 1000
        : 365 * 24 * 60 * 60 * 1000;
    const interval = totalMs / Math.max(1, gen.length - 1);
    return gen.map((p, i) => ({ timestamp: Math.round(now - (gen.length - 1 - i) * interval), price: p.price }));
  })();

  // Remove any points that are in the future to avoid the chart extending past real time.
  const now = Date.now();
  const displaySeries = series.filter((p) => Number.isFinite(p.timestamp) && p.timestamp <= now);
  const usedSeries = (displaySeries.length > 0 ? displaySeries : series.filter((p) => Number.isFinite(p.timestamp))).slice();
  usedSeries.sort((a, b) => a.timestamp - b.timestamp);

  const min = Math.min(...usedSeries.map((d) => d.price));
  const max = Math.max(...usedSeries.map((d) => d.price));
  const refPrice = stock?.price ?? (usedSeries.length > 0 ? usedSeries[0].price : currentPrice || 1);
  const up = currentPrice >= refPrice;
  const xMin = Math.min(...usedSeries.map((d) => d.timestamp));
  const xMax = Math.max(...usedSeries.map((d) => d.timestamp));

  const formatXLabel = (val: number | string) => {
    const ts = typeof val === "number" ? val : Number(val);
    if (!Number.isFinite(ts)) return String(val);
    const d = new Date(ts);
    if (tf === "1D") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (tf === "1W") return d.toLocaleDateString([], { weekday: "short" });
    if (tf === "1M") return d.toLocaleDateString([], { day: "numeric", month: "short" });
    if (tf === "1Y") return d.toLocaleDateString([], { month: "short" });
    return d.toLocaleString();
  };

  // Compute explicit tick positions for the X axis so labels for Today/1W are equidistant
  const ticks = useMemo(() => {
    if (!usedSeries || usedSeries.length === 0) return [] as number[];
    const minTs = xMin;
    const maxTs = xMax;
    if (!Number.isFinite(minTs) || !Number.isFinite(maxTs) || maxTs <= minTs) return [minTs];

    const range = maxTs - minTs;
    const desired = tf === "1D" ? 6 : tf === "1W" ? 7 : tf === "1M" ? 6 : 12;

    const hour = 60 * 60 * 1000;
    const day = 24 * 60 * 60 * 1000;

    // Today: produce hour-aligned ticks between min and max, sampled to at most `desired` labels
    if (tf === "1D") {
      const start = new Date(minTs);
      start.setMinutes(0, 0, 0);
      const end = new Date(maxTs);
      end.setMinutes(0, 0, 0);
      const totalHours = Math.max(1, Math.round((end.getTime() - start.getTime()) / hour) + 1);
      if (totalHours <= desired) {
        const out: number[] = [];
        for (let t = start.getTime(); t <= end.getTime(); t += hour) out.push(t);
        return out.filter((t) => t >= minTs && t <= maxTs);
      }
      const stepHours = Math.ceil(totalHours / desired);
      const out: number[] = [];
      for (let t = start.getTime(); t <= end.getTime(); t += stepHours * hour) out.push(t);
      if (out[out.length - 1] < end.getTime()) out.push(end.getTime());
      return out.filter((t) => t >= minTs && t <= maxTs);
    }

    // Week: produce day-aligned ticks across the 7-day range
    if (tf === "1W") {
      const start = new Date(minTs);
      start.setHours(0, 0, 0, 0);
      const end = new Date(maxTs);
      end.setHours(0, 0, 0, 0);
      const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / day) + 1);
      if (totalDays <= desired) {
        const out: number[] = [];
        for (let t = start.getTime(); t <= end.getTime(); t += day) out.push(t);
        return out.filter((t) => t >= minTs && t <= maxTs);
      }
      const stepDays = Math.ceil(totalDays / desired);
      const out: number[] = [];
      for (let t = start.getTime(); t <= end.getTime(); t += stepDays * day) out.push(t);
      if (out[out.length - 1] < end.getTime()) out.push(end.getTime());
      return out.filter((t) => t >= minTs && t <= maxTs);
    }

    // Month: sample by day (approx every 5 days) rounded down to day boundary
    if (tf === "1M") {
      const start = new Date(minTs);
      start.setHours(0, 0, 0, 0);
      const end = new Date(maxTs);
      end.setHours(0, 0, 0, 0);
      const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / day) + 1);
      const stepDays = Math.max(1, Math.ceil(totalDays / desired));
      const out: number[] = [];
      for (let t = start.getTime(); t <= end.getTime(); t += stepDays * day) out.push(t);
      if (out[out.length - 1] < end.getTime()) out.push(end.getTime());
      return out.filter((t) => t >= minTs && t <= maxTs);
    }

    // Year: month starts
    const months: number[] = [];
    const startMonth = new Date(minTs);
    startMonth.setDate(1);
    startMonth.setHours(0, 0, 0, 0);
    const monthStep = Math.max(1, Math.round(12 / desired));
    for (let d = new Date(startMonth); d.getTime() <= maxTs; d.setMonth(d.getMonth() + monthStep)) {
      months.push(d.getTime());
    }
    if (months.length === 0) return [minTs, maxTs];
    if (months[0] > minTs) months.unshift(minTs);
    if (months[months.length - 1] < maxTs) months.push(maxTs);
    return months.filter((t) => t >= minTs && t <= maxTs);
  }, [usedSeries, tf, xMin, xMax]);

  const handleBuy = async () => {
    try {
      await updatePortfolioPosition(getUserId(), ticker, qty);
      toast.success(`Added ${qty} share${qty > 1 ? "s" : ""} of ${ticker} to portfolio`, {
        description: `Estimated value: $${(qty * currentPrice).toFixed(2)}`,
      });
      setSeekOpen(false);
      setTimeout(() => navigate("/dashboard/profile"), 500);
    } catch (err) {
      toast.error("Portfolio update failed", {
        description: err instanceof Error ? err.message : "Please retry.",
      });
    }
  };

  return (
    <DashboardLayout activeTab="search">
      <Link to="/dashboard/search" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary font-mono font-semibold">
              {displaySymbol.slice(0, 3)}
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">{stockName}</h1>
              <div className="text-xs text-muted-foreground">{ticker} · {stockSector}</div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-mono-tabular font-display text-3xl font-semibold sm:text-4xl">${currentPrice.toLocaleString()}</span>
            <span className={cn("font-mono-tabular flex items-center gap-1 text-sm font-medium", up ? "text-success" : "text-loss")}>
              {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {up ? "+" : ""}
              {(currentPrice - refPrice).toFixed(2)} ({up ? "+" : ""}
              {(((currentPrice - refPrice) / Math.max(refPrice, 1)) * 100).toFixed(2)}%)
            </span>
            <span className="text-xs text-muted-foreground">Live quote</span>
          </div>
        </div>

        <Button size="lg" className="w-full rounded-full px-6 shadow-glow md:w-auto" onClick={() => setSeekOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" /> Seek prediction
        </Button>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-accent" /> Price chart
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            {tf === "1D" && (
              <div className="text-xs text-muted-foreground">
                Today · {new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} ({Intl.DateTimeFormat().resolvedOptions().timeZone})
              </div>
            )}

            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-secondary/50 p-1 whitespace-nowrap">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTf(t.id)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                    tf === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full sm:h-[360px]">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center p-6">
              <Skeleton className="h-full w-full rounded-xl" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usedSeries} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-area))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--chart-area))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--chart-grid))" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[xMin, xMax]}
                  ticks={ticks}
                  tickFormatter={(val) => formatXLabel(Number(val))}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[min * 0.995, max * 1.005]} tickFormatter={(v) => `$${Number(v).toFixed(0)}`} />
                <Tooltip
                  labelFormatter={(val) => formatXLabel(Number(val))}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: "var(--shadow-elegant)",
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Price"]}
                />
                <Area type="monotone" dataKey="price" stroke="hsl(var(--chart-line))" strokeWidth={2} fill="url(#areaFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant lg:col-span-1">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-accent" /> Key indicators
          </div>
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground"><Skeleton className="h-3 w-20" /></div>
                  <div className="font-mono-tabular mt-1 text-base font-semibold"><Skeleton className="h-6 w-24" /></div>
                </div>
              ))
            ) : indicators ? (
              [
                { label: "RSI (14)", value: indicators.rsi.toFixed(1), tone: indicators.rsi > 70 ? "down" : indicators.rsi < 30 ? "up" : undefined },
                { label: "MACD", value: indicators.macd.toFixed(2), tone: indicators.macd >= 0 ? "up" : "down" },
                { label: "SMA 50", value: `$${indicators.sma50.toFixed(2)}` },
                { label: "SMA 200", value: `$${indicators.sma200.toFixed(2)}` },
                { label: "Volume", value: `${(indicators.volume / 1_000_000).toFixed(2)}M` },
                { label: "P/E", value: indicators.pe.toFixed(1) },
                { label: "52W High", value: `$${indicators.high52.toFixed(2)}` },
                { label: "52W Low", value: `$${indicators.low52.toFixed(2)}` },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</div>
                  <div className={cn("font-mono-tabular mt-1 text-base font-semibold", item.tone === "up" && "text-success", item.tone === "down" && "text-loss")}>
                    {item.value}
                  </div>
                </div>
              ))
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant lg:col-span-2">
          <div className="mb-4 text-sm text-muted-foreground">
            News related to <span className="font-mono text-foreground">{ticker}</span>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-xs">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-32 ml-2" />
                  </div>
                  <div className="mt-2">
                    <Skeleton className="h-5 w-full" />
                  </div>
                </div>
              ))
            ) : (
              news.slice(0, 4).map((item) => (
                <div key={item.id} className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-accent">{item.tag}</span>
                    <span className="text-muted-foreground">· {item.source} · {item.time}</span>
                  </div>
                  <h4 className="font-display mt-1.5 text-base font-medium leading-snug">{item.title}</h4>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={seekOpen} onOpenChange={setSeekOpen}>
        <DialogContent className="w-[92vw] max-w-lg overflow-hidden border-border bg-card p-0">
          <div className="relative bg-surface p-6">
            <div className="absolute inset-0 bg-hero-glow opacity-60" />
            <div className="relative">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-accent shadow-glow">
                    <Sparkles className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <DialogTitle className="font-display text-xl">Seek · {ticker}</DialogTitle>
                </div>
                <DialogDescription>
                  AI-driven prediction {isSeekLoading ? "· syncing..." : `· Confidence ${prediction?.confidence ?? 0}%`}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {isSeekLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card/80 p-3 backdrop-blur">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="font-mono-tabular mt-1 text-base font-semibold">
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <div className="font-mono-tabular text-xs text-muted-foreground">
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))
                ) : prediction ? (
                  [
                    { label: "Next hour", value: prediction.nextHour, err: prediction.nextHourErr },
                    { label: "Next day", value: prediction.nextDay, err: prediction.nextDayErr },
                    { label: "Day after", value: prediction.dayAfter, err: prediction.dayAfterErr },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-card/80 p-3 backdrop-blur">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</div>
                      <div className="font-mono-tabular mt-1 text-base font-semibold">${item.value.toFixed(2)}</div>
                      <div className="font-mono-tabular text-xs text-muted-foreground">± ${item.err.toFixed(2)}</div>
                    </div>
                  ))
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {isSeekLoading ? (
                  <>
                    <div className="rounded-xl border border-border bg-card/80 p-3 backdrop-blur">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="font-mono-tabular mt-1 text-base font-semibold">
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <div className="mt-2">
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card/80 p-3 backdrop-blur">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="mt-1">
                        <Skeleton className="h-5 w-24" />
                      </div>
                    </div>
                  </>
                ) : prediction ? (
                  <>
                    <div className="rounded-xl border border-border bg-card/80 p-3 backdrop-blur">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</div>
                      <div className="font-mono-tabular mt-1 text-base font-semibold">{prediction.confidence}%</div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${prediction.confidence}%` }} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card/80 p-3 backdrop-blur">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trend</div>
                      <div className={cn("mt-1 inline-flex items-center gap-1.5 text-base font-semibold capitalize", prediction.trend === "bullish" ? "text-success" : "text-loss")}>
                        {prediction.trend === "bullish" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {prediction.trend}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              <div className={cn("mt-5 rounded-xl border p-4 text-sm", prediction?.trend === "bullish" ? "border-success/30 bg-success/5" : "border-loss/30 bg-loss/5")}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Verdict</div>
                {isSeekLoading ? (
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <p className="mt-1 leading-relaxed">{prediction?.verdict}</p>
                )}
              </div>

              <div className="mt-5 rounded-xl border border-border bg-card/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <div className="inline-flex items-center gap-2">
                    <button className="rounded-md border border-border p-1" onClick={() => setQty((prev) => Math.max(1, prev - 1))}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-mono-tabular text-sm">{qty}</span>
                    <button className="rounded-md border border-border p-1" onClick={() => setQty((prev) => prev + 1)}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Estimated order value: ${(qty * currentPrice).toFixed(2)}</div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1 rounded-lg shadow-glow" onClick={handleBuy}>
                  BUY NOW
                </Button>
                <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setSeekOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StockDetail;
