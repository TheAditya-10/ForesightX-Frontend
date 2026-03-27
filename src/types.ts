export type AnalyzeEvent = "market_update" | "portfolio_rebalance" | "risk_alert";

export type ServiceMode = "live" | "mixed" | "fallback";

export type ServiceKey = "auth" | "data" | "profile" | "pattern" | "orchestration";

export type ServiceHealth = {
  service: string;
  status: string;
  timestamp: string;
  available_models?: string[];
};

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
  job_id?: string | null;
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

export type AnalysisJobEventResponse = {
  sequence_number: number;
  node_name: string;
  tools_used: string[];
  payload?: Record<string, unknown> | null;
  created_at: string;
};

export type AnalysisJobResponse = {
  job_id: string;
  user_id: string;
  ticker: string;
  event: string;
  status: string;
  action?: string | null;
  confidence?: number | null;
  reasons: string[];
  failure_reason?: string | null;
  created_at: string;
  completed_at?: string | null;
  events: AnalysisJobEventResponse[];
};

export type AnalysisJobListResponse = {
  jobs: AnalysisJobResponse[];
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

export type UpdatePortfolioRequest = {
  user_id: string;
  ticker: string;
  quantity: number;
};

export type RiskResponse = {
  user_id: string;
  risk_level: string;
};

export type CreateProfileRequest = {
  user_id: string;
  email: string;
};

export type CreateProfileResponse = {
  user_id: string;
  name: string;
  risk_level: string;
};

export type PredictionRequest = {
  symbol: string;
  as_of_date?: string | null;
};

export type PredictionResponse = {
  prediction_id?: string | null;
  symbol: string;
  as_of_date: string;
  predicted_return: number;
  predicted_direction: string;
  latest_close: number;
  predicted_next_close: number;
  model_type: string;
  model_timestamp?: string | null;
  features_used: number;
};

export type SignalPredictionRequest = {
  ticker: string;
  as_of_date?: string | null;
};

export type SignalPredictionResponse = {
  prediction_id?: string | null;
  symbol: string;
  prediction: string;
  confidence: number;
  predicted_return: number;
  latest_close: number;
  predicted_next_close: number;
};

export type ModelSummary = {
  symbol: string;
  model_type: string;
  features_count: number;
  model_timestamp?: string | null;
  metrics: Record<string, number | string>;
};

export type ModelListResponse = {
  models: ModelSummary[];
};

export type HistoricalPredictionPoint = {
  as_of_date: string;
  actual_return: number;
  predicted_return: number;
  absolute_error: number;
  direction_correct: boolean;
};

export type HistoricalPredictionResponse = {
  symbol: string;
  points: HistoricalPredictionPoint[];
};

export type UserRead = {
  id: string;
  email: string;
  role: string;
  auth_provider: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
};

export type UserCreate = {
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
};

export type AuthResponse = {
  user: UserRead;
  tokens: TokenPair;
};

export type RefreshTokenRequest = {
  refresh_token: string;
};

export type LogoutRequest = {
  refresh_token: string;
};

export type MessageResponse = {
  message: string;
};

export type VerifyResponse = {
  valid: boolean;
  user: UserRead;
};

export type SessionState = {
  user: UserRead;
  accessToken: string;
  refreshToken: string;
};

export type AppControls = {
  ticker: string;
  event: AnalyzeEvent;
};

export type AppDataBundle = {
  price: PriceResponse;
  indicators: IndicatorResponse;
  history: HistoryResponse;
  news: NewsResponse;
  analysis: AnalyzeResponse;
  jobs: AnalysisJobResponse[];
  portfolio: PortfolioResponse;
  risk: RiskResponse;
  latestPrediction: PredictionResponse;
  signalPrediction: SignalPredictionResponse;
  predictionHistory: HistoricalPredictionResponse;
  models: ModelSummary[];
  health: Record<ServiceKey, ServiceHealth>;
};
