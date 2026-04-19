import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NEWS } from "@/lib/mockData";
import { ArrowUpRight } from "lucide-react";
import { fetchNews } from "@/lib/platform-api";

const News = () => {
  const [items, setItems] = useState(NEWS);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [aapl, nvda, tata] = await Promise.all([fetchNews("AAPL"), fetchNews("NVDA"), fetchNews("TATAMOTORS.NS")]);
        if (!mounted) return;
        setItems([...aapl, ...nvda, ...tata]);
      } catch {
        // Keep fallback static feed.
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
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2">
        {rest.map((n) => (
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
