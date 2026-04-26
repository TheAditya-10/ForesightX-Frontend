import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, TrendingUp, TrendingDown } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { STOCKS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { fetchPrice, searchInstruments } from "@/lib/platform-api";

const Search = () => {
  const [q, setQ] = useState("");
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number; changePct: number }>>({});
  const [remoteMatches, setRemoteMatches] = useState<Array<{ symbol: string; name: string; sector: string }>>([]);

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setRemoteMatches([]);
      return;
    }
    let mounted = true;
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchInstruments(query, 20);
        if (!mounted) return;
        setRemoteMatches(
          results.map((item) => ({
            symbol: item.ticker,
            name: item.name || item.ticker,
            sector: item.exchange || "Market",
          }))
        );
      } catch {
        if (mounted) setRemoteMatches([]);
      }
    }, 250);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [q]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const updates: Record<string, { price: number; change: number; changePct: number }> = {};
      await Promise.all(
        STOCKS.map(async (stock) => {
          try {
            const quote = await fetchPrice(stock.symbol);
            const base = stock.price || quote.price;
            updates[stock.symbol] = {
              price: quote.price,
              change: quote.price - base,
              changePct: ((quote.price - base) / base) * 100,
            };
          } catch {
            // Keep fallback data.
          }
        })
      );
      if (mounted) setLivePrices(updates);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const merged = useMemo(
    () =>
      STOCKS.map((stock) => ({
        ...stock,
        price: livePrices[stock.symbol]?.price ?? stock.price,
        change: livePrices[stock.symbol]?.change ?? stock.change,
        changePct: livePrices[stock.symbol]?.changePct ?? stock.changePct,
      })),
    [livePrices]
  );

  const filtered = useMemo(() => {
    const local = merged.filter(s =>
      s.symbol.toLowerCase().includes(q.toLowerCase()) ||
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.sector.toLowerCase().includes(q.toLowerCase())
    );
    if (!q.trim() || remoteMatches.length === 0) return local;

    const seen = new Set(local.map((item) => item.symbol));
    const remoteNormalized = remoteMatches
      .filter((item) => !seen.has(item.symbol))
      .map((item) => ({
        symbol: item.symbol,
        displaySymbol: item.symbol,
        name: item.name,
        sector: item.sector,
        price: 0,
        change: 0,
        changePct: 0,
      }));
    return [...local, ...remoteNormalized];
  }, [merged, q, remoteMatches]);

  return (
    <DashboardLayout activeTab="search">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Search the market</h1>
        <p className="mt-2 text-muted-foreground">Find any stock by name, ticker or sector.</p>

        <div className="relative mt-8">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Tata, NVDA, Banking…"
            className="h-14 rounded-2xl border-border bg-card pl-12 text-base shadow-elegant"
          />
        </div>

        <div className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">
          {q ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}` : "Trending today"}
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No matches found.</div>
          ) : (
            filtered.map((s) => {
              const up = s.change >= 0;
              return (
                <Link
                  key={s.symbol}
                  to={`/dashboard/stock/${s.symbol}`}
                  className="flex items-center justify-between border-b border-border/60 px-5 py-4 last:border-0 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-semibold">
                      {s.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.displaySymbol ?? s.symbol} · {s.sector}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-tabular font-medium">${s.price.toLocaleString()}</div>
                    <div className={cn("flex items-center justify-end gap-1 text-xs", up ? "text-success" : "text-loss")}>
                      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {up ? "+" : ""}{s.changePct.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Search;
