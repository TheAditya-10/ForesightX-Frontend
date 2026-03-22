import { Activity, ShieldCheck } from "lucide-react";

export function Topbar({ userId }: { userId: string }) {
  return (
    <header className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate/70 px-6 py-5 shadow-soft md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/40">Decision Engine</p>
        <h2 className="mt-2 font-display text-3xl text-white">Event-Driven Trade Intelligence</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70">
          <Activity className="h-4 w-4 text-accent" />
          Live microservices
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70">
          <ShieldCheck className="h-4 w-4 text-glow" />
          {userId}
        </div>
      </div>
    </header>
  );
}
