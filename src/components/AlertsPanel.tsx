import type { AlertItem } from "../types";

export function AlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-panel/85 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-white">Alerts</h3>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">event stream</span>
      </div>

      <div className="mt-5 space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-white/55">No alerts yet. Analyses appear here as explainable event cards.</p>
        ) : (
          alerts.map((alert) => (
            <article key={alert.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">{alert.type}</p>
              <p className="mt-2 text-sm text-white">{alert.title}</p>
              <p className="mt-1 text-xs text-white/55">{alert.timestamp}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
