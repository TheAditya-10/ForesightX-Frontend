import type { PortfolioResponse } from "../types";
import { formatCurrency } from "../utils/format";

export function PortfolioPanel({
  portfolio,
  loading
}: {
  portfolio: PortfolioResponse | null;
  loading: boolean;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-panel/85 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-white">Portfolio Context</h3>
          <p className="mt-1 text-sm text-white/55">Used by the risk engine before any final action is returned.</p>
        </div>
        {portfolio && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">Risk Level</p>
            <p className="mt-1 text-sm text-white">{portfolio.risk_level}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-6 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] p-5">Loading portfolio...</div>
      ) : !portfolio ? (
        <p className="mt-6 text-sm text-white/55">Portfolio data unavailable.</p>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">Total Value</p>
              <p className="mt-2 font-display text-3xl text-white">{formatCurrency(portfolio.total_value)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">Cash</p>
              <p className="mt-2 font-display text-3xl text-white">{formatCurrency(portfolio.cash)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm text-white/80">
              <thead className="bg-white/[0.04] text-white/45">
                <tr>
                  <th className="px-4 py-3">Ticker</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Avg</th>
                  <th className="px-4 py-3">Current</th>
                  <th className="px-4 py-3">P/L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((holding) => (
                  <tr key={holding.ticker} className="border-t border-white/10">
                    <td className="px-4 py-3 font-mono">{holding.ticker}</td>
                    <td className="px-4 py-3">{holding.quantity}</td>
                    <td className="px-4 py-3">{formatCurrency(holding.avg_price)}</td>
                    <td className="px-4 py-3">{formatCurrency(holding.current_price)}</td>
                    <td className={`px-4 py-3 ${holding.unrealized_pnl >= 0 ? "text-accent" : "text-danger"}`}>
                      {formatCurrency(holding.unrealized_pnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
