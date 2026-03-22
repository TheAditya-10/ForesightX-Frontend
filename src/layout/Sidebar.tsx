const navItems = ["Dashboard", "Signals", "Explainability", "Portfolio", "Alerts"];

export function Sidebar() {
  return (
    <aside className="rounded-[28px] border border-white/10 bg-slate/85 p-6 shadow-soft">
      <div className="rounded-2xl bg-gradient-to-br from-glow/30 to-accent/20 p-4">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/55">ForesightX</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white">AI Financial Intelligence</h1>
      </div>

      <nav className="mt-8 space-y-3">
        {navItems.map((item, index) => (
          <div
            key={item}
            className={`rounded-2xl px-4 py-3 text-sm transition ${
              index === 0 ? "bg-white text-ink" : "bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"
            }`}
          >
            {item}
          </div>
        ))}
      </nav>
    </aside>
  );
}
