import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, Newspaper, LogOut, Bell, TrendingUp } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { STOCKS } from "@/lib/mockData";
import { clearSession, loadSession } from "@/lib/session";
import { fetchPrice, logout } from "@/lib/platform-api";

export function DashboardLayout({ children, activeTab }: { children: ReactNode; activeTab: "profile" | "search" | "news" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number; changePct: number }>>({});

  const enrichedStocks = useMemo(
    () =>
      STOCKS.map((stock) => ({
        ...stock,
        price: livePrices[stock.symbol]?.price ?? stock.price,
        change: livePrices[stock.symbol]?.change ?? stock.change,
        changePct: livePrices[stock.symbol]?.changePct ?? stock.changePct,
      })),
    [livePrices]
  );

  const results = query.length > 0
    ? enrichedStocks.filter(s =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    let mounted = true;
    (async () => {
      const updates: Record<string, { price: number; change: number; changePct: number }> = {};
      await Promise.all(
        STOCKS.slice(0, 8).map(async (stock) => {
          try {
            const quote = await fetchPrice(stock.symbol);
            const base = stock.price || quote.price;
            updates[stock.symbol] = {
              price: quote.price,
              change: quote.price - base,
              changePct: ((quote.price - base) / base) * 100,
            };
          } catch {
            // Keep fallback stock data.
          }
        })
      );
      if (mounted) {
        setLivePrices(updates);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const tabs = [
    { id: "profile", label: "Profile", icon: User, path: "/dashboard/profile" },
    { id: "search", label: "Search", icon: Search, path: "/dashboard/search" },
    { id: "news", label: "News", icon: Newspaper, path: "/dashboard/news" },
  ] as const;

  const handleSelectStock = (symbol: string) => {
    setQuery("");
    setShowResults(false);
    navigate(`/dashboard/stock/${symbol}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Link to="/dashboard/profile" className="shrink-0"><Logo /></Link>

          {/* Center: tabs */}
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {tabs.map((t) => {
              const isActive = activeTab === t.id || location.pathname.startsWith(t.path);
              return (
                <Link
                  key={t.id}
                  to={t.path}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: search + actions */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                placeholder="Search stocks…"
                className="h-9 w-64 rounded-full border-border bg-secondary/60 pl-9"
              />
              {showResults && results.length > 0 && (
                <div className="absolute right-0 top-11 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-elegant">
                  {results.map((s) => (
                    <button
                      key={s.symbol}
                      onMouseDown={() => handleSelectStock(s.symbol)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary"
                    >
                      <div>
                        <div className="font-mono text-sm font-semibold">{s.symbol}</div>
                        <div className="text-xs text-muted-foreground">{s.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-tabular text-sm">${s.price.toLocaleString()}</div>
                        <div className={cn("text-xs", s.change >= 0 ? "text-success" : "text-loss")}>
                          {s.change >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="rounded-full"><Bell className="h-[18px] w-[18px]" /></Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={async () => {
                const session = loadSession();
                if (session?.refreshToken) {
                  try {
                    await logout(session.refreshToken);
                  } catch {
                    // Ignore backend logout failures on client-side sign-out.
                  }
                }
                clearSession();
                navigate("/");
              }}
            >
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex gap-1 border-t border-border px-4 py-2 md:hidden">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <Link
                key={t.id}
                to={t.path}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium",
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground"
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Live ticker strip */}
      <div className="border-b border-border bg-card/40 py-2">
        <div className="mx-auto max-w-7xl overflow-hidden px-4 sm:px-6">
          <div className="flex w-max animate-ticker gap-8 whitespace-nowrap text-xs">
            {[...enrichedStocks, ...enrichedStocks].map((s, i) => (
              <span key={i} className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">{s.displaySymbol ?? s.symbol}</span>
                <span className="font-mono-tabular">${s.price.toLocaleString()}</span>
                <span className={cn("font-mono-tabular", s.change >= 0 ? "text-success" : "text-loss")}>
                  {s.change >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 animate-fade-in sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
