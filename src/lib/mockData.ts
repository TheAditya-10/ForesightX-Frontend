export type Stock = {
  symbol: string;
  displaySymbol?: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  sector: string;
};

export const STOCKS: Stock[] = [
  { symbol: "TATAMOTORS.NS", displaySymbol: "TATA", name: "Tata Motors", price: 1084.55, change: 8.3, changePct: 0.77, sector: "Automotive" },
  { symbol: "RELIANCE.NS", displaySymbol: "RELI", name: "Reliance Industries", price: 2918.10, change: -12.85, changePct: -0.44, sector: "Energy" },
  { symbol: "INFY.NS", displaySymbol: "INFY", name: "Infosys Ltd.", price: 1564.20, change: 8.55, changePct: 0.55, sector: "IT Services" },
  { symbol: "HDFCBANK.NS", displaySymbol: "HDFC", name: "HDFC Bank", price: 1672.40, change: 14.20, changePct: 0.86, sector: "Banking" },
  { symbol: "ICICIBANK.NS", displaySymbol: "ICICI", name: "ICICI Bank", price: 1124.90, change: -5.10, changePct: -0.45, sector: "Banking" },
  { symbol: "WIPRO.NS", displaySymbol: "WIPR", name: "Wipro Ltd.", price: 528.65, change: 3.20, changePct: 0.61, sector: "IT Services" },
  { symbol: "AAPL", name: "Apple Inc.", price: 224.55, change: 1.82, changePct: 0.82, sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 412.34, change: -2.15, changePct: -0.52, sector: "Technology" },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 138.42, change: 4.72, changePct: 3.53, sector: "Semiconductors" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.10, change: -6.40, changePct: -2.51, sector: "Automotive" },
  { symbol: "AMZN", name: "Amazon.com", price: 186.22, change: 0.94, changePct: 0.51, sector: "E-commerce" },
  { symbol: "GOOG", name: "Alphabet Inc.", price: 168.78, change: 2.10, changePct: 1.26, sector: "Technology" },
];

// Deterministic pseudo-random for stable charts
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export type Timeframe = "1D" | "1W" | "1M" | "1Y";

export function generateSeries(symbol: string, basePrice: number, tf: Timeframe) {
  const rand = seeded(symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + tf.length);
  const cfg: Record<Timeframe, { points: number; stepLabel: (i: number) => string; volatility: number }> = {
    "1D": {
      points: 39, // 6.5h trading / 10min
      volatility: 0.003,
      stepLabel: (i) => {
        const start = 9 * 60 + 30;
        const m = start + i * 10;
        const h = Math.floor(m / 60);
        const mm = m % 60;
        return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      },
    },
    "1W": { points: 7, volatility: 0.012, stepLabel: (i) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] },
    "1M": { points: 30, volatility: 0.018, stepLabel: (i) => `D${i + 1}` },
    "1Y": { points: 24, volatility: 0.04, stepLabel: (i) => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const m = months[Math.floor(i / 2)];
      return i % 2 === 0 ? `${m} 1` : `${m} 15`;
    } },
  };
  const { points, stepLabel, volatility } = cfg[tf];
  let price = basePrice * (1 - volatility * 4);
  return Array.from({ length: points }, (_, i) => {
    const drift = (rand() - 0.48) * basePrice * volatility;
    price = Math.max(basePrice * 0.7, price + drift);
    return { t: stepLabel(i), price: +price.toFixed(2) };
  });
}

export function getIndicators(symbol: string, price: number) {
  const rand = seeded(symbol.charCodeAt(0) + price);
  return {
    rsi: +(35 + rand() * 40).toFixed(1),
    macd: +((rand() - 0.5) * 4).toFixed(2),
    sma50: +(price * (0.95 + rand() * 0.06)).toFixed(2),
    sma200: +(price * (0.88 + rand() * 0.1)).toFixed(2),
    volume: Math.floor(1_000_000 + rand() * 9_000_000),
    pe: +(12 + rand() * 28).toFixed(1),
    high52: +(price * (1.08 + rand() * 0.15)).toFixed(2),
    low52: +(price * (0.7 + rand() * 0.15)).toFixed(2),
  };
}

export type NewsItem = { id: string; title: string; source: string; time: string; tag: string; symbols?: string[] };

export const NEWS: NewsItem[] = [
  { id: "1", title: "TCS posts strong Q4 with 8.4% YoY growth in deal pipeline", source: "Reuters", time: "2h ago", tag: "Earnings", symbols: ["TATAMOTORS.NS"] },
  { id: "2", title: "Fed signals patience on rate cuts as inflation cools", source: "Bloomberg", time: "3h ago", tag: "Macro" },
  { id: "3", title: "NVIDIA unveils next-gen Blackwell Ultra chips, stock jumps premarket", source: "CNBC", time: "5h ago", tag: "Tech", symbols: ["NVDA"] },
  { id: "4", title: "RBI keeps repo rate unchanged; banking sector reacts positively", source: "Mint", time: "6h ago", tag: "Banking", symbols: ["HDFCBANK.NS", "ICICIBANK.NS"] },
  { id: "5", title: "Reliance Jio crosses 480M subscribers, ARPU steady", source: "ET Markets", time: "8h ago", tag: "Telecom", symbols: ["RELIANCE.NS"] },
  { id: "6", title: "Tesla deliveries miss estimates as competition intensifies in China", source: "FT", time: "10h ago", tag: "Auto", symbols: ["TSLA"] },
  { id: "7", title: "Indian IT sector outlook upgraded by Morgan Stanley", source: "Bloomberg", time: "12h ago", tag: "Sector", symbols: ["INFY.NS", "WIPRO.NS", "TATAMOTORS.NS"] },
  { id: "8", title: "Gold hits fresh record as dollar weakens", source: "Reuters", time: "1d ago", tag: "Commodities" },
];

export function getNewsForSymbol(symbol: string) {
  return NEWS.filter(n => n.symbols?.includes(symbol)).concat(NEWS.filter(n => !n.symbols).slice(0, 2));
}

export type Holding = { symbol: string; name: string; qty: number; avgPrice: number; price: number };

export const INITIAL_HOLDINGS: Holding[] = [
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", qty: 12, avgPrice: 980, price: 1084.55 },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", qty: 25, avgPrice: 1580, price: 1672.40 },
  { symbol: "NVDA", name: "NVIDIA Corp.", qty: 18, avgPrice: 110.20, price: 138.42 },
  { symbol: "INFY.NS", name: "Infosys Ltd.", qty: 30, avgPrice: 1490, price: 1564.20 },
];

export function predictStock(symbol: string, price: number) {
  const rand = seeded(symbol.charCodeAt(0) * 7 + Math.floor(price));
  const h1 = price * (1 + (rand() - 0.4) * 0.01);
  const d1 = h1 * (1 + (rand() - 0.4) * 0.025);
  const d2 = d1 * (1 + (rand() - 0.45) * 0.03);
  const trend: "bullish" | "bearish" = d2 > price ? "bullish" : "bearish";
  const confidence = Math.floor(62 + rand() * 30);
  // Error margin grows with horizon; tighter when confidence is higher
  const confFactor = (100 - confidence) / 100;
  const errHour = +(h1 * 0.005 * (0.6 + confFactor)).toFixed(2);
  const errDay = +(d1 * 0.015 * (0.6 + confFactor)).toFixed(2);
  const errDayAfter = +(d2 * 0.025 * (0.6 + confFactor)).toFixed(2);
  const verdict =
    trend === "bullish"
      ? `Momentum favors ${symbol}. Models suggest a measured BUY with tight stop-loss near recent support.`
      : `Caution on ${symbol}. Short-term signals are weak — consider HOLD or a partial trim until trend confirms.`;
  return {
    nextHour: +h1.toFixed(2),
    nextHourErr: errHour,
    nextDay: +d1.toFixed(2),
    nextDayErr: errDay,
    dayAfter: +d2.toFixed(2),
    dayAfterErr: errDayAfter,
    trend,
    confidence,
    verdict,
  };
}
