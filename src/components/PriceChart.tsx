import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { HistoryResponse } from "../types";

export function PriceChart({
  history,
  loading
}: {
  history: HistoryResponse | null;
  loading: boolean;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-panel/85 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-white">Price Action</h3>
          <p className="mt-1 text-sm text-white/55">Last 30 closing data points with smoothed animation.</p>
        </div>
      </div>

      <div className="mt-6 h-72">
        {loading || !history ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/55">
            Loading chart...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.points}>
              <defs>
                <linearGradient id="chartStroke" x1="0" x2="1">
                  <stop offset="0%" stopColor="#51c4ff" />
                  <stop offset="100%" stopColor="#43d9bd" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "#08111f",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "16px",
                  color: "#fff"
                }}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="url(#chartStroke)"
                strokeWidth={3}
                dot={false}
                isAnimationActive
                animationDuration={900}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
