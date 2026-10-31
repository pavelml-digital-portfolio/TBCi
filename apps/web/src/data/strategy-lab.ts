import { indexBasket } from "./portfolio";
import { seriesFor } from "./market";
export type LabOptions = {
  days: number;
  initial: number;
  fee: number;
  rebalance: number;
};
export const mean = (x: number[]) =>
  x.reduce((a, b) => a + b, 0) / (x.length || 1);
export function correlation(a: number[], b: number[]) {
  const ma = mean(a),
    mb = mean(b);
  const covariance = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0);
  const scale = Math.sqrt(
    a.reduce((s, v) => s + (v - ma) ** 2, 0) *
      b.reduce((s, v) => s + (v - mb) ** 2, 0),
  );
  return scale ? covariance / scale : 0;
}
/** Close-to-close basket accounting. Fees apply to entry, traded turnover and liquidation. */
export function backtest(id: string, options: LabOptions) {
  const days = Math.max(2, Math.min(365, Math.round(options.days)));
  const initial = Math.max(
    1,
    Math.min(1e9, Number.isFinite(options.initial) ? options.initial : 10000),
  );
  const fee =
    Math.max(0, Math.min(5, Number.isFinite(options.fee) ? options.fee : 0)) /
    100;
  const components = indexBasket(id),
    weights = components.map((a) => a.weight / 100);
  const histories = components.map((a) => seriesFor(a.symbol).slice(-days));
  const btc = seriesFor("BTC").slice(-days);
  let holdings = weights.map((w) => initial * (1 - fee) * w),
    fees = initial * fee,
    peak = initial;
  let btcPeak = initial;
  const log: { date: string; turnover: number; fee: number; value: number }[] =
    [];
  const points: {
    date: string;
    value: number;
    btc: number;
    drawdown: number;
    btcDrawdown: number;
  }[] = [];
  const assetReturns = histories.map((h) =>
    h.slice(1).map((b, i) => b.close / h[i].close - 1),
  );
  for (let d = 0; d < days; d++) {
    if (d) holdings = holdings.map((v, i) => v * (1 + assetReturns[i][d - 1]));
    let value = holdings.reduce((a, b) => a + b, 0);
    if (
      d > 0 &&
      d < days - 1 &&
      options.rebalance > 0 &&
      d % options.rebalance === 0
    ) {
      // Solve post-fee target value: traded notional includes both buys and sells.
      let net = value;
      for (let n = 0; n < 30; n++)
        net =
          value -
          fee *
            holdings.reduce((s, v, i) => s + Math.abs(v - net * weights[i]), 0);
      const cost = value - net,
        turnover = fee
          ? cost / fee
          : holdings.reduce(
              (s, v, i) => s + Math.abs(v - value * weights[i]),
              0,
            );
      fees += cost;
      holdings = weights.map((w) => net * w);
      value = net;
      log.push({
        date: new Date(btc[d].time * 1000).toISOString().slice(0, 10),
        turnover,
        fee: cost,
        value,
      });
    }
    if (d === days - 1) {
      fees += value * fee;
      value *= 1 - fee;
    }
    const benchmark =
      ((initial * (1 - fee) * btc[d].close) / btc[0].close) *
      (d === days - 1 ? 1 - fee : 1);
    peak = Math.max(peak, value);
    btcPeak = Math.max(btcPeak, benchmark);
    points.push({
      date: new Date(btc[d].time * 1000).toISOString().slice(0, 10),
      value,
      btc: benchmark,
      drawdown: (value / peak - 1) * 100,
      btcDrawdown: (benchmark / btcPeak - 1) * 100,
    });
  }
  const returns = points.slice(1).map((p, i) => p.value / points[i].value - 1),
    avg = mean(returns);
  const volatility =
    Math.sqrt(mean(returns.map((v) => (v - avg) ** 2)) * 365) * 100;
  const pairs = components.flatMap((a, i) =>
    components
      .slice(i + 1)
      .map((b, j) => ({
        a: a.symbol,
        b: b.symbol,
        value: correlation(assetReturns[i], assetReturns[i + j + 1]),
      })),
  );
  const hhi = weights.reduce((s, w) => s + w * w, 0);
  // Quoted daily volume converted to USD, compared to a 1% participation budget.
  const liquidity = components.map((a, i) => ({
    symbol: a.symbol,
    weight: a.weight,
    capacity:
      mean(histories[i].slice(-30).map((b) => b.volume * b.close)) * 0.01,
  }));
  return {
    initial,
    components,
    points,
    log,
    fees,
    volatility,
    pairs,
    hhi,
    effective: 1 / hhi,
    liquidity,
    final: points.at(-1)!.value,
    netReturn: (points.at(-1)!.value / initial - 1) * 100,
    maxDrawdown: Math.min(...points.map((p) => p.drawdown)),
    btcReturn: (points.at(-1)!.btc / initial - 1) * 100,
  };
}
export function stressLoss(
  components: { symbol: string; weight: number }[],
  shock: number,
  symbol = "all",
  initial = 10000,
) {
  return components
    .map((a) => ({
      symbol: a.symbol,
      loss:
        ((initial * a.weight) / 100) *
        (symbol === "all" || a.symbol === symbol
          ? Math.min(100, Math.max(0, shock)) / 100
          : 0),
    }))
    .sort((a, b) => b.loss - a.loss);
}
