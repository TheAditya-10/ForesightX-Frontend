import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent shadow-glow">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l5-5 4 4 9-9" />
          <path d="M14 7h7v7" />
        </svg>
      </div>
      <span className="font-display text-lg font-semibold tracking-tight">
        ForeSight<span className="text-accent">X</span>
      </span>
    </div>
  );
}
