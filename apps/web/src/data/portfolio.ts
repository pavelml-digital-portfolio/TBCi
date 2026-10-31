import {
  assets,
  basket,
  defaultIndex,
  indexChoices,
  coin,
  type DemoState,
} from "./demo";
import { seriesFor, profiles, type Interval, type Bar } from "./market";
export const allIndices = [defaultIndex, ...indexChoices];
export function indexBasket(id: string) {
  let components = basket.map((a) => ({ ...a }));
  if (id === "tbci-10-stable")
    components = components.sort((a, b) => b.weight - a.weight).slice(0, 10);
  else if (id === "tbci-50-active")
    components = components.map((a) => ({ ...a, weight: Math.sqrt(a.weight) }));
  else if (id === "tbci-20-utility")
    components = components.map((a) => ({
      ...a,
      weight:
        a.weight *
        ([
          "ETH",
          "IOTA",
          "ETC",
          "QTUM",
          "ZIL",
          "ADA",
          "NEO",
          "TRX",
          "LINK",
        ].includes(a.symbol)
          ? 3
          : 0.3),
    }));
  else if (id === "tbci-20-security")
    components = components.map((a) => ({
      ...a,
      weight:
        a.weight *
        (["ETH", "XLM", "XRP", "NEO", "LINK"].includes(a.symbol) ? 3 : 0.4),
    }));
  else if (id === "tbci-20-balance")
    components = components.map((a) => ({
      ...a,
      weight: Math.sqrt(a.weight) * 1.4,
    }));
  else if (id === "tbci-20-balance-2")
    components = components.map((a, i) => ({
      ...a,
      weight: Math.sqrt(a.weight) * (i % 2 ? 1.5 : 0.7),
    }));
  const total = components.reduce((s, a) => s + a.weight, 0);
  return components.map((a) => ({ ...a, weight: (a.weight / total) * 100 }));
}
export function ownedIndices(s: Pick<DemoState, "tokenBalances">) {
  return allIndices
    .map((i) => ({
      ...i,
      quantity: s.tokenBalances[i.id] ?? 0,
      value: (s.tokenBalances[i.id] ?? 0) * i.price,
      color: profiles[i.id]?.color ?? "#218dff",
    }))
    .filter((i) => i.quantity > 1e-8);
}
export type PortfolioPosition = {
  id: string;
  value: number;
  label?: string;
  color?: string;
  quantity?: number;
};
export function cashValue(s: Pick<DemoState, "balances">) {
  return assets
    .filter((a) => a.symbol !== "TBCi")
    .reduce((sum, a) => sum + (s.balances[a.symbol] ?? 0) * a.price, 0);
}
export function reservedBalance(
  s: Pick<DemoState, "transfers">,
  symbol: string,
) {
  return s.transfers
    .filter(
      (t) => t.kind === "withdraw" && t.status === "confirming" && t.applied,
    )
    .reduce(
      (sum, t) =>
        sum +
        (t.symbol === symbol ? t.amount : 0) +
        (t.feeAsset === symbol ? t.fee : 0),
      0,
    );
}
export function claimValue(s: Pick<DemoState, "redemption">) {
  return s.redemption
    ? Object.entries(s.redemption.remaining).reduce(
        (sum, [symbol, amount]) => sum + amount * coin(symbol).price,
        0,
      )
    : 0;
}
export function accountTotals(s: DemoState) {
  const indices = ownedIndices(s).reduce((sum, i) => sum + i.value, 0),
    available = cashValue(s),
    reserved = assets
      .filter((a) => a.symbol !== "TBCi")
      .reduce((sum, a) => sum + reservedBalance(s, a.symbol) * a.price, 0),
    claims = claimValue(s);
  return {
    indices,
    available,
    reserved,
    claims,
    total: indices + available + reserved + claims,
  };
}
export function underlyingExposure(positions: PortfolioPosition[]) {
  const result = new Map<
    string,
    {
      id: string;
      label: string;
      value: number;
      color: string;
      quantity: number;
    }
  >();
  for (const p of positions)
    for (const a of indexBasket(p.id)) {
      const value = (p.value * a.weight) / 100;
      const row = result.get(a.symbol) ?? {
        id: a.symbol,
        label: a.name,
        value: 0,
        color: a.color,
        quantity: 0,
      };
      row.value += value;
      row.quantity += value / a.price;
      result.set(a.symbol, row);
    }
  return [...result.values()]
    .filter((a) => a.value > 1e-8)
    .sort((a, b) => b.value - a.value);
}
/** Fixed current quantities revalued through simulated 2018 OHLC. Never personal PnL. */
export function portfolioSeries(
  positions: PortfolioPosition[],
  interval: Interval = "1D",
): Bar[] {
  if (!positions.length) return [];
  const data = positions.map((p) => ({
    value: p.value,
    rows: seriesFor(p.id, interval),
    last: seriesFor(p.id).at(-1)!.close,
  }));
  return data[0].rows.map((b, i) => {
    const fields = { open: 0, high: 0, low: 0, close: 0 };
    for (const p of data)
      for (const key of ["open", "high", "low", "close"] as const)
        fields[key] += (p.value * p.rows[i][key]) / p.last;
    return {
      time: b.time,
      ...fields,
      volume: data.reduce((sum, p) => sum + p.rows[i].volume, 0),
    };
  });
}
export function monthlyPerformance(rows: Bar[]) {
  return Array.from({ length: 12 }, (_, month) => {
    const group = rows.filter(
      (b) => new Date(b.time * 1000).getUTCMonth() === month,
    );
    const previous = rows
      .filter((b) => new Date(b.time * 1000).getUTCMonth() < month)
      .at(-1);
    const from = previous?.close ?? group[0]?.open ?? 0,
      to = group.at(-1)?.close ?? 0;
    return { month, from, to, change: from ? (to / from - 1) * 100 : 0 };
  });
}
export type Tile = {
  id: string;
  value: number;
  color: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
export function exposureTiles(
  items: { id: string; value: number; color: string; label: string }[],
  x = 0,
  y = 0,
  width = 600,
  height = 250,
): Tile[] {
  if (!items.length) return [];
  if (items.length === 1) return [{ ...items[0], x, y, width, height }];
  const total = items.reduce((s, a) => s + a.value, 0);
  let split = 1,
    sum = items[0].value;
  while (split < items.length - 1 && sum + items[split].value <= total / 2) {
    sum += items[split].value;
    split++;
  }
  const ratio = sum / (total || 1);
  return width >= height
    ? [
        ...exposureTiles(items.slice(0, split), x, y, width * ratio, height),
        ...exposureTiles(
          items.slice(split),
          x + width * ratio,
          y,
          width * (1 - ratio),
          height,
        ),
      ]
    : [
        ...exposureTiles(items.slice(0, split), x, y, width, height * ratio),
        ...exposureTiles(
          items.slice(split),
          x,
          y + height * ratio,
          width,
          height * (1 - ratio),
        ),
      ];
}

export function equivalentValue(usd: number, currency: string) {
  return currency === "BTC" || currency === "ETH"
    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(
        usd / coin(currency).price,
      ) +
        " " +
        currency
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(usd);
}
