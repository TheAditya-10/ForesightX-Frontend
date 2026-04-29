import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NEWS } from "@/lib/mockData";
import { ArrowUpRight } from "lucide-react";
import { fetchNews } from "@/lib/platform-api";
import { Skeleton } from "@/components/ui/skeleton";

const News = () => {
  const [items, setItems] = useState(NEWS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [aapl, nvda, tata] = await Promise.all([
          fetchNews("AAPL"),
          fetchNews("NVDA"),
          fetchNews("TATAMOTORS.NS"),
        ]);
        if (!mounted) return;
        setItems([...aapl, ...nvda, ...tata]);
      } catch {
        // Keep fallback static feed.
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const featured = useMemo(() => items[0] ?? NEWS[0], [items]);
  const rest = useMemo(() => items.slice(1), [items]);

  return (
    <DashboardLayout activeTab="news">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Market newsroom</h1>
        <p className="mt-2 text-muted-foreground">Curated headlines that move portfolios.</p>
      </div>

      <article className="mb-8 overflow-hidden rounded-2xl border border-border bg-surface shadow-elegant">
        <div className="grid md:grid-cols-2">
          {loading ? (
            <>
              <div className="h-56 md:h-auto">
                <Skeleton className="h-56 md:h-auto w-full" variant="rect" />
              </div>
              <div className="flex flex-col justify-between p-8">
                <div>
                  <Skeleton width="120px" height="28px" className="mb-4" />
                  <Skeleton height={36} className="w-3/4" />
                  <Skeleton height={36} className="w-1/2 mt-2" />
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                  <Skeleton width="140px" height={14} />
                  <div className="h-4 w-4" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="relative h-56 bg-gradient-accent md:h-auto">
                <div className="absolute inset-0 bg-hero-glow" />
                <div className="absolute inset-0 grid-bg opacity-30" />
              </div>
              <div className="flex flex-col justify-between p-8">
                <div>
                  <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {featured.tag} · Featured
                  </span>
                  <h2 className="font-display mt-4 text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
                    {featured.title}
                  </h2>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{featured.source} · {featured.time}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </>
          )}
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <article
                key={i}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between">
                  <Skeleton width="60px" height={16} />
                  <Skeleton width="40px" height={14} />
                </div>
                <Skeleton height={20} className="mt-3 w-full" />
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <Skeleton width="80px" height={14} />
                  <div className="flex gap-1">
                    <Skeleton width={40} height={20} />
                    <Skeleton width={40} height={20} />
                  </div>
                </div>
              </article>
            ))
          : rest.map((n) => (
              <article
                key={n.id}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-elegant hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-accent">{n.tag}</span>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </div>
                {n.url ? (
                  <a href={n.url} target="_blank" rel="noreferrer" className="font-display mt-3 block text-lg font-semibold leading-snug group-hover:text-accent transition-colors">
                    {n.title}
                  </a>
                ) : (
                  <h3 className="font-display mt-3 text-lg font-semibold leading-snug group-hover:text-accent transition-colors">
                    {n.title}
                  </h3>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{n.source}</span>
                  {n.symbols && (
                    <div className="flex gap-1">
                      {n.symbols.slice(0, 3).map(s => (
                        <span key={s} className="rounded-md border border-border bg-secondary/50 px-1.5 py-0.5 font-mono text-[10px]">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
      </div>
    </DashboardLayout>
  );
};

export default News;
