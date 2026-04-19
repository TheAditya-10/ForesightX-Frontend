import { loadSession } from "@/lib/session";

export type StockQuote = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePct: number;
};

export type PortfolioHolding = {
  symbol: string;
  name: string;
  qty: number;
  avgPrice: number;
  price: number;
};

export type IndicatorData = {
  rsi: number;
  macd: number;
  signal: string;
  macdSignal: number;
  macdHistogram: number;
};

export type HistoryPoint = {
  timestamp: string;
  close: number;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  time: string;
  tag: string;
  symbols?: string[];
  url?: string | null;
};

export type PatternPrediction = {
  predictions: [number, number, number];
  confidence: number;
  intervals: [[number, number], [number, number], [number, number]];
  modelVersion: string;
};

type HttpMethod = "GET" | "POST";

async function request<T>(path: string, method: HttpMethod = "GET", body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const session = loadSession();
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }
  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export async function register(email: string, password: string) {
  return request<{
    user: { id: string; email: string; role: string };
    tokens: { access_token: string; refresh_token: string };
  }>("/api/auth/auth/register", "POST", { email, password });
}

export async function login(email: string, password: string) {
  return request<{
    user: { id: string; email: string; role: string };
    tokens: { access_token: string; refresh_token: string };
  }>("/api/auth/auth/login", "POST", { email, password });
}

export async function logout(refreshToken: string) {
  return request<{ message: string }>("/api/auth/auth/logout", "POST", { refresh_token: refreshToken });
}

export function googleLoginUrl() {
  return "/api/auth/oauth/google/login";
}

export async function createProfile(userId: string, email: string) {
  return request<{ user_id: string; name: string; risk_level: string }>(
    "/api/profile/api/v1/profile/create",
    "POST",
    { user_id: userId, email }
  );
}

export async function fetchPrice(ticker: string) {
  return request<{ ticker: string; price: number; timestamp: string }>(`/api/data/price/${encodeURIComponent(ticker)}`);
}

export async function fetchIndicators(ticker: string) {
  const raw = await request<{
    ticker: string;
    rsi: number;
    macd: number;
    signal: string;
    macd_signal: number;
    macd_histogram: number;
  }>(`/api/data/indicators/${encodeURIComponent(ticker)}`);
  return {
    rsi: raw.rsi,
    macd: raw.macd,
    signal: raw.signal,
    macdSignal: raw.macd_signal,
    macdHistogram: raw.macd_histogram,
  } satisfies IndicatorData;
}

export async function fetchHistory(ticker: string, limit = 60) {
  const raw = await request<{ ticker: string; points: Array<{ timestamp: string; close: number }> }>(
    `/api/data/history/${encodeURIComponent(ticker)}?limit=${limit}`
  );
  return raw.points as HistoryPoint[];
}

export async function fetchNews(ticker: string) {
  const raw = await request<{
    ticker: string;
    headlines: Array<{ headline: string; timestamp: string; source: string; url?: string | null }>;
  }>(`/api/data/news/${encodeURIComponent(ticker)}`);
  return raw.headlines.map((item, index) => ({
    id: `${ticker}-${index}`,
    title: item.headline,
    source: item.source,
    time: new Date(item.timestamp).toLocaleString(),
    tag: "Market",
    symbols: [ticker],
    url: item.url,
  })) satisfies NewsItem[];
}

export async function fetchPortfolio(userId: string) {
  const raw = await request<{
    user_id: string;
    name: string;
    risk_level: string;
    cash: number;
    holdings: Array<{ ticker: string; quantity: number; avg_price: number; current_price: number }>;
  }>(`/api/profile/portfolio/${encodeURIComponent(userId)}`);
  return {
    userId: raw.user_id,
    name: raw.name,
    riskLevel: raw.risk_level,
    cash: raw.cash,
    holdings: raw.holdings.map((item) => ({
      symbol: item.ticker,
      name: item.ticker,
      qty: item.quantity,
      avgPrice: item.avg_price,
      price: item.current_price,
    })),
  };
}

export async function updatePortfolioPosition(userId: string, ticker: string, quantity: number) {
  return request("/api/profile/portfolio/update", "POST", {
    user_id: userId,
    ticker,
    quantity,
  });
}

export async function fetchRisk(userId: string) {
  return request<{ user_id: string; risk_level: string }>(`/api/profile/risk/${encodeURIComponent(userId)}`);
}

export async function fetchPrediction(ticker: string): Promise<PatternPrediction> {
  const raw = await request<{
    ticker: string;
    predictions: number[];
    confidence: number;
    intervals: number[][];
    model_version: string;
  }>("/api/pattern/predict", "POST", { ticker });
  return {
    predictions: [raw.predictions[0], raw.predictions[1], raw.predictions[2]],
    confidence: raw.confidence,
    intervals: [
      [raw.intervals[0][0], raw.intervals[0][1]],
      [raw.intervals[1][0], raw.intervals[1][1]],
      [raw.intervals[2][0], raw.intervals[2][1]],
    ],
    modelVersion: raw.model_version,
  };
}
