import { assets, findIndex, type DemoState, type Operation } from "./demo";
import { allIndices, indexBasket } from "./portfolio";
import { purchaseError, purchaseUsed } from "./kyc";
import { auditEvent } from "./transfer-engine";
const round = (v: number) => Math.round(Math.max(0, v) * 1e8) / 1e8;
export function executeIndexTrade(
  s: DemoState,
  type: "buy" | "sell" | "compile",
  amount: number,
  payment = "USD",
  indexId = s.selectedIndex,
  requestId?: string,
): { state: DemoState; error?: string } {
  if (requestId && s.operations.some((o) => o.requestId === requestId))
    return { state: s };
  if (!allIndices.some((i) => i.id === indexId))
    return { state: s, error: "Choose an available index." };
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1e6 ||
    round(amount) === 0
  )
    return { state: s, error: "Enter a valid token amount." };
  const amount8 = round(amount),
    index = findIndex(indexId),
    value = amount8 * index.price;
  const kycError = purchaseError(s, type, value);
  if (kycError) return { state: s, error: kycError };
  const b = { ...s.balances },
    tokens = { ...s.tokenBalances };
  let held = tokens[indexId] ?? 0;
  const asset = assets.find((a) => a.symbol === payment && a.symbol !== "TBCi");
  if (type === "buy" || type === "sell") {
    if (!asset) return { state: s, error: "Select a wallet currency." };
    if (type === "buy") {
      const cost = (value * 1.005) / asset.price;
      if (b[payment] + 1e-8 < cost)
        return {
          state: s,
          error:
            "Insufficient " +
            payment +
            " balance. Deposit funds before buying.",
        };
      b[payment] = round(b[payment] - cost);
      held = round(held + amount8);
    } else {
      if (amount8 > held)
        return { state: s, error: "Insufficient " + index.name + " balance." };
      held = round(held - amount8);
      b[payment] = round(b[payment] + (value * 0.995) / asset.price);
    }
  }
  if (type === "compile") {
    const components = indexBasket(indexId);
    const missing = components.find(
      (a) => b[a.symbol] + 1e-8 < ((value * a.weight) / 100 / a.price) * 1.005,
    );
    if (missing)
      return {
        state: s,
        error:
          "Insufficient " +
          missing.symbol +
          ". Deposit the missing components.",
      };
    for (const a of components)
      b[a.symbol] = round(
        b[a.symbol] - ((value * a.weight) / 100 / a.price) * 1.005,
      );
    held = round(held + amount8);
  }
  tokens[indexId] = held;
  b.TBCi = tokens[s.selectedIndex] ?? 0;
  const operation: Operation = {
    id: crypto.randomUUID(),
    requestId,
    indexId,
    type,
    symbol: "TBCi",
    amount: amount8,
    value,
    date: new Date().toISOString(),
    fee: value * 0.005,
    feeAsset: "USD",
    paymentSymbol: payment,
  };
  return {
    state: {
      ...s,
      balances: b,
      tokenBalances: tokens,
      kyc:
        type === "sell"
          ? s.kyc
          : { ...s.kyc, purchaseTotalUsd: purchaseUsed(s) + value * 1.005 },
      operations: [operation, ...s.operations].slice(0, 500),
      audit: [
        auditEvent(
          "trading",
          type + " completed",
          amount8 +
            " " +
            index.name +
            " · " +
            payment +
            " · fee " +
            (value * 0.005).toFixed(3) +
            " USD",
        ),
        ...s.audit,
      ].slice(0, 1000),
    },
  };
}

export function executeAssetConversion(
  s: DemoState,
  from: string,
  to: string,
  amount: number,
  requestId: string,
): { state: DemoState; error?: string } {
  if (s.operations.some((o) => o.requestId === requestId)) return { state: s };
  const source = assets.find((a) => a.symbol === from && a.symbol !== "TBCi"),
    destination = assets.find((a) => a.symbol === to && a.symbol !== "TBCi");
  if (!source || !destination || from === to)
    return { state: s, error: "Choose two different wallet assets." };
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount * source.price > 1e9 ||
    round(amount) <= 0
  )
    return { state: s, error: "Enter a valid conversion amount." };
  const kycError = purchaseError(s, "sell");
  if (kycError) return { state: s, error: kycError };
  const quantity = round(amount);
  if (Math.round(s.balances[from] * 1e8) < Math.round(quantity * 1e8))
    return { state: s, error: "Insufficient " + from + " balance." };
  const value = quantity * source.price,
    received = round((value * 0.995) / destination.price);
  if (received <= 0)
    return {
      state: s,
      error: "The converted amount is below the demo precision.",
    };
  const operation: Operation = {
    id: crypto.randomUUID(),
    requestId,
    type: "convert",
    symbol: from,
    amount: quantity,
    receivedSymbol: to,
    receivedAmount: received,
    value,
    fee: value * 0.005,
    feeAsset: "USD",
    date: new Date().toISOString(),
  };
  return {
    state: {
      ...s,
      balances: {
        ...s.balances,
        [from]: round(s.balances[from] - quantity),
        [to]: round(s.balances[to] + received),
      },
      operations: [operation, ...s.operations].slice(0, 500),
      audit: [
        auditEvent(
          "trading",
          "Wallet assets converted",
          quantity + " " + from + " → " + received + " " + to + " · 0.5% fee",
        ),
        ...s.audit,
      ].slice(0, 1000),
    },
  };
}
