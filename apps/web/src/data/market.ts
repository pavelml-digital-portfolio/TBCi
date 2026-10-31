import { coin, findIndex, exchanges } from "./demo";
export const ARCHIVE_START = "2018-01-01";
export const ARCHIVE_END = "2018-12-31";
export type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
export type Interval = "1H" | "4H" | "1D" | "1W";
export const profiles: Record<
  string,
  {
    description: string;
    risk: string;
    volatility: number;
    drift: number;
    color: string;
  }
> = {
  "tbci-10-stable": {
    description:
      "Ten established cryptocurrencies. Lower volatility and a larger allocation to liquid assets.",
    risk: "Moderate",
    volatility: 0.018,
    drift: -0.001,
    color: "#25a888",
  },
  "tbci-20-stable": {
    description:
      "A diversified core portfolio with twenty components and a focus on liquidity.",
    risk: "Moderate",
    volatility: 0.024,
    drift: -0.0018,
    color: "#218dff",
  },
  "tbci-20-balance": {
    description:
      "A balance of major networks and emerging protocols, rebalanced across twenty assets.",
    risk: "Elevated",
    volatility: 0.034,
    drift: -0.0025,
    color: "#378bdf",
  },
  "tbci-20-balance-2": {
    description:
      "An alternative balanced allocation with a different weighting of emerging networks.",
    risk: "Elevated",
    volatility: 0.028,
    drift: -0.0015,
    color: "#8b78cb",
  },
  "tbci-50-active": {
    description:
      "Broad exposure to fifty market constituents with larger swings and more growth-oriented assets.",
    risk: "High",
    volatility: 0.052,
    drift: -0.0034,
    color: "#ee9470",
  },
  "tbci-20-utility": {
    description:
      "Utility tokens for infrastructure, computation, storage and network services.",
    risk: "High",
    volatility: 0.043,
    drift: -0.0029,
    color: "#d2a04d",
  },
  "tbci-20-security": {
    description:
      "A thematic basket of tokenized securities and settlement infrastructure.",
    risk: "High",
    volatility: 0.037,
    drift: -0.002,
    color: "#b783ca",
  },
};
export function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function random(seed: number) {
  let n = seed;
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const cache = new Map<string, Bar[]>();
export function instrumentName(id: string) {
  const venue = exchanges.find((e) => "volume:" + e.slug === id);
  if (venue) return venue.name + " volume";
  return id === "portfolio"
    ? "Portfolio balance"
    : id.startsWith("tbci-")
      ? findIndex(id).name
      : coin(id).name + " · " + id;
}
export function seriesFor(id: string, interval: Interval = "1D"): Bar[] {
  const key = id + interval;
  if (cache.has(key)) return cache.get(key)!;
  const seed = hash(id);
  const rnd = random(seed);
  const profile = profiles[id];
  const volatility =
    profile?.volatility ??
    (id === "BTC"
      ? 0.029
      : id === "portfolio"
        ? 0.018
        : 0.025 + (seed % 20) / 1000);
  const drift = profile?.drift ?? -0.002;
  const venue = exchanges.find((e) => "volume:" + e.slug === id);
  const target = venue
    ? venue.volume
    : id === "portfolio"
      ? 55537
      : id.startsWith("tbci-")
        ? findIndex(id).points
        : coin(id).price;
  const daily: Bar[] = [];
  let close = 100;
  for (let d = 0; d < 365; d++) {
    const open = close;
    const cycle =
      Math.sin(d / (13 + (seed % 15))) * volatility * 0.35 +
      Math.cos(d / 37 + (seed % 9)) * volatility * 0.25;
    const shock =
      d > 300 && d < 326
        ? -0.009
        : d > 25 && d < 50
          ? -0.007
          : d > 90 && d < 115
            ? 0.007
            : 0;
    close = Math.max(
      0.1,
      open * Math.exp(drift + cycle + (rnd() - 0.49) * volatility * 3 + shock),
    );
    const wick = volatility * (0.15 + rnd() * 0.7);
    daily.push({
      time: Date.UTC(2018, 0, 1 + d) / 1000,
      open,
      close,
      high: Math.max(open, close) * (1 + wick),
      low: Math.min(open, close) * (1 - wick * 0.8),
      volume: Math.round(
        (200000 + (seed % 1000000)) *
          Math.max(0.15, 1 + Math.sin(d / 20) + rnd() * 0.8) *
          (1 + Math.abs(close / open - 1) * 12),
      ),
    });
  }
  const normalize = target / daily.at(-1)!.close;
  daily.forEach((b) => {
    for (const k of ["open", "high", "low", "close"] as const)
      b[k] = Number((b[k] * normalize).toFixed(8));
  });
  let bars: Bar[];
  if (interval === "1D") bars = daily;
  else if (interval === "1W") {
    bars = [];
    for (let i = 0; i < daily.length; i += 7) {
      const group = daily.slice(i, i + 7);
      bars.push({
        time: group[0].time,
        open: group[0].open,
        close: group.at(-1)!.close,
        high: Math.max(...group.map((b) => b.high)),
        low: Math.min(...group.map((b) => b.low)),
        volume: group.reduce((s, b) => s + b.volume, 0),
      });
    }
  } else {
    const count = interval === "1H" ? 24 : 6;
    bars = [];
    for (const day of daily) {
      let previous = day.open;
      for (let n = 0; n < count; n++) {
        const next =
          n === count - 1
            ? day.close
            : day.open +
              ((day.close - day.open) * (n + 1)) / count +
              Math.sin(((n + 1) / count) * Math.PI) *
                (rnd() - 0.5) *
                day.open *
                volatility;
        const wick = day.open * volatility * 0.1 * rnd();
        bars.push({
          time: day.time + (n * 86400) / count,
          open: previous,
          close: next,
          high: Math.max(previous, next) + wick,
          low: Math.max(0.00000001, Math.min(previous, next) - wick),
          volume: Math.round((day.volume / count) * (0.6 + rnd() * 0.8)),
        });
        previous = next;
      }
    }
  }
  cache.set(key, bars);
  return bars;
}
export function average(bars: Bar[], period: number, exponential = false) {
  let value = bars[0]?.close ?? 0;
  return bars.flatMap((b, i) => {
    value = exponential
      ? (b.close * 2) / (period + 1) + value * (1 - 2 / (period + 1))
      : bars
          .slice(Math.max(0, i - period + 1), i + 1)
          .reduce((s, p) => s + p.close, 0) / Math.min(i + 1, period);
    return i < period - 1 ? [] : [{ time: b.time, value }];
  });
}
export function rsi(bars: Bar[], period = 14) {
  const out: { time: number; value: number }[] = [];
  let gain = 0,
    loss = 0;
  for (let i = 1; i < bars.length; i++) {
    const change = bars[i].close - bars[i - 1].close;
    if (i <= period) {
      gain += Math.max(0, change) / period;
      loss += Math.max(0, -change) / period;
    } else {
      gain = (gain * (period - 1) + Math.max(0, change)) / period;
      loss = (loss * (period - 1) + Math.max(0, -change)) / period;
    }
    if (i >= period)
      out.push({
        time: bars[i].time,
        value: loss === 0 ? 100 : 100 - 100 / (1 + gain / loss),
      });
  }
  return out;
}
export function marketStats(id: string) {
  const bars = seriesFor(id);
  const first = bars[0].close,
    last = bars.at(-1)!.close;
  const returns = bars
    .slice(1)
    .map((b, i) => Math.log(b.close / bars[i].close));
  const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
  return {
    returnPct: (last / first - 1) * 100,
    high: Math.max(...bars.map((b) => b.high)),
    low: Math.min(...bars.map((b) => b.low)),
    volume: bars.at(-1)!.volume,
    volatility:
      Math.sqrt(
        returns.reduce((s, v) => s + (v - mean) ** 2, 0) / returns.length,
      ) *
      Math.sqrt(365) *
      100,
    last,
  };
}
