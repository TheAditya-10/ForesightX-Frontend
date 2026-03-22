import { create } from "zustand";

import { analyzeTicker, fetchHistory, fetchPortfolio } from "../api/dashboard";
import type { AlertItem, AnalyzeResponse, HistoryResponse, PortfolioResponse } from "../types";

type DashboardState = {
  userId: string;
  ticker: string;
  analysis: AnalyzeResponse | null;
  portfolio: PortfolioResponse | null;
  history: HistoryResponse | null;
  alerts: AlertItem[];
  analysisLoading: boolean;
  portfolioLoading: boolean;
  historyLoading: boolean;
  error: string | null;
  bootstrap: (userId: string, ticker: string) => Promise<void>;
  analyze: (ticker: string) => Promise<void>;
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  userId: "demo-user",
  ticker: "NVDA",
  analysis: null,
  portfolio: null,
  history: null,
  alerts: [],
  analysisLoading: false,
  portfolioLoading: false,
  historyLoading: false,
  error: null,
  bootstrap: async (userId: string, ticker: string) => {
    set({ userId, ticker, portfolioLoading: true, historyLoading: true, error: null });
    try {
      const [portfolio, history] = await Promise.all([fetchPortfolio(userId), fetchHistory(ticker)]);
      set({ portfolio, history, portfolioLoading: false, historyLoading: false });
      if (!get().analysis) {
        await get().analyze(ticker);
      }
    } catch (error) {
      set({
        portfolioLoading: false,
        historyLoading: false,
        error: error instanceof Error ? error.message : "Failed to bootstrap dashboard."
      });
    }
  },
  analyze: async (ticker: string) => {
    const userId = get().userId;
    set({ ticker, analysisLoading: true, historyLoading: true, portfolioLoading: true, error: null });
    try {
      const [analysis, history, portfolio] = await Promise.all([
        analyzeTicker({ user_id: userId, ticker, event: "market_update" }),
        fetchHistory(ticker),
        fetchPortfolio(userId)
      ]);
      const alert: AlertItem = {
        id: `${ticker}-${Date.now()}`,
        type: analysis.action,
        title: `${ticker} analysis returned ${analysis.action} at ${(analysis.confidence * 100).toFixed(0)}% confidence.`,
        timestamp: new Date().toLocaleString()
      };
      set((state) => ({
        analysis,
        history,
        portfolio,
        analysisLoading: false,
        historyLoading: false,
        portfolioLoading: false,
        alerts: [alert, ...state.alerts].slice(0, 6)
      }));
    } catch (error) {
      set({
        analysisLoading: false,
        historyLoading: false,
        portfolioLoading: false,
        error: error instanceof Error ? error.message : "Analysis failed."
      });
    }
  }
}));
