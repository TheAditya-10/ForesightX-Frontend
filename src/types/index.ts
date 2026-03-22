export type TradeAction = "BUY" | "SELL" | "HOLD";

export interface AnalyzeRequest {
  user_id: string;
  ticker: string;
  event: "market_update";
}

export interface AnalyzeResponse {
  action: TradeAction;
  confidence: number;
  reason: string[];
  trace: {
    tools_used: string[];
    execution_order: string[];
    intermediate_data: Record<string, unknown>;
    generated_at?: string;
  };
}

export interface HistoryPoint {
  timestamp: string;
  close: number;
}

export interface HistoryResponse {
  ticker: string;
  source: string;
  points: HistoryPoint[];
}

export interface PortfolioHolding {
  ticker: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  current_value: number;
  unrealized_pnl: number;
}

export interface PortfolioResponse {
  user_id: string;
  name: string;
  risk_level: string;
  cash: number;
  holdings: PortfolioHolding[];
  total_value: number;
}

export interface AlertItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
}
