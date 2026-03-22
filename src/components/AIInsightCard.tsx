import type { AnalyzeResponse } from "../types";

const actionStyles: Record<string, string> = {
  BUY: "text-accent",
  SELL: "text-danger",
  HOLD: "text-warn"
};

export function AIInsightCard({
  analysis,
  loading
}: {
  analysis: AnalyzeResponse | null;
  loading: boolean;
}) {
  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-panel/80 p-6 animate-pulse">Generating AI trade thesis...</div>;
  }

  if (!analysis) {
    return <div className="rounded-3xl border border-dashed border-white/10 bg-panel/50 p-6 text-white/60">Run an analysis to surface a decision.</div>;
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-panel/90 p-6 shadow-soft transition duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/40">AI Decision</p>
          <h2 className={`mt-3 font-display text-4xl font-bold ${actionStyles[analysis.action]}`}>{analysis.action}</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-sm text-white/70">
          {(analysis.confidence * 100).toFixed(0)}% confidence
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-glow to-accent transition-all duration-700"
          style={{ width: `${analysis.confidence * 100}%` }}
        />
      </div>

      <div className="mt-6 space-y-3">
        {analysis.reason.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
