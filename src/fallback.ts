import type {
  AnalyzeEvent,
  AnalyzeResponse,
  AppControls,
  AppDataBundle,
  HistoryPoint,
  PortfolioHolding,
} from "./types";

function tickerSeed(ticker: string) {
  return ticker
    .toUpperCase()
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
}

function priceBase(ticker: string) {
  const seed = tickerSeed(ticker);
  return 90 + (seed % 140);
}

function eventAction(event: AnalyzeEvent): AnalyzeResponse["action"] {
  if (event === "risk_alert") {
    return "HOLD";
  }

  if (event === "portfolio_rebalance") {
    return "SELL";
  }

  return "BUY";
}

function buildHistory(ticker: string) {
  const base = priceBase(ticker);
  const now = Date.now();

  const points: HistoryPoint[] = Array.from({ length: 24 }, (_, index) => {
    const drift = index * 1.35;
    const wave = Math.sin(index / 2.8) * 6.5;
    const close = Number((base + drift + wave).toFixed(2));

    return {
      timestamp: new Date(now - (23 - index) * 60 * 60 * 1000).toISOString(),
      close,
    };
  });

  return points;
}

function buildHoldings(ticker: string): PortfolioHolding[] {
  const leadPrice = Number((priceBase(ticker) + 18.45).toFixed(2));

  return [
    {
      ticker,
      quantity: 120,
      avg_price: Number((leadPrice - 12.8).toFixed(2)),
      current_price: leadPrice,
      current_value: Number((leadPrice * 120).toFixed(2)),
      unrealized_pnl: Number((12.8 * 120).toFixed(2)),
    },
    {
      ticker: "NVDA",
      quantity: 38,
      avg_price: 811.44,
      current_price: 844.21,
      current_value: Number((844.21 * 38).toFixed(2)),
      unrealized_pnl: Number(((844.21 - 811.44) * 38).toFixed(2)),
    },
    {
      ticker: "MSFT",
      quantity: 56,
      avg_price: 401.18,
      current_price: 418.9,
      current_value: Number((418.9 * 56).toFixed(2)),
      unrealized_pnl: Number(((418.9 - 401.18) * 56).toFixed(2)),
    },
    {
      ticker: "BTC-USD",
      quantity: 2,
      avg_price: 64210,
      current_price: 68320,
      current_value: 136640,
      unrealized_pnl: 8220,
    },
  ];
}

export function buildFallbackBundle(controls: AppControls): AppDataBundle {
  const ticker = controls.ticker.toUpperCase();
  const history = buildHistory(ticker);
  const currentPrice = history.at(-1)?.close ?? priceBase(ticker);
  const holdings = buildHoldings(ticker);
  const totalHoldingsValue = holdings.reduce((sum, holding) => sum + holding.current_value, 0);
  const cash = 28450;
  const totalValue = Number((totalHoldingsValue + cash).toFixed(2));
  const generatedAt = new Date().toISOString();

  return {
    price: {
      ticker,
      price: currentPrice,
      timestamp: generatedAt,
      currency: "USD",
      source: "fallback-preview",
    },
    indicators: {
      ticker,
      rsi: 63.4,
      macd: 4.12,
      signal: controls.event === "risk_alert" ? "neutral" : "bullish",
      macd_signal: 2.88,
      macd_histogram: 1.24,
      computed_at: generatedAt,
      source: "fallback-preview",
    },
    history: {
      ticker,
      points: history,
      source: "fallback-preview",
    },
    news: {
      ticker,
      headlines: [
        {
          headline: `${ticker} liquidity is rotating back into large-cap risk as macro volatility cools.`,
          timestamp: generatedAt,
          source: "Synthetic Feed",
        },
        {
          headline: `Orchestration models flagged ${ticker} as a high-attention asset for ${controls.event.replace("_", " ")} flows.`,
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          source: "System Pulse",
        },
        {
          headline: `Cross-service confidence improved after market, profile, and sentiment layers converged on ${ticker}.`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          source: "AI Desk",
        },
      ],
    },
    analysis: {
      action: eventAction(controls.event),
      confidence: controls.event === "risk_alert" ? 0.67 : 0.84,
      reason: [
        `${ticker} shows supportive momentum across price, indicator, and execution trace layers.`,
        "Portfolio risk remains inside the demo guardrails while upside participation stays attractive.",
        "Fallback mode is synthesizing a realistic preview because one or more live services were unavailable.",
      ],
      trace: {
        tools_used: ["market_data", "portfolio_profile", "risk_guard", "decision_engine"],
        execution_order: ["event_node", "data_fetch_node", "analysis_node", "decision_node", "risk_check_node"],
        intermediate_data: {
          ticker,
          event: controls.event,
          momentum_score: 0.78,
          liquidity_regime: "supportive",
          risk_level: controls.event === "risk_alert" ? "medium" : "moderate",
        },
        generated_at: generatedAt,
      },
    },
    portfolio: {
      user_id: controls.userId,
      name: "Demo Operator",
      risk_level: controls.event === "risk_alert" ? "medium" : "moderate",
      cash,
      holdings,
      total_value: totalValue,
    },
    risk: {
      user_id: controls.userId,
      risk_level: controls.event === "risk_alert" ? "medium" : "moderate",
    },
  };
}
