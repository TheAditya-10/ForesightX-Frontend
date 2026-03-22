import { useEffect } from "react";

import { AIInsightCard } from "../components/AIInsightCard";
import { AlertsPanel } from "../components/AlertsPanel";
import { ExplainabilityPanel } from "../components/ExplainabilityPanel";
import { PortfolioPanel } from "../components/PortfolioPanel";
import { PriceChart } from "../components/PriceChart";
import { StockSearch } from "../components/StockSearch";
import { Sidebar } from "../layout/Sidebar";
import { Topbar } from "../layout/Topbar";
import { useDashboardStore } from "../store/useDashboardStore";


export function DashboardPage() {
  const {
    userId,
    ticker,
    analysis,
    portfolio,
    history,
    alerts,
    analysisLoading,
    portfolioLoading,
    historyLoading,
    error,
    bootstrap,
    analyze
  } = useDashboardStore();

  useEffect(() => {
    void bootstrap(userId, ticker);
  }, [bootstrap]);

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(81,196,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(67,217,189,0.12),transparent_35%)]" />

      <div className="relative mx-auto grid max-w-[1600px] gap-6 px-4 py-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />

        <main className="space-y-6">
          <Topbar userId={userId} />

          <StockSearch ticker={ticker} onAnalyze={analyze} loading={analysisLoading} />

          {error && (
            <div className="rounded-2xl border border-danger/40 bg-danger/10 px-5 py-4 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <PriceChart history={history} loading={historyLoading} />
            <AIInsightCard analysis={analysis} loading={analysisLoading} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <PortfolioPanel portfolio={portfolio} loading={portfolioLoading} />
            <ExplainabilityPanel analysis={analysis} />
          </div>

          <AlertsPanel alerts={alerts} />
        </main>
      </div>
    </div>
  );
}
