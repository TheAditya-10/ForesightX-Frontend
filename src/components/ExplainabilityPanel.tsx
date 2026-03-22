import type { AnalyzeResponse } from "../types";

export function ExplainabilityPanel({ analysis }: { analysis: AnalyzeResponse | null }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-panel/85 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-white">Explainability</h3>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">trace</span>
      </div>

      {!analysis ? (
        <p className="mt-5 text-sm text-white/55">Tool usage and intermediate signals appear after an analysis run.</p>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">Tools Used</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {analysis.trace.tools_used.map((tool) => (
                <span key={tool} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">Execution Order</p>
            <ol className="mt-3 space-y-2 text-sm text-white/80">
              {analysis.trace.execution_order.map((step, index) => (
                <li key={step}>
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#07101d] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">Intermediate Data</p>
            <pre className="mt-3 max-h-64 overflow-auto text-xs text-accent">
              {JSON.stringify(analysis.trace.intermediate_data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
