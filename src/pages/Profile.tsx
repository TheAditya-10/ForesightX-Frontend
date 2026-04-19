import { useEffect, useMemo, useState } from "react";
import { Camera, Edit3, TrendingUp, TrendingDown, Wallet, PieChart, Activity } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_HOLDINGS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { fetchPortfolio, fetchRisk } from "@/lib/platform-api";
import { getUserId } from "@/lib/session";

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "Aarav Sharma",
    email: "aarav@foresightx.com",
    phone: "+91 98765 43210",
    pan: "ABCDE1234F",
    city: "Mumbai, IN",
    photo: "",
  });
  const [tempProfile, setTempProfile] = useState(profile);

  const [holdings, setHoldings] = useState(INITIAL_HOLDINGS);
  const [riskLevel, setRiskLevel] = useState("moderate");

  useEffect(() => {
    const userId = getUserId();
    let mounted = true;
    (async () => {
      try {
        const [portfolio, risk] = await Promise.all([fetchPortfolio(userId), fetchRisk(userId)]);
        if (!mounted) return;
        setHoldings(
          portfolio.holdings.map((item) => ({
            symbol: item.symbol,
            name: item.name || item.symbol,
            qty: item.qty,
            avgPrice: item.avgPrice,
            price: item.price,
          }))
        );
        setRiskLevel(risk.risk_level);
      } catch {
        // Keep local fallback holdings for preview mode.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const invested = useMemo(() => holdings.reduce((s, h) => s + h.qty * h.avgPrice, 0), [holdings]);
  const current = useMemo(() => holdings.reduce((s, h) => s + h.qty * h.price, 0), [holdings]);
  const pnl = current - invested;
  const pnlPct = invested === 0 ? 0 : (pnl / invested) * 100;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTempProfile({ ...tempProfile, photo: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout activeTab="profile">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <section className="lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-border bg-gradient-accent">
                  {(editing ? tempProfile.photo : profile.photo) ? (
                    <img src={editing ? tempProfile.photo : profile.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-3xl font-semibold text-accent-foreground">
                      {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                </div>
                {editing && (
                  <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground shadow-glow">
                    <Camera className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  </label>
                )}
              </div>
              <h2 className="font-display mt-4 text-xl font-semibold">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Verified Trader
                <span className="text-muted-foreground">· {riskLevel}</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {(["name", "email", "phone", "pan", "city"] as const).map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key} className="text-xs uppercase tracking-wider text-muted-foreground">{key}</Label>
                  {editing ? (
                    <Input
                      id={key}
                      value={tempProfile[key]}
                      onChange={(e) => setTempProfile({ ...tempProfile, [key]: e.target.value })}
                      className="h-10"
                    />
                  ) : (
                    <div className="font-mono-tabular text-sm">{profile[key]}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              {editing ? (
                <>
                  <Button className="flex-1" onClick={() => { setProfile(tempProfile); setEditing(false); }}>Save</Button>
                  <Button variant="outline" className="flex-1" onClick={() => { setTempProfile(profile); setEditing(false); }}>Cancel</Button>
                </>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>
                  <Edit3 className="mr-2 h-4 w-4" /> Edit personal details
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Portfolio */}
        <section className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Portfolio value" value={`$${current.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={Wallet} />
            <StatCard label="Total invested" value={`$${invested.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={PieChart} />
            <StatCard
              label="Today's P&L"
              value={`${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              sub={`${pnl >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`}
              icon={pnl >= 0 ? TrendingUp : TrendingDown}
              tone={pnl >= 0 ? "up" : "down"}
            />
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-elegant">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h3 className="font-display text-lg font-semibold">Current holdings</h3>
                <p className="text-xs text-muted-foreground">{holdings.length} positions · live valuations</p>
              </div>
              <Activity className="h-4 w-4 text-accent" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left font-medium">Symbol</th>
                    <th className="px-5 py-3 text-right font-medium">Qty</th>
                    <th className="px-5 py-3 text-right font-medium">Avg</th>
                    <th className="px-5 py-3 text-right font-medium">LTP</th>
                    <th className="px-5 py-3 text-right font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const value = h.qty * h.price;
                    const cost = h.qty * h.avgPrice;
                    const p = value - cost;
                    const pp = (p / cost) * 100;
                    const up = p >= 0;
                    return (
                      <tr key={h.symbol} className="border-b border-border/60 last:border-0 hover:bg-secondary/40 transition-colors">
                        <td className="px-5 py-4">
                          <Link to={`/dashboard/stock/${h.symbol}`} className="block">
                            <div className="font-mono text-sm font-semibold">{h.symbol}</div>
                            <div className="text-xs text-muted-foreground">{h.name}</div>
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-right font-mono-tabular">{h.qty}</td>
                        <td className="px-5 py-4 text-right font-mono-tabular text-muted-foreground">${h.avgPrice.toFixed(2)}</td>
                        <td className="px-5 py-4 text-right font-mono-tabular">${h.price.toFixed(2)}</td>
                        <td className={cn("px-5 py-4 text-right font-mono-tabular", up ? "text-success" : "text-loss")}>
                          <div>{up ? "+" : ""}${p.toFixed(2)}</div>
                          <div className="text-xs">{up ? "+" : ""}{pp.toFixed(2)}%</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

function StatCard({ label, value, sub, icon: Icon, tone }: { label: string; value: string; sub?: string; icon: any; tone?: "up" | "down" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4", tone === "up" && "text-success", tone === "down" && "text-loss", !tone && "text-muted-foreground")} />
      </div>
      <div className="font-mono-tabular mt-3 font-display text-2xl font-semibold">{value}</div>
      {sub && <div className={cn("mt-1 text-xs font-medium", tone === "up" ? "text-success" : "text-loss")}>{sub}</div>}
    </div>
  );
}

export default Profile;
