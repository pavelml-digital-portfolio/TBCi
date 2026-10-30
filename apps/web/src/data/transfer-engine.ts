import { purchaseError } from "./kyc";
import { assets, coin, type DemoState, type Operation } from "./demo";
import {
  networksFor,
  sameAddress,
  validateAddress,
  type Transfer,
  type AuditEvent,
} from "./wallet";
export type TransferRequest = {
  requestId: string;
  kind: "deposit" | "withdraw";
  symbol: string;
  network: string;
  address: string;
  memo: string;
  amount: number;
  securityCode?: string;
};
const round = (n: number) => Math.round(n * 1e8) / 1e8;
export function auditEvent(
  category: AuditEvent["category"],
  action: string,
  details: string,
  now = Date.now(),
): AuditEvent {
  return {
    id: crypto.randomUUID(),
    date: new Date(now).toISOString(),
    category,
    action,
    details,
    origin: "local",
  };
}
export function validateTransfer(
  s: DemoState,
  r: TransferRequest,
  now = Date.now(),
): string | null {
  const asset = assets.find((a) => a.symbol === r.symbol),
    network = networksFor(r.symbol).find((n) => n.id === r.network);
  if (!asset || r.symbol === "TBCi" || !network)
    return "Choose a supported asset and network.";
  if (
    !Number.isFinite(r.amount) ||
    r.amount < network.minimum ||
    r.amount * asset.price > 1e9
  )
    return "Minimum amount: " + network.minimum + " " + r.symbol + ".";
  if (!validateAddress(network, r.address))
    return "Enter an address matching the selected test network.";
  if (r.memo.length > 128) return "The memo is too long.";
  if (r.kind === "withdraw") {
    const kycError = purchaseError(s, "withdraw");
    if (kycError) return kycError;
    if (s.security.withdrawalsLocked)
      return "Withdrawals are paused in Security settings.";
    if (
      s.security.whitelistOnly &&
      !s.trustedAddresses.some(
        (a) =>
          a.symbol === r.symbol &&
          a.network === r.network &&
          sameAddress(a.address, r.address) &&
          a.memo === r.memo,
      )
    )
      return "Only trusted addresses are allowed. Add this address in Settings → Whitelist.";
    const same = network.feeAsset === r.symbol;
    if (
      Math.round((s.balances[r.symbol] ?? 0) * 1e8) <
      Math.round((r.amount + (same ? network.fee : 0)) * 1e8)
    )
      return (
        "Insufficient " + r.symbol + " balance, including the network fee."
      );
    if (
      !same &&
      Math.round((s.balances[network.feeAsset] ?? 0) * 1e8) <
        Math.round(network.fee * 1e8)
    )
      return "Insufficient " + network.feeAsset + " for the network fee.";
    const used = s.transfers
      .filter(
        (t) =>
          t.origin === "local" &&
          t.kind === "withdraw" &&
          t.status !== "failed" &&
          Date.parse(t.createdAt) >= now - 86400000,
      )
      .reduce(
        (sum, t) =>
          sum +
          t.amount * coin(t.symbol).price +
          t.fee * coin(t.feeAsset).price,
        0,
      );
    if (
      used +
        r.amount * asset.price +
        network.fee * coin(network.feeAsset).price >
      s.security.dailyLimitUsd
    )
      return "This withdrawal exceeds your 24-hour USD limit.";
  }
  return null;
}
export function createTransfer(
  s: DemoState,
  r: TransferRequest,
  now = Date.now(),
): { state: DemoState; transfer?: Transfer; error?: string } {
  const exists = s.transfers.find((t) => t.requestId === r.requestId);
  if (exists) return { state: s, transfer: exists };
  const error = validateTransfer(s, r, now);
  if (error) return { state: s, error };
  const n = networksFor(r.symbol).find((n) => n.id === r.network)!;
  const b = { ...s.balances };
  if (r.kind === "withdraw") {
    b[r.symbol] = round(b[r.symbol] - r.amount);
    b[n.feeAsset] = round(b[n.feeAsset] - n.fee);
  }
  const t: Transfer = {
    id: crypto.randomUUID(),
    requestId: r.requestId,
    kind: r.kind,
    symbol: r.symbol,
    network: r.network,
    address: r.address,
    memo: r.memo,
    amount: round(r.amount),
    fee: r.kind === "withdraw" ? n.fee : 0,
    feeAsset: n.feeAsset,
    status: "confirming",
    confirmations: 0,
    requiredConfirmations: n.confirmations,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    txHash:
      "demo_" +
      crypto.randomUUID().replaceAll("-", "") +
      crypto.randomUUID().replaceAll("-", ""),
    applied: r.kind === "withdraw",
    origin: "local",
  };
  return {
    transfer: t,
    state: {
      ...s,
      balances: b,
      transfers: [t, ...s.transfers].slice(0, 500),
      audit: [
        auditEvent(
          "wallet",
          r.kind === "withdraw" ? "Withdrawal submitted" : "Deposit detected",
          r.amount + " " + r.symbol + " · " + n.name,
          now,
        ),
        ...s.audit,
      ].slice(0, 1000),
    },
  };
}
export function progressTransfers(s: DemoState, now = Date.now()): DemoState {
  let changed = false;
  const b = { ...s.balances },
    ops = [...s.operations],
    audit = [...s.audit];
  const transfers = s.transfers.map((t) => {
    if (t.status !== "confirming") return t;
    const confirmations = Math.min(
      t.requiredConfirmations,
      Math.max(0, Math.floor((now - Date.parse(t.createdAt)) / 1200)),
    );
    if (confirmations === t.confirmations) return t;
    changed = true;
    const done = confirmations === t.requiredConfirmations;
    if (done) {
      if (t.kind === "deposit" && !t.applied)
        b[t.symbol] = round(b[t.symbol] + t.amount);
      const op: Operation = {
        id: crypto.randomUUID(),
        type: t.kind,
        symbol: t.symbol,
        amount: t.amount,
        value: t.amount * coin(t.symbol).price,
        date: new Date(now).toISOString(),
        transferId: t.id,
        network: t.network,
        address: t.address,
        fee: t.fee,
        feeAsset: t.feeAsset,
      };
      ops.unshift(op);
      audit.unshift(
        auditEvent(
          "wallet",
          t.kind === "deposit" ? "Deposit confirmed" : "Withdrawal confirmed",
          t.amount + " " + t.symbol + " · " + t.id,
          now,
        ),
      );
    }
    return {
      ...t,
      confirmations,
      status: done ? ("completed" as const) : ("confirming" as const),
      applied: done ? true : t.applied,
      updatedAt: new Date(now).toISOString(),
    };
  });
  return changed
    ? {
        ...s,
        balances: b,
        transfers,
        operations: ops.slice(0, 500),
        audit: audit.slice(0, 1000),
      }
    : s;
}
export function failTransfer(
  s: DemoState,
  id: string,
  now = Date.now(),
): DemoState {
  const t = s.transfers.find((t) => t.id === id);
  if (!t || t.status !== "confirming") return s;
  const b = { ...s.balances };
  if (t.kind === "withdraw" && t.applied) {
    b[t.symbol] = round(b[t.symbol] + t.amount);
    b[t.feeAsset] = round(b[t.feeAsset] + t.fee);
  }
  return {
    ...s,
    balances: b,
    transfers: s.transfers.map((x) =>
      x.id === id
        ? {
            ...x,
            status: "failed",
            applied: false,
            failure: "Simulated network interruption. Reserved funds returned.",
            updatedAt: new Date(now).toISOString(),
          }
        : x,
    ),
    audit: [
      auditEvent(
        "wallet",
        "Transfer failed",
        t.symbol + " · " + id + " · reserved funds released",
        now,
      ),
      ...s.audit,
    ].slice(0, 1000),
  };
}
