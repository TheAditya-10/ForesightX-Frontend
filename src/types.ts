export type AnalyzeEvent = "market_update" | "portfolio_rebalance" | "risk_alert";

export type ServiceMode = "live" | "mixed" | "fallback";

export type PriceResponse = {
  ticker: string;
  price: number;
  timestamp: string;
  currency: string;
  source: string;
};

export type IndicatorResponse = {
  ticker: string;
  rsi: number;
  macd: number;
  signal: string;
  macd_signal: number;
  macd_histogram: number;
  computed_at: string;
  source: string;
};

export type NewsItem = {
  headline: string;
  timestamp: string;
  source: string;
};

export type NewsResponse = {
  ticker: string;
  headlines: NewsItem[];
};

export type HistoryPoint = {
  timestamp: string;
  close: number;
};

export type HistoryResponse = {
  ticker: string;
  points: HistoryPoint[];
  source: string;
};

export type AnalyzeRequest = {
  user_id: string;
  ticker: string;
  event: AnalyzeEvent;
};

export type AnalyzeResponse = {
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reason: string[];
  trace: {
    tools_used: string[];
    execution_order: string[];
    intermediate_data: Record<string, unknown>;
    generated_at?: string | null;
  };
};

export type PortfolioHolding = {
  ticker: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  current_value: number;
  unrealized_pnl: number;
};

export type PortfolioResponse = {
  user_id: string;
  name: string;
  risk_level: string;
  cash: number;
  holdings: PortfolioHolding[];
  total_value: number;
};

export type RiskResponse = {
  user_id: string;
  risk_level: string;
};

export type AppControls = {
  userId: string;
  ticker: string;
  event: AnalyzeEvent;
};

export type AppDataBundle = {
  price: PriceResponse;
  indicators: IndicatorResponse;
  history: HistoryResponse;
  news: NewsResponse;
  analysis: AnalyzeResponse;
  portfolio: PortfolioResponse;
  risk: RiskResponse;
};
