import { useRef, useState } from "react";
import { useDemo } from "./DemoContext";
import { allIndices } from "../data/portfolio";
import { assets, findIndex, coin, money, number } from "../data/demo";
import { purchaseError } from "../data/kyc";
import { Modal, CryptoIcon } from "./Primitives";
import UiIcon from "./UiIcon";
export type TradeIntent = { indexId: string; mode: "buy" | "sell" };
export default function IndexTrade({
  indexId: initialId,
  mode: initialMode,
  onClose,
}: {
  indexId: string;
  mode: "buy" | "sell";
  onClose: () => void;
}) {
  const { state, trade, notify } = useDemo();
  const [indexId, setIndexId] = useState(initialId),
    [mode, setMode] = useState(initialMode),
    [payment, setPayment] = useState("USD"),
    [amount, setAmount] = useState(initialMode === "buy" ? "10" : "1"),
    [step, setStep] = useState(0),
    [error, setError] = useState("");
  const requestId = useRef(crypto.randomUUID());
  const index = findIndex(indexId),
    held = state.tokenBalances[indexId] ?? 0,
    quantity = Number(amount),
    valid = Number.isFinite(quantity) && quantity > 0;
  const gross = valid ? quantity * index.price : 0,
    fee = gross * 0.005,
    total = gross * (mode === "buy" ? 1.005 : 0.995),
    equivalent = total / coin(payment).price;
  const review = () => {
    if (!valid) {
      setError("Enter a positive index amount.");
      return;
    }
    const invalid = purchaseError(state, mode, gross);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (mode === "sell" && quantity > held) {
      setError("Insufficient " + index.name + " balance.");
      return;
    }
    if (mode === "buy" && equivalent > state.balances[payment] + 1e-8) {
      setError(
        "Insufficient " + payment + " balance. Deposit funds in Wallet.",
      );
      return;
    }
    setError("");
    setStep(1);
  };
  return (
    <Modal
      title={
        step === 2
          ? "Index trade completed"
          : step === 1
            ? "Review " + mode
            : mode === "buy"
              ? "Buy index"
              : "Sell index"
      }
      onClose={onClose}
    >
      <div className="wallet-demo-banner">
        <UiIcon name="shield" />
        Local demo trade · fixed 31 Dec 2018 prices · no real payment
      </div>
      {step === 2 ? (
        <div className="index-trade-receipt">
          <span className="transfer-status-emblem completed">
            <UiIcon name="check" size={28} />
          </span>
          <h3>{mode === "buy" ? "Purchase completed" : "Sale completed"}</h3>
          <strong>{number(quantity, 8)} TBCi</strong>
          <p>{index.name}</p>
          <dl className="wallet-review">
            <dt>{mode === "buy" ? "Paid" : "Received"}</dt>
            <dd>
              {number(equivalent, 8)} {payment}
            </dd>
            <dt>Commission</dt>
            <dd>{money(fee, 3)} · 0.5%</dd>
            <dt>Index balance</dt>
            <dd>{number(state.tokenBalances[indexId] ?? 0, 8)} TBCi</dd>
            <dt>Operation reference</dt>
            <dd className="wallet-address">{requestId.current}</dd>
          </dl>
          <div className="modal-actions">
            <button className="button primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="trade-direction"
            role="group"
            aria-label="Trade direction"
          >
            <button
              aria-pressed={mode === "buy"}
              onClick={() => {
                setMode("buy");
                setError("");
                setStep(0);
              }}
            >
              Buy
            </button>
            <button
              aria-pressed={mode === "sell"}
              onClick={() => {
                setMode("sell");
                setError("");
                setStep(0);
              }}
            >
              Sell
            </button>
          </div>
          {step === 0 ? (
            <>
              <label className="trade-field" htmlFor="trade-index">
                Index
                <select
                  id="trade-index"
                  aria-label="Index"
                  value={indexId}
                  onChange={(e) => {
                    setIndexId(e.target.value);
                    setError("");
                  }}
                >
                  {allIndices.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} · {number(state.tokenBalances[i.id] ?? 0)} held
                    </option>
                  ))}
                </select>
              </label>
              <div className="trade-index-balance">
                <span>Available index balance</span>
                <strong>{number(held, 8)} TBCi</strong>
                <small>Unit price {money(index.price, 3)}</small>
              </div>
              <label className="trade-field" htmlFor="trade-payment">
                {mode === "buy" ? "Pay with" : "Receive in"}
                <select
                  id="trade-payment"
                  aria-label={mode === "buy" ? "Pay with" : "Receive in"}
                  value={payment}
                  onChange={(e) => {
                    setPayment(e.target.value);
                    setError("");
                  }}
                >
                  {assets
                    .filter((a) => a.symbol !== "TBCi")
                    .map((a) => (
                      <option key={a.symbol} value={a.symbol}>
                        {a.symbol} · {a.name} ·{" "}
                        {number(state.balances[a.symbol], 8)} available
                      </option>
                    ))}
                </select>
              </label>
              <label className="trade-field" htmlFor="trade-amount">
                Amount TBCi
                <div className="wallet-amount-input">
                  <input
                    id="trade-amount"
                    aria-label="Amount TBCi"
                    type="number"
                    min="0.00000001"
                    max="1000000"
                    step="any"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError("");
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const maximum =
                        mode === "sell"
                          ? held
                          : Math.min(
                              1e6,
                              (state.balances[payment] * coin(payment).price) /
                                (index.price * 1.005),
                            );
                      setAmount(String(Math.floor(maximum * 1e8) / 1e8));
                      setError("");
                    }}
                  >
                    MAX
                  </button>
                </div>
              </label>
              <div className="trade-currency-balance">
                <CryptoIcon symbol={payment} size={21} />
                <span>
                  {number(state.balances[payment], 8)} {payment} available
                </span>
                <a href={"/app/wallets/?asset=" + payment}>Deposit</a>
              </div>
            </>
          ) : (
            <p className="trade-review-title">
              <strong>{index.name}</strong>
              <span>{number(quantity, 8)} TBCi</span>
            </p>
          )}
          <dl className="wallet-review">
            <dt>Order value</dt>
            <dd>{money(gross, 3)}</dd>
            <dt>Commission · 0.5%</dt>
            <dd>{money(fee, 3)}</dd>
            <dt>{mode === "buy" ? "Total payment" : "You receive"}</dt>
            <dd>
              <strong>
                {number(equivalent, 8)} {payment}
              </strong>
              <small>{money(total, 3)} equivalent</small>
            </dd>
          </dl>
          {error && (
            <p className="error" role="alert">
              {error}
              {/Level|limit/.test(error) && (
                <>
                  {" "}
                  <a href="/app/settings/#verification">
                    Verification & limits
                  </a>
                </>
              )}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button"
              onClick={() => (step ? setStep(0) : onClose())}
            >
              {step ? "Back" : "Cancel"}
            </button>
            <button
              className="button primary"
              disabled={!valid}
              onClick={() => {
                if (step === 0) {
                  review();
                  return;
                }
                const failure = trade(
                  mode,
                  quantity,
                  payment,
                  indexId,
                  requestId.current,
                );
                if (failure) {
                  setError(failure);
                  return;
                }
                setStep(2);
                notify(
                  index.name +
                    " " +
                    (mode === "buy" ? "purchased" : "sold") +
                    ".",
                );
              }}
            >
              {step === 0 ? "Review " + mode : "Confirm " + mode}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
