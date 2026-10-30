import type { DemoState } from "./demo";
export type ClientLevel = 1 | 2 | 3;
export type ReviewOutcome = "approved" | "action_required" | "rejected";
export type KycApplication = {
  id: string;
  target: 2 | 3;
  status: "in_review" | ReviewOutcome;
  submittedAt: string;
  reviewAt: number;
  outcome: ReviewOutcome;
  reason: string;
  country: string;
  documentType: string;
  documentLast4: string;
  checks: string[];
};
export type KycState = {
  level: ClientLevel;
  purchaseTotalUsd?: number;
  verifiedAt: string | null;
  application: KycApplication | null;
  history: KycApplication[];
};
export const defaultKyc: KycState = {
  level: 2,
  purchaseTotalUsd: 0,
  verifiedAt: "2018-10-22T21:42:00Z",
  application: null,
  history: [],
};
export const levelNames = {
  1: "Starter",
  2: "Basic verified",
  3: "Fully verified",
};
export const levelLimits: Record<ClientLevel, number> = {
  1: 1000,
  2: 10000,
  3: Infinity,
};
/** Cumulative principal plus the 0.5% purchase fee; sells never replenish allowance. */
export function purchaseUsed(s: Pick<DemoState, "operations" | "kyc">) {
  return Math.max(
    s.kyc.purchaseTotalUsd ?? 0,
    s.operations
      .filter((o) => o.type === "buy" || o.type === "compile")
      .reduce((sum, o) => sum + o.value * 1.005, 0),
  );
}
export function purchaseError(
  s: DemoState,
  type: "buy" | "sell" | "compile" | "unmake" | "withdraw",
  value = 0,
) {
  if (s.kyc.level === 1 && type !== "buy")
    return "Level 1 allows Buy only. Complete Basic KYC to unlock this operation.";
  if (
    (type === "buy" || type === "compile") &&
    purchaseUsed(s) + value * 1.005 > levelLimits[s.kyc.level] + 1e-7
  )
    return (
      "Your Level " +
      s.kyc.level +
      " cumulative purchase limit is reached. Upgrade verification in Settings → Verification & limits."
    );
  return null;
}
export function progressKyc(kyc: KycState, now = Date.now()): KycState {
  const a = kyc.application;
  if (!a || a.status !== "in_review" || a.reviewAt > now) return kyc;
  const reviewed = { ...a, status: a.outcome };
  return {
    ...kyc,
    level: a.outcome === "approved" ? a.target : kyc.level,
    verifiedAt:
      a.outcome === "approved" ? new Date(now).toISOString() : kyc.verifiedAt,
    application: reviewed,
    history: [reviewed, ...kyc.history].slice(0, 30),
  };
}
