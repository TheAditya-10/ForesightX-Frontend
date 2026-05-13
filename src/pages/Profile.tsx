import { useEffect, useMemo, useState } from "react";
import { Camera, Edit3, TrendingUp, TrendingDown, Wallet, PieChart, Activity } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Holding } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  fetchPortfolio,
  fetchRisk,
  fetchUserProfile,
  updateUserProfile,
  uploadUserProfilePhoto,
  updatePortfolioPosition,
  fetchPortfolioHistory,
  type SignupProfileInput,
} from "@/lib/platform-api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getUserId, loadSession } from "@/lib/session";
import { Skeleton } from "@/components/ui/skeleton";

const emptyProfile: SignupProfileInput = {
  name: "",
  email: "",
  phone: "",
  pan: "",
  city: "",
  photo: "",
  riskLevel: "medium",
};

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<SignupProfileInput>(() => ({
    ...emptyProfile,
    email: loadSession()?.user.email || "",
  }));
  const [tempProfile, setTempProfile] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [riskLevel, setRiskLevel] = useState("moderate");
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Array<{ id: number; ticker: string; action: string; quantity: number; price: number; realized_pnl: number | null; created_at: string }>>([]);
  const [sellOpen, setSellOpen] = useState(false);
  const [sellTicker, setSellTicker] = useState<string | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [sellMax, setSellMax] = useState(0);
  const [selling, setSelling] = useState(false);

  useEffect(() => {
    const userId = getUserId();
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [userProfile, portfolio, risk] = await Promise.all([
          fetchUserProfile(userId),
          fetchPortfolio(userId),
          fetchRisk(userId),
        ]);
        if (!mounted) return;
        const nextProfile: SignupProfileInput = {
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          pan: userProfile.pan,
          city: userProfile.city,
          photo: userProfile.photo,
          riskLevel: userProfile.riskLevel,
        };
        setProfile(nextProfile);
        setTempProfile(nextProfile);
        setHoldings(
          portfolio.holdings.map((item) => ({
            symbol: item.symbol,
            name: item.name || item.symbol,
            qty: item.qty,
            avgPrice: item.avgPrice,
            price: item.price,
          }))
        );
        try {
          const hist = await fetchPortfolioHistory(userId);
          setHistory(hist || []);
        } catch {
          setHistory([]);
        }
        setRiskLevel(risk.risk_level);
      } catch (err) {
        if (mounted) setProfileError(err instanceof Error ? err.message : "Could not load profile");
      } finally {
        if (mounted) setLoading(false);
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
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileError("Use a JPEG, PNG, or WebP profile photo");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Profile photo must be 2 MB or smaller");
      return;
    }
    setPhotoFile(file);
    setProfileError(null);
    setTempProfile({ ...tempProfile, photo: URL.createObjectURL(file) });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileError(null);
    try {
      const userId = getUserId();
      let saved = await updateUserProfile(userId, { ...tempProfile, photo: profile.photo });
      if (photoFile) {
        saved = await uploadUserProfilePhoto(userId, photoFile);
      }
      const nextProfile: SignupProfileInput = {
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        pan: saved.pan,
        city: saved.city,
        photo: saved.photo,
        riskLevel: saved.riskLevel,
      };
      setProfile(nextProfile);
      setTempProfile(nextProfile);
      setPhotoFile(null);
      setRiskLevel(saved.riskLevel);
      setEditing(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <DashboardLayout activeTab="profile">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <section className="lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
            <div className="flex flex-col items-center text-center">
              {loading ? (
                <div className="w-full">
                  <div className="relative">
                    <Skeleton className="h-28 w-28 rounded-full mx-auto" />
                  </div>
                  <div className="mt-4">
                    <Skeleton className="h-6 w-40 mx-auto" />
                    <Skeleton className="mt-2 h-4 w-56 mx-auto" />
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs uppercase justify-center">
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-border bg-gradient-accent">
                      {(editing ? tempProfile.photo : profile.photo) ? (
                        <img src={editing ? tempProfile.photo : profile.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-3xl font-semibold text-accent-foreground">
                          {(profile.name || "FX").split(" ").map(n => n[0]).join("").slice(0, 2)}
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
                  <h2 className="font-display mt-4 text-xl font-semibold">{profile.name || "Your profile"}</h2>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Verified Trader
                    <span className="text-muted-foreground">· {riskLevel}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </>
              ) : (
                <>
                  {(["name", "email", "phone", "pan", "city"] as const).map((key) => (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={key} className="text-xs uppercase tracking-wider text-muted-foreground">{key}</Label>
                      {editing ? (
                        <Input
                          id={key}
                          value={tempProfile[key]}
                          onChange={(e) => setTempProfile({ ...tempProfile, [key]: key === "pan" ? e.target.value.toUpperCase() : e.target.value })}
                          className="h-10"
                        />
                      ) : (
                        <div className="font-mono-tabular text-sm">{profile[key] || "Not set"}</div>
                      )}
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label htmlFor="riskLevel" className="text-xs uppercase tracking-wider text-muted-foreground">risk</Label>
                    {editing ? (
                      <select
                        id="riskLevel"
                        value={tempProfile.riskLevel}
                        onChange={(e) => setTempProfile({ ...tempProfile, riskLevel: e.target.value as SignupProfileInput["riskLevel"] })}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    ) : (
                      <div className="font-mono-tabular text-sm">{profile.riskLevel}</div>
                    )}
                  </div>
                </>
              )}
            </div>
            {profileError && <p className="mt-4 text-sm text-loss">{profileError}</p>}

            <div className="mt-6 flex gap-2">
              {editing ? (
                <>
                  <Button className="flex-1" onClick={handleSaveProfile} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                  <Button variant="outline" className="flex-1" onClick={() => { setTempProfile(profile); setPhotoFile(null); setEditing(false); }} disabled={saving}>Cancel</Button>
                </>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setEditing(true)} disabled={loading}>
                  <Edit3 className="mr-2 h-4 w-4" /> Edit personal details
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card shadow-elegant mt-6 p-5">
            <h3 className="font-display text-lg font-semibold">Transaction history</h3>
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground mt-3">No trades yet</div>
            ) : (
              <div className="mt-3 text-sm">
                {history.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-border/60 py-2">
                    <div className="font-mono-tabular">
                      <div className="font-medium">{t.ticker} · {t.action}</div>
                      <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right font-mono-tabular">
                      <div>${t.price.toFixed(2)} · {t.quantity}</div>
                      <div className={t.realized_pnl !== null && t.realized_pnl >= 0 ? "text-success text-xs" : "text-loss text-xs"}>{t.realized_pnl !== null ? `${t.realized_pnl >= 0 ? "+" : ""}$${t.realized_pnl.toFixed(2)}` : "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Portfolio */}
        <section className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            {loading ? (
              <>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="mt-3 h-8 w-full" />
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="mt-3 h-8 w-full" />
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="mt-3 h-8 w-full" />
                </div>
              </>
            ) : (
              <>
                <StatCard label="Portfolio value" value={`$${current.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={Wallet} />
                <StatCard label="Total invested" value={`$${invested.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} icon={PieChart} />
                <StatCard
                  label="Today's P&L"
                  value={`${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  sub={`${pnl >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`}
                  icon={pnl >= 0 ? TrendingUp : TrendingDown}
                  tone={pnl >= 0 ? "up" : "down"}
                />
              </>
            )}
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
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/60 last:border-0">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div>
                              <Skeleton className="h-4 w-28" />
                              <Skeleton className="mt-2 h-3 w-40" />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-mono-tabular"><Skeleton className="h-4 w-10 mx-auto" /></td>
                        <td className="px-5 py-4 text-right font-mono-tabular text-muted-foreground"><Skeleton className="h-4 w-16 mx-auto" /></td>
                        <td className="px-5 py-4 text-right font-mono-tabular"><Skeleton className="h-4 w-16 mx-auto" /></td>
                        <td className="px-5 py-4 text-right font-mono-tabular"><Skeleton className="h-4 w-20 mx-auto" /></td>
                      </tr>
                    ))
                  ) : (
                    holdings.map((h) => {
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
                          <td className="px-5 py-4 text-right">
                            <Button variant="ghost" onClick={() => {
                              setSellTicker(h.symbol);
                              setSellQty(1);
                              setSellMax(h.qty);
                              setSellOpen(true);
                            }}>Sell</Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sell · {sellTicker}</DialogTitle>
            <DialogDescription>Confirm quantity to sell</DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <div className="mb-3 text-sm">Max available: {sellMax}</div>
            <input type="number" min={1} max={sellMax} value={sellQty} onChange={(e) => setSellQty(Math.max(1, Math.min(sellMax, Number(e.target.value) || 1)))} className="w-full rounded-md border px-3 py-2" />
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" onClick={async () => {
                if (!sellTicker) return;
                if (sellQty < 1 || sellQty > sellMax) return toast.error("Invalid quantity");
                setSelling(true);
                try {
                  const userId = getUserId();
                  await updatePortfolioPosition(userId, sellTicker, -sellQty);
                  const refreshed = await fetchPortfolio(userId);
                  setHoldings(refreshed.holdings || []);
                  const hist = await fetchPortfolioHistory(userId);
                  setHistory(hist || []);
                  setSellOpen(false);
                  toast.success("Sell executed");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Sell failed");
                } finally {
                  setSelling(false);
                }
              }} disabled={selling}>{selling ? "Selling…" : "Confirm sell"}</Button>
              <Button variant="outline" onClick={() => setSellOpen(false)} disabled={selling}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
