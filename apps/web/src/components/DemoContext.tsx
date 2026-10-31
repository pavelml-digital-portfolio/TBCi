import {
  executeIndexTrade,
  executeAssetConversion,
} from "../data/index-trading";
import { indexBasket, allIndices } from "../data/portfolio";
import {
  defaultKyc,
  purchaseError,
  progressKyc,
  type KycApplication,
  type ClientLevel,
} from "../data/kyc";
import {
  createTransfer,
  validateTransfer,
  progressTransfers,
  failTransfer,
  auditEvent,
  type TransferRequest,
} from "../data/transfer-engine";
import {
  defaultSecurity,
  defaultPreferences,
  defaultSessions,
  sampleTransfers,
  sampleAudit,
  verifyTotp,
  hashCode,
  networksFor,
  validateAddress,
  sameAddress,
  type Transfer,
  type TrustedAddress,
  type DemoSecurity,
  type Preferences,
  type AuditEvent,
} from "../data/wallet";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import {
  assets,
  basket,
  seed,
  findIndex,
  type DemoState,
  type Operation,
} from "../data/demo";
const KEY = "tbci-reference-demo-v2";
type ContextValue = {
  state: DemoState;
  convertAssets: (
    from: string,
    to: string,
    amount: number,
    requestId: string,
  ) => string | null;
  submitKyc: (
    a: Omit<KycApplication, "id" | "status" | "submittedAt" | "reviewAt">,
  ) => string | null;
  cancelKyc: () => void;
  setDemoLevel: (level: ClientLevel) => void;
  notify: (message: string) => void;
  message: string;
  dismiss: () => void;
  selectIndex: (id: string) => void;
  trade: (
    type: "buy" | "sell" | "compile",
    amount: number,
    payment?: string,
    indexId?: string,
    requestId?: string,
  ) => string | null;
  redeem: (amount: number, symbol?: string) => string | null;
  setProfile: (name: string, email: string) => void;
  addWallet: (symbol: string) => void;
  reset: () => void;
  beginTransfer: (
    r: TransferRequest,
  ) => Promise<{ transfer?: Transfer; error?: string }>;
  failPendingTransfer: (id: string) => void;
  setPreferences: (value: Partial<Preferences>) => void;
  updateSecurity: (
    value: Partial<DemoSecurity>,
    code?: string,
  ) => Promise<string | null>;
  addTrusted: (
    value: Omit<TrustedAddress, "id" | "createdAt">,
  ) => string | null;
  removeTrusted: (id: string) => void;
  revokeSession: (id: string) => void;
  log: (
    category: AuditEvent["category"],
    action: string,
    details: string,
  ) => void;
};
const Context = createContext<ContextValue | null>(null);
function initial(): DemoState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (
      raw &&
      typeof raw.name === "string" &&
      assets.every(
        (a) =>
          Number.isFinite(raw.balances?.[a.symbol]) &&
          raw.balances[a.symbol] >= 0,
      ) &&
      Array.isArray(raw.operations)
    )
      return {
        ...structuredClone(seed),
        ...raw,
        tokenBalances: Object.fromEntries(
          allIndices.map((i) => [
            i.id,
            Number.isFinite(raw.tokenBalances?.[i.id])
              ? Math.max(0, raw.tokenBalances[i.id])
              : i.id === raw.selectedIndex
                ? raw.balances.TBCi
                : 0,
          ]),
        ),
        kyc: { ...structuredClone(defaultKyc), ...raw.kyc },
        security: { ...defaultSecurity, ...raw.security },
        preferences: {
          ...defaultPreferences,
          ...raw.preferences,
          notifications: {
            ...defaultPreferences.notifications,
            ...raw.preferences?.notifications,
          },
        },
        transfers: Array.isArray(raw.transfers)
          ? raw.transfers
          : sampleTransfers(),
        audit: Array.isArray(raw.audit) ? raw.audit : sampleAudit(),
        trustedAddresses: Array.isArray(raw.trustedAddresses)
          ? raw.trustedAddresses
          : [],
        sessions: Array.isArray(raw.sessions)
          ? raw.sessions
          : structuredClone(defaultSessions),
      };
  } catch {}
  return structuredClone(seed);
}
const round = (v: number) => Math.round(Math.max(0, v) * 1e8) / 1e8;
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, reactSetState] = useState<DemoState>(initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const setState = (value: DemoState | ((s: DemoState) => DemoState)) => {
    const next = typeof value === "function" ? value(stateRef.current) : value;
    if (next !== stateRef.current) {
      stateRef.current = next;
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      reactSetState(next);
    }
  };
  useEffect(() => {
    setState((s) => {
      let next = progressTransfers(s);
      const kyc = progressKyc(next.kyc);
      if (kyc !== next.kyc)
        next = {
          ...next,
          kyc,
          audit: [
            auditEvent(
              "verification",
              "KYC review: " + kyc.application!.status,
              "Level " +
                kyc.application!.target +
                " · " +
                kyc.application!.reason,
            ),
            ...next.audit,
          ].slice(0, 1000),
        };
      return next;
    });
    const timer = setInterval(
      () =>
        setState((s) => {
          let next = progressTransfers(s);
          const kyc = progressKyc(next.kyc);
          if (kyc !== next.kyc)
            next = {
              ...next,
              kyc,
              audit: [
                auditEvent(
                  "verification",
                  "KYC review: " + kyc.application!.status,
                  "Level " +
                    kyc.application!.target +
                    " · " +
                    kyc.application!.reason,
                ),
                ...next.audit,
              ].slice(0, 1000),
            };
          return next;
        }),
      400,
    );
    return () => clearInterval(timer);
  }, []);
  const [message, notify] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => notify(""), 6000);
    return () => clearTimeout(timer);
  }, [message]);
  const trade = (
    type: "buy" | "sell" | "compile",
    amount: number,
    payment = "USD",
    indexId = stateRef.current.selectedIndex,
    requestId?: string,
  ) => {
    const result = executeIndexTrade(
      stateRef.current,
      type,
      amount,
      payment,
      indexId,
      requestId,
    );
    if (result.error) return result.error;
    setState(result.state);
    return null;
  };
  const redeem = (amount: number, symbol?: string) => {
    const kycError = purchaseError(stateRef.current, "unmake");
    if (kycError) return kycError;
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e6)
      return "Enter a valid token amount.";
    if (symbol && !basket.some((a) => a.symbol === symbol))
      return "Choose a basket component.";
    if (state.redemption && state.redemption.indexId !== state.selectedIndex)
      return "Withdraw the remaining components of the previous index first.";
    if (!state.redemption && amount > state.balances.TBCi)
      return "Insufficient TBCi balance.";
    const price = findIndex(state.selectedIndex).price;
    const components = indexBasket(state.selectedIndex);
    const created = !state.redemption;
    const b = { ...state.balances };
    const redemption = state.redemption
      ? structuredClone(state.redemption)
      : {
          indexId: state.selectedIndex,
          amount,
          remaining: Object.fromEntries(
            components.map((a) => [
              a.symbol,
              round(((amount * price * a.weight) / 100 / a.price) * 0.995),
            ]),
          ),
        };
    if (created) b.TBCi = round(b.TBCi - amount);
    let credited = 0;
    for (const a of basket) {
      if (symbol && a.symbol !== symbol) continue;
      const value = redemption.remaining[a.symbol] ?? 0;
      b[a.symbol] = round(b[a.symbol] + value);
      credited += value * a.price;
      redemption.remaining[a.symbol] = 0;
    }
    if (credited <= 0) return "This component has already been withdrawn.";
    const operation: Operation = {
      id: crypto.randomUUID(),
      type: created ? "unmake" : "claim",
      symbol: symbol ?? "TBCi",
      amount: created
        ? amount
        : credited /
          (symbol ? assets.find((a) => a.symbol === symbol)!.price : 1),
      value: credited,
      date: new Date().toISOString(),
      indexId: state.selectedIndex,
    };
    setState((s) => ({
      ...s,
      balances: b,
      tokenBalances: { ...s.tokenBalances, [s.selectedIndex]: b.TBCi },
      redemption: Object.values(redemption.remaining).some((v) => v > 0)
        ? redemption
        : null,
      operations: [operation, ...s.operations].slice(0, 500),
    }));
    return null;
  };
  const log = (
    category: AuditEvent["category"],
    action: string,
    details: string,
  ) =>
    setState((s) => ({
      ...s,
      audit: [auditEvent(category, action, details), ...s.audit].slice(0, 1000),
    }));
  const verify = async (code: string, security = stateRef.current.security) => {
    if (await verifyTotp(security.totpSecret, code))
      return { valid: true, recovery: "" };
    const hash = await hashCode(code);
    return { valid: security.recoveryHashes.includes(hash), recovery: hash };
  };
  const beginTransfer = async (r: TransferRequest) => {
    const existing = stateRef.current.transfers.find(
      (t) => t.requestId === r.requestId,
    );
    if (existing) return { transfer: existing };
    const invalid = validateTransfer(stateRef.current, r);
    if (invalid) return { error: invalid };
    let recovery = "";
    if (r.kind === "withdraw" && stateRef.current.security.twoFactorEnabled) {
      const checked = await verify(r.securityCode ?? "");
      if (!checked.valid) {
        log(
          "security",
          "Withdrawal verification failed",
          "Invalid authenticator/recovery code",
        );
        return {
          error: "Enter a valid authenticator code or an unused recovery code.",
        };
      }
      recovery = checked.recovery;
    }
    const accepted = stateRef.current.transfers.find(
      (t) => t.requestId === r.requestId,
    );
    if (accepted) return { transfer: accepted };
    if (
      recovery &&
      !stateRef.current.security.recoveryHashes.includes(recovery)
    )
      return { error: "This recovery code has already been used." };
    const result = createTransfer(stateRef.current, r);
    if (result.error) return { error: result.error };
    if (recovery)
      result.state = {
        ...result.state,
        security: {
          ...result.state.security,
          recoveryHashes: result.state.security.recoveryHashes.filter(
            (h) => h !== recovery,
          ),
        },
      };
    setState(result.state);
    return { transfer: result.transfer };
  };
  const updateSecurity = async (value: Partial<DemoSecurity>, code = "") => {
    const current = stateRef.current.security;
    if (
      current.twoFactorEnabled &&
      (value.twoFactorEnabled === false || value.recoveryHashes)
    ) {
      const checked = await verify(code);
      if (!checked.valid)
        return "Enter a valid authenticator or recovery code.";
    }
    if (value.twoFactorEnabled && !current.twoFactorEnabled) {
      if (!value.totpSecret || !(await verifyTotp(value.totpSecret, code)))
        return "The 6-digit authenticator code is not valid.";
    }
    if (
      value.dailyLimitUsd !== undefined &&
      (!Number.isFinite(value.dailyLimitUsd) || value.dailyLimitUsd <= 0)
    )
      return "Enter a positive daily limit.";
    setState((s) => ({
      ...s,
      security: { ...s.security, ...value },
      audit: [
        auditEvent(
          "security",
          "Security settings updated",
          Object.keys(value)
            .filter((k) => !["totpSecret", "recoveryHashes"].includes(k))
            .join(", ") || "Recovery material replaced",
        ),
        ...s.audit,
      ].slice(0, 1000),
    }));
    return null;
  };
  const addTrusted = (value: Omit<TrustedAddress, "id" | "createdAt">) => {
    const n = networksFor(value.symbol).find((n) => n.id === value.network);
    if (!n || !validateAddress(n, value.address))
      return "The address does not match this test network.";
    if (!value.label.trim()) return "Enter an address label.";
    if (
      stateRef.current.trustedAddresses.some(
        (a) =>
          a.network === value.network &&
          a.symbol === value.symbol &&
          sameAddress(a.address, value.address) &&
          a.memo === value.memo,
      )
    )
      return "This address is already in your whitelist.";
    const address = {
      ...value,
      label: value.label.trim(),
      address: value.address.trim(),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      trustedAddresses: [address, ...s.trustedAddresses],
      audit: [
        auditEvent(
          "security",
          "Trusted address added",
          address.label + " · " + address.symbol + " · " + address.network,
        ),
        ...s.audit,
      ].slice(0, 1000),
    }));
    return null;
  };
  return (
    <Context.Provider
      value={{
        state,
        submitKyc: (a) => {
          const current = stateRef.current.kyc;
          if (current.application?.status === "in_review")
            return "A verification is already under review.";
          if (a.target <= current.level)
            return "Choose the next verification level.";
          const application: KycApplication = {
            ...a,
            id: crypto.randomUUID(),
            status: "in_review",
            submittedAt: new Date().toISOString(),
            reviewAt: Date.now() + 8000,
          };
          setState((s) => ({
            ...s,
            kyc: { ...s.kyc, application },
            audit: [
              auditEvent(
                "verification",
                "KYC submitted",
                "Level " +
                  a.target +
                  " · " +
                  a.documentType +
                  " · metadata only",
              ),
              ...s.audit,
            ].slice(0, 1000),
          }));
          return null;
        },
        cancelKyc: () =>
          setState((s) => ({
            ...s,
            kyc: { ...s.kyc, application: null },
            audit: [
              auditEvent(
                "verification",
                "KYC draft/review cancelled",
                "Existing verified level retained",
              ),
              ...s.audit,
            ].slice(0, 1000),
          })),
        setDemoLevel: (level) =>
          setState((s) => ({
            ...s,
            kyc: {
              ...s.kyc,
              level,
              application: null,
              verifiedAt: level === 1 ? null : new Date().toISOString(),
            },
            audit: [
              auditEvent(
                "verification",
                "client level changed",
                "Level " + level + " · purchase usage retained",
              ),
              ...s.audit,
            ].slice(0, 1000),
          })),
        beginTransfer,
        failPendingTransfer: (id) => setState((s) => failTransfer(s, id)),
        log,
        updateSecurity,
        addTrusted,
        setPreferences: (value) =>
          setState((s) => ({
            ...s,
            preferences: { ...s.preferences, ...value },
            audit: [
              auditEvent(
                "preferences",
                "Preferences updated",
                Object.keys(value).join(", "),
              ),
              ...s.audit,
            ].slice(0, 1000),
          })),
        removeTrusted: (id) =>
          setState((s) => ({
            ...s,
            trustedAddresses: s.trustedAddresses.filter((a) => a.id !== id),
            audit: [
              auditEvent(
                "security",
                "Trusted address removed",
                s.trustedAddresses.find((a) => a.id === id)?.label ?? id,
              ),
              ...s.audit,
            ].slice(0, 1000),
          })),
        revokeSession: (id) =>
          setState((s) => ({
            ...s,
            sessions: s.sessions.map((x) =>
              x.id === id && !x.current ? { ...x, revoked: true } : x,
            ),
            audit: [
              auditEvent("session", "Example session revoked", id),
              ...s.audit,
            ].slice(0, 1000),
          })),
        message,
        notify,
        dismiss: () => notify(""),
        trade,
        convertAssets: (from, to, amount, requestId) => {
          const result = executeAssetConversion(
            stateRef.current,
            from,
            to,
            amount,
            requestId,
          );
          if (result.error) return result.error;
          setState(result.state);
          return null;
        },
        redeem,
        selectIndex: (id) =>
          allIndices.some((i) => i.id === id) &&
          setState((s) => ({
            ...s,
            selectedIndex: id,
            balances: { ...s.balances, TBCi: s.tokenBalances[id] ?? 0 },
          })),
        setProfile: (name, email) =>
          setState((s) => ({
            ...s,
            name,
            email,
            audit: [
              auditEvent(
                "profile",
                "Profile updated",
                "Display name and contact details changed locally",
              ),
              ...s.audit,
            ].slice(0, 1000),
          })),
        addWallet: (symbol) =>
          setState((s) => ({
            ...s,
            addedWallets: [...new Set([...s.addedWallets, symbol])],
          })),
        reset: () => setState(structuredClone(seed)),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const c = useContext(Context);
  if (!c) throw new Error("DemoProvider is required");
  return c;
}
