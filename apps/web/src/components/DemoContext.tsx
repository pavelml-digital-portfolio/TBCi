import {
  createContext,
  useContext,
  useEffect,
  useState,
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
  notify: (message: string) => void;
  message: string;
  dismiss: () => void;
  selectIndex: (id: string) => void;
  fund: (symbol: string, amount: number, withdraw?: boolean) => string | null;
  trade: (
    type: "buy" | "sell" | "compile",
    amount: number,
    payment?: string,
  ) => string | null;
  redeem: (amount: number, symbol?: string) => string | null;
  setProfile: (name: string, email: string) => void;
  addWallet: (symbol: string) => void;
  reset: () => void;
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
      return { ...structuredClone(seed), ...raw };
  } catch {}
  return structuredClone(seed);
}
const round = (v: number) => Math.round(Math.max(0, v) * 1e8) / 1e8;
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initial);
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
  const save = (
    balances: Record<string, number>,
    type: Operation["type"],
    symbol: string,
    amount: number,
    value: number,
  ) =>
    setState((s) => ({
      ...s,
      balances,
      tokenBalances: { ...s.tokenBalances, [s.selectedIndex]: balances.TBCi },
      operations: [
        {
          id: crypto.randomUUID(),
          type,
          symbol,
          amount,
          value,
          date: new Date().toISOString(),
        },
        ...s.operations,
      ].slice(0, 500),
    }));
  const fund = (symbol: string, amount: number, withdraw = false) => {
    const a = assets.find((a) => a.symbol === symbol);
    if (!a || !Number.isFinite(amount) || amount <= 0 || amount * a.price > 1e9)
      return "Enter a valid amount.";
    if (withdraw && amount > state.balances[symbol])
      return "Insufficient available balance.";
    save(
      {
        ...state.balances,
        [symbol]: round(state.balances[symbol] + (withdraw ? -amount : amount)),
      },
      withdraw ? "withdraw" : "deposit",
      symbol,
      amount,
      amount * a.price,
    );
    return null;
  };
  const trade = (
    type: "buy" | "sell" | "compile",
    amount: number,
    payment = "USD",
  ) => {
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e6)
      return "Enter a valid token amount.";
    const b = { ...state.balances };
    const value = amount * findIndex(state.selectedIndex).price;
    const a = assets.find((a) => a.symbol === payment);
    if (type === "buy") {
      if (!a || a.symbol === "TBCi") return "Select a payment currency.";
      const cost = (value * 1.005) / a.price;
      if (b[payment] + 1e-8 < cost)
        return (
          "Insufficient " + payment + " balance. Deposit funds before buying."
        );
      b[payment] = round(b[payment] - cost);
      b.TBCi = round(b.TBCi + amount);
    }
    if (type === "sell") {
      if (!a || a.symbol === "TBCi") return "Select a receiving currency.";
      if (amount > b.TBCi) return "Insufficient TBCi balance.";
      b.TBCi = round(b.TBCi - amount);
      b[payment] = round(b[payment] + (value * 0.995) / a.price);
    }
    if (type === "compile") {
      const missing = basket.find(
        (a) =>
          b[a.symbol] + 1e-8 < ((value * a.weight) / 100 / a.price) * 1.005,
      );
      if (missing)
        return (
          "Insufficient " + missing.symbol + ". Deposit the missing components."
        );
      for (const a of basket)
        b[a.symbol] = round(
          b[a.symbol] - ((value * a.weight) / 100 / a.price) * 1.005,
        );
      b.TBCi = round(b.TBCi + amount);
    }

    save(b, type, "TBCi", amount, value);
    return null;
  };

  const redeem = (amount: number, symbol?: string) => {
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e6)
      return "Enter a valid token amount.";
    if (symbol && !basket.some((a) => a.symbol === symbol))
      return "Choose a basket component.";
    if (state.redemption && state.redemption.indexId !== state.selectedIndex)
      return "Withdraw the remaining components of the previous index first.";
    if (!state.redemption && amount > state.balances.TBCi)
      return "Insufficient TBCi balance.";
    const price = findIndex(state.selectedIndex).price;
    const created = !state.redemption;
    const b = { ...state.balances };
    const redemption = state.redemption
      ? structuredClone(state.redemption)
      : {
          indexId: state.selectedIndex,
          amount,
          remaining: Object.fromEntries(
            basket.map((a) => [
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
  return (
    <Context.Provider
      value={{
        state,
        message,
        notify,
        dismiss: () => notify(""),
        trade,
        fund,
        redeem,
        selectIndex: (id) =>
          setState((s) => ({
            ...s,
            selectedIndex: id,
            balances: { ...s.balances, TBCi: s.tokenBalances[id] ?? 0 },
          })),
        setProfile: (name, email) => setState((s) => ({ ...s, name, email })),
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
