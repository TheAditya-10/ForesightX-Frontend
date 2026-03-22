import { useState } from "react";
import { Search } from "lucide-react";

export function StockSearch({
  ticker,
  onAnalyze,
  loading
}: {
  ticker: string;
  onAnalyze: (ticker: string) => Promise<void>;
  loading: boolean;
}) {
  const [value, setValue] = useState(ticker);

  return (
    <section className="rounded-3xl border border-white/10 bg-panel/85 p-5 shadow-soft">
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/40">Stock Search</p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={async (event) => {
          event.preventDefault();
          await onAnalyze(value.toUpperCase());
        }}
      >
        <label className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <Search className="h-4 w-4 text-white/50" />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value.toUpperCase())}
            className="w-full bg-transparent font-mono text-white outline-none placeholder:text-white/25"
            placeholder="Enter ticker e.g. NVDA"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-gradient-to-r from-glow to-accent px-5 py-3 font-medium text-ink transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Run Analysis"}
        </button>
      </form>
    </section>
  );
}
