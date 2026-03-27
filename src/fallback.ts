import type {
  AnalyzeEvent,
  AnalyzeResponse,
  AnalysisJobResponse,
  AppControls,
  AppDataBundle,
  HistoryPoint,
  PortfolioHolding,
  ServiceHealth,
  ServiceKey,
  SessionState,
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
    const drift = index * 1.2;
    const wave = Math.sin(index / 2.8) * 6.3;
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

function buildHealth(status: string): Record<ServiceKey, ServiceHealth> {
  const generatedAt = new Date().toISOString();

  return {
    auth: { service: "foresightx-auth", status, timestamp: generatedAt },
    data: { service: "foresightx-data", status, timestamp: generatedAt },
    profile: { service: "foresightx-profile", status, timestamp: generatedAt },
    pattern: { service: "foresightx-pattern", status, timestamp: generatedAt, available_models: ["AAPL", "MSFT", "NVDA"] },
    orchestration: { service: "foresightx-orchestration", status, timestamp: generatedAt },
  };
}

function buildJobs(userId: string, ticker: string, analysis: AnalyzeResponse): AnalysisJobResponse[] {
  return [
    {
      job_id: "preview-job-001",
      user_id: userId,
      ticker,
      event: "market_update",
      status: "completed",
      action: analysis.action,
      confidence: analysis.confidence,
      reasons: analysis.reason,
      created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      events: analysis.trace.execution_order.map((node, index) => ({
        sequence_number: index + 1,
        node_name: node,
        tools_used: index === 1 ? analysis.trace.tools_used : [],
        payload:
          index === 0
            ? { ticker, user_id: userId }
            : index === 2
              ? analysis.trace.intermediate_data
              : null,
        created_at: new Date(Date.now() - (8 - index) * 60 * 1000).toISOString(),
      })),
    },
  ];
}

export function buildFallbackBundle(
  controls: AppControls,
  session: SessionState | null,
  healthStatus: "ok" | "degraded" = "degraded"
): AppDataBundle {
  const ticker = controls.ticker.toUpperCase();
  const userId = session?.user.id ?? "preview-user";
  const history = buildHistory(ticker);
  const currentPrice = history.at(-1)?.close ?? priceBase(ticker);
  const holdings = buildHoldings(ticker);
  const totalHoldingsValue = holdings.reduce((sum, holding) => sum + holding.current_value, 0);
  const cash = 28450;
  const totalValue = Number((totalHoldingsValue + cash).toFixed(2));
  const generatedAt = new Date().toISOString();

  const analysis: AnalyzeResponse = {
    job_id: "preview-job-001",
    action: eventAction(controls.event),
    confidence: controls.event === "risk_alert" ? 0.67 : 0.84,
    reason: [
      `${ticker} shows supportive momentum across price, indicator, and orchestration layers.`,
      "Portfolio exposure remains inside the configured guardrails for the active profile.",
      "This preview is generated from the same API contracts used by the live microservices.",
    ],
    trace: {
      tools_used: ["get_stock_price", "get_indicators", "get_sentiment", "predict_pattern", "get_user_portfolio"],
      execution_order: ["event_node", "data_fetch_node", "analysis_node", "decision_node", "risk_check_node"],
      intermediate_data: {
        ticker,
        event: controls.event,
        momentum_score: 0.78,
        pattern_prediction: "bullish",
        pattern_confidence: 0.81,
        risk_level: controls.event === "risk_alert" ? "medium" : "moderate",
      },
      generated_at: generatedAt,
    },
  };

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
          headline: `Pattern inference remains supportive for ${ticker} under ${controls.event.replace("_", " ")} conditions.`,
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          source: "Model Desk",
        },
        {
          headline: "Cross-service confidence improved after market, profile, and sentiment layers converged.",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          source: "AI Desk",
        },
      ],
    },
    analysis,
    jobs: buildJobs(userId, ticker, analysis),
    portfolio: {
      user_id: userId,
      name: session?.user.email?.split("@")[0] ?? "Preview Operator",
      risk_level: controls.event === "risk_alert" ? "medium" : "moderate",
      cash,
      holdings,
      total_value: totalValue,
    },
    risk: {
      user_id: userId,
      risk_level: controls.event === "risk_alert" ? "medium" : "moderate",
    },
    latestPrediction: {
      prediction_id: "prediction-preview-001",
      symbol: ticker,
      as_of_date: generatedAt,
      predicted_return: 0.032,
      predicted_direction: "up",
      latest_close: currentPrice,
      predicted_next_close: Number((currentPrice * 1.032).toFixed(2)),
      model_type: "mlp",
      model_timestamp: generatedAt,
      features_used: 28,
    },
    signalPrediction: {
      prediction_id: "signal-preview-001",
      symbol: ticker,
      prediction: "bullish",
      confidence: 0.81,
      predicted_return: 0.032,
      latest_close: currentPrice,
      predicted_next_close: Number((currentPrice * 1.032).toFixed(2)),
    },
    predictionHistory: {
      symbol: ticker,
      points: history.slice(-12).map((point, index) => ({
        as_of_date: point.timestamp,
        actual_return: Number((Math.sin(index / 2.5) * 0.02).toFixed(4)),
        predicted_return: Number((Math.sin(index / 2.7) * 0.018 + 0.01).toFixed(4)),
        absolute_error: Number((0.005 + (index % 3) * 0.002).toFixed(4)),
        direction_correct: index % 4 !== 0,
      })),
    },
    models: [
      {
        symbol: ticker,
        model_type: "mlp",
        features_count: 28,
        model_timestamp: generatedAt,
        metrics: { mae: 0.018, rmse: 0.026, direction_accuracy: 0.63 },
      },
      {
        symbol: "MSFT",
        model_type: "mlp",
        features_count: 28,
        model_timestamp: generatedAt,
        metrics: { mae: 0.017, rmse: 0.025, direction_accuracy: 0.66 },
      },
      {
        symbol: "NVDA",
        model_type: "mlp",
        features_count: 28,
        model_timestamp: generatedAt,
        metrics: { mae: 0.023, rmse: 0.031, direction_accuracy: 0.61 },
      },
    ],
    health: buildHealth(healthStatus),
  };
}
