import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Brain, ShieldCheck, Zap, LineChart, Newspaper, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { STOCKS } from "@/lib/mockData";

const documentationUrl = import.meta.env.VITE_DOCUMENTATION_URL as string | undefined;

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_30%,transparent_75%)]" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#markets" className="hover:text-foreground transition-colors">Markets</a>
          <a href="#intelligence" className="hover:text-foreground transition-colors">Intelligence</a>
          {documentationUrl ? (
            <a
              href={documentationUrl}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
              rel="noreferrer"
              target="_blank"
            >
              <BookOpen className="h-4 w-4" />
              Documentation
            </a>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-16 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/40 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
            Markets are open · NSE & NASDAQ live
          </span>
          <h1 className="font-display mt-6 text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Trade with <span className="text-accent">foresight</span>,
            <br className="hidden md:block" /> not guesswork.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            ForeSightX brings institutional-grade analytics, AI predictions and real-time
            news into one elegant trading workspace.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-7 shadow-glow">
              <Link to="/signup">
                Open free account <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>
        </motion.div>

        {/* Hero panel mock */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="rounded-2xl border border-border bg-card/60 p-2 shadow-elegant backdrop-blur-md">
            <div className="rounded-xl bg-surface p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Watchlist</div>
                  <div className="font-display mt-1 text-xl font-semibold">Your edge today</div>
                </div>
                <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                  <LineChart className="h-4 w-4 text-accent" /> Live market data
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                {STOCKS.slice(0, 4).map((s) => {
                  const up = s.change >= 0;
                  return (
                    <div key={s.symbol} className="rounded-lg border border-border/70 bg-background/40 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">{s.symbol}</span>
                        <span className={`font-mono-tabular text-xs ${up ? "text-success" : "text-loss"}`}>
                          {up ? "▲" : "▼"} {Math.abs(s.changePct).toFixed(2)}%
                        </span>
                      </div>
                      <div className="font-mono-tabular mt-3 text-xl font-semibold">${s.price.toLocaleString()}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">{s.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ticker */}
        <div className="relative mt-16 overflow-hidden rounded-full border border-border/80 bg-card/40 py-3 backdrop-blur">
          <div className="flex w-max animate-ticker gap-10 whitespace-nowrap px-4">
            {[...STOCKS, ...STOCKS].map((s, i) => (
              <span key={i} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-muted-foreground">{s.symbol}</span>
                <span className="font-mono-tabular">${s.price.toLocaleString()}</span>
                <span className={`font-mono-tabular text-xs ${s.change >= 0 ? "text-success" : "text-loss"}`}>
                  {s.change >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <section id="features" className="mt-28">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Built for serious traders.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Every component is designed to give you a measurable edge.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Brain, title: "AI Seek Engine", text: "Forward-looking price predictions with confidence intervals — built on deep market patterns." },
              { icon: BarChart3, title: "Pro-grade charts", text: "Candle, line and area views across 1D, 1W, 1M, 1Y. RSI, MACD, SMAs at a glance." },
              { icon: Newspaper, title: "Curated newsroom", text: "Stock-aware feed that surfaces only what moves your portfolio." },
              { icon: Zap, title: "One-click execution", text: "Buy in two taps. Smart confirmations protect you from fat-finger trades." },
              { icon: ShieldCheck, title: "Bank-grade security", text: "End-to-end encryption, biometric login, and MFA on every withdrawal." },
              { icon: LineChart, title: "Microservice core", text: "Resilient architecture with sub-100ms data, even on volatile sessions." },
            ].map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-elegant hover:-translate-y-0.5"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-28 rounded-3xl border border-border bg-surface p-10 text-center shadow-elegant md:p-16">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            Your next trade deserves <span className="text-accent">foresight</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Join thousands of traders making sharper decisions every day.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="rounded-full px-8 shadow-glow">
              <Link to="/signup">Create your account <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <Logo />
          <div>© {new Date().getFullYear()} ForeSightX. All markets, one platform.</div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
