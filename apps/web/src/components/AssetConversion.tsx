import { useRef, useState } from "react";
import { useDemo } from "./DemoContext";
import { assets, coin, money, number } from "../data/demo";
import { Modal } from "./Primitives";
import UiIcon from "./UiIcon";
export default function AssetConversion({
  initial = "USD",
  onClose,
}: {
  initial?: string;
  onClose: () => void;
}) {
  const { state, convertAssets } = useDemo();
  const [from, setFrom] = useState(initial),
    [to, setTo] = useState(initial === "BTC" ? "ETH" : "BTC"),
    [amount, setAmount] = useState(""),
    [step, setStep] = useState(0),
    [error, setError] = useState("");
  const id = useRef(crypto.randomUUID());
  const quantity = Number(amount),
    gross = Number.isFinite(quantity) ? quantity * coin(from).price : 0,
    received = Math.round(((gross * 0.995) / coin(to).price) * 1e8) / 1e8;
  const currencies = assets.filter((a) => a.symbol !== "TBCi");
  return (
    <Modal
      title={
        step === 2
          ? "Conversion completed"
          : step === 1
            ? "Review conversion"
            : "Convert wallet assets"
      }
      onClose={onClose}
    >
      <div className="wallet-demo-banner">
        <UiIcon name="refresh" />
        Internal demo conversion · fixed prices · 0.5% fee
      </div>
      {step === 2 ? (
        <>
          <div className="transfer-status-emblem completed">
            <UiIcon name="check" size={28} />
          </div>
          <p className="conversion-complete">
            {number(quantity, 8)} {from} → {number(received, 8)} {to}
          </p>
          <p className="settings-help">
            Both available balances and your activity log have been updated.
          </p>
          <div className="modal-actions">
            <button className="button primary" onClick={onClose}>
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          {step === 0 && (
            <>
              <div className="settings-field-grid">
                <label>
                  From
                  <select
                    aria-label="Convert from"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      if (e.target.value === to) setTo(from);
                      setError("");
                    }}
                  >
                    {currencies.map((a) => (
                      <option key={a.symbol}>{a.symbol}</option>
                    ))}
                  </select>
                </label>
                <label>
                  To
                  <select
                    aria-label="Convert to"
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setError("");
                    }}
                  >
                    {currencies
                      .filter((a) => a.symbol !== from)
                      .map((a) => (
                        <option key={a.symbol}>{a.symbol}</option>
                      ))}
                  </select>
                </label>
              </div>
              <label className="trade-field">
                Amount, {from}
                <div className="wallet-amount-input">
                  <input
                    aria-label="Conversion amount"
                    type="number"
                    min="0.00000001"
                    step="any"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError("");
                    }}
                  />
                  <button
                    onClick={() =>
                      setAmount(
                        String(Math.floor(state.balances[from] * 1e8) / 1e8),
                      )
                    }
                  >
                    MAX
                  </button>
                </div>
              </label>
              <p className="settings-help">
                Available {number(state.balances[from], 8)} {from}
              </p>
            </>
          )}
          <dl className="wallet-review">
            <dt>You send</dt>
            <dd>
              {number(quantity || 0, 8)} {from}
            </dd>
            <dt>Service fee · 0.5%</dt>
            <dd>{money(gross * 0.005, 3)}</dd>
            <dt>You receive</dt>
            <dd>
              {number(received, 8)} {to}
            </dd>
            <dt>Network fee</dt>
            <dd>None · internal demo conversion</dd>
          </dl>
          {error && (
            <p className="error" role="alert">
              {error}
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
              disabled={
                !Number.isFinite(quantity) || quantity <= 0 || received <= 0
              }
              onClick={() => {
                if (state.kyc.level === 1) {
                  setError(
                    "Level 1 allows Buy only. Complete Basic KYC to convert assets.",
                  );
                  return;
                }
                if (quantity > state.balances[from]) {
                  setError("Insufficient " + from + " balance.");
                  return;
                }
                if (step === 0) {
                  setStep(1);
                  setError("");
                  return;
                }
                const failure = convertAssets(from, to, quantity, id.current);
                if (failure) {
                  setError(failure);
                  return;
                }
                setStep(2);
              }}
            >
              {step === 0 ? "Review conversion" : "Confirm conversion"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
