import { useEffect, useRef, useState } from "react";
import { useDemo } from "./DemoContext";
import { Modal, CryptoIcon } from "./Primitives";
import QrCode from "./QrCode";
import UiIcon from "./UiIcon";
import { coin, money, number } from "../data/demo";
import {
  networksFor,
  mockAddress,
  qrPayload,
  totp,
  downloadData,
} from "../data/wallet";
import {
  validateTransfer,
  type TransferRequest,
} from "../data/transfer-engine";
export function DemoCode({ secret }: { secret: string }) {
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(30);
  useEffect(() => {
    let live = true;
    const update = () => {
      setSeconds(30 - (Math.floor(Date.now() / 1000) % 30));
      totp(secret).then((v) => {
        if (live) setCode(v);
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [secret]);
  return (
    <span className="demo-code">
      <strong>{code}</strong>
      <small>Authenticator · refreshes in {seconds}s</small>
    </span>
  );
}
export function TransferProgress({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) {
  const { state, failPendingTransfer } = useDemo();
  const t = state.transfers.find((t) => t.id === id);
  const [copied, setCopied] = useState(false);
  if (!t) return <p>Transfer not found.</p>;
  const network = networksFor(t.symbol).find((n) => n.id === t.network);
  const finished = t.status === "completed";
  return (
    <div className="transfer-progress">
      <div className={"transfer-status-emblem " + t.status}>
        <UiIcon
          name={
            finished ? "check" : t.status === "failed" ? "close" : "refresh"
          }
          size={28}
        />
      </div>
      <h3>
        {finished
          ? t.kind === "deposit"
            ? "Deposit received"
            : "Withdrawal completed"
          : t.status === "failed"
            ? "Transfer failed"
            : t.kind === "deposit"
              ? "Confirming deposit"
              : "Withdrawal in progress"}
      </h3>
      <p>
        {finished
          ? "The account balance and history have been updated."
          : t.status === "failed"
            ? t.failure
            : "Waiting for network confirmations. You can close this window and return to the history."}
      </p>
      <strong className="transfer-receipt-amount">
        {number(t.amount, 8)} {t.symbol}
      </strong>
      <ol className="transfer-confirmations" aria-label="Network confirmations">
        {Array.from({ length: t.requiredConfirmations }, (_, i) => (
          <li key={i} className={i < t.confirmations ? "done" : ""}>
            <UiIcon name={i < t.confirmations ? "check" : "refresh"} />
            <span>Confirmation {i + 1}</span>
          </li>
        ))}
      </ol>
      <p className="transfer-confirmation-count" role="status">
        {t.confirmations}/{t.requiredConfirmations} confirmations · {t.status}
      </p>
      <dl className="wallet-review">
        <dt>Network</dt>
        <dd>{network?.name ?? t.network}</dd>
        <dt>{t.kind === "deposit" ? "Deposit address" : "Recipient"}</dt>
        <dd className="wallet-address">{t.address}</dd>
        {t.memo && (
          <>
            <dt>Memo / tag</dt>
            <dd>{t.memo}</dd>
          </>
        )}
        <dt>Network fee</dt>
        <dd>
          {number(t.fee, 8)} {t.feeAsset}
        </dd>
        <dt>Created</dt>
        <dd>
          {new Date(t.createdAt).toLocaleString("en-GB", { timeZone: "UTC" })}{" "}
          UTC
        </dd>
        <dt>Transaction ID</dt>
        <dd className="wallet-address">{t.txHash}</dd>
      </dl>
      <div className="wallet-receipt-actions">
        <button
          className="button small"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(t.txHash);
              setCopied(true);
            } catch {}
          }}
        >
          <UiIcon name="copy" />
          {copied ? "Copied" : "Copy transaction ID"}
        </button>
        <button
          className="button small"
          onClick={() =>
            downloadData(
              "tbci-transfer-" + t.id + ".json",
              JSON.stringify(t, null, 2),
              "application/json",
            )
          }
        >
          <UiIcon name="download" />
          Receipt JSON
        </button>
      </div>
      {t.status === "confirming" && (
        <details className="wallet-simulation-controls">
          <summary>Transfer actions</summary>
          <button
            className="button danger small"
            onClick={() => failPendingTransfer(t.id)}
          >
            Cancel pending transfer
          </button>
        </details>
      )}
      <div className="modal-actions">
        <a className="button" href="/app/settings/#transfers">
          Transfer history
        </a>
        {onClose && (
          <button className="button primary" onClick={onClose}>
            {finished || t.status === "failed"
              ? "Done"
              : "Close and keep processing"}
          </button>
        )}
      </div>
    </div>
  );
}
export default function WalletTransfer({
  symbol,
  withdraw = false,
  onClose,
}: {
  symbol: string;
  withdraw?: boolean;
  onClose: () => void;
}) {
  const { state, beginTransfer } = useDemo();
  const kind = withdraw ? "withdraw" : "deposit";
  const networks = networksFor(symbol);
  const [networkId, setNetworkId] = useState(networks[0].id);
  const network = networks.find((n) => n.id === networkId)!;
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [ack, setAck] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [transferId, setTransferId] = useState("");
  const [copied, setCopied] = useState("");
  const requestId = useRef(crypto.randomUUID());
  const demoAddress = mockAddress(
    network,
    "tbci-wallet-" + state.email + "-" + symbol,
  );
  const depositMemo = network.memo
    ? String(
        parseInt(demoAddress.slice(-6).replace(/[^0-9]/g, ""), 10) || 183729,
      )
    : "";
  const destinations = state.trustedAddresses.filter(
    (a) => a.symbol === symbol && a.network === networkId,
  );
  const value = Number(amount);
  const request: TransferRequest = {
    requestId: requestId.current,
    kind,
    symbol,
    network: networkId,
    address: withdraw ? address.trim() : demoAddress,
    memo: withdraw ? memo.trim() : depositMemo,
    amount: value,
    securityCode: code,
  };
  const next = () => {
    setError("");
    if (step === 0) {
      setStep(1);
      return;
    }
    const invalid = validateTransfer(state, request);
    if (invalid) {
      setError(invalid);
      return;
    }
    setStep(2);
  };
  const submit = async () => {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const result = await beginTransfer(request);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTransferId(result.transfer!.id);
      setStep(3);
    } finally {
      setBusy(false);
    }
  };
  const copy = async (value: string, type: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
    } catch {
      setError("Clipboard unavailable. Select and copy the address.");
    }
  };
  const steps = withdraw
    ? ["Network", "Recipient & amount", "Review & verify", "Result"]
    : ["Network", "Deposit address", "Confirm amount", "Result"];
  return (
    <Modal
      title={(withdraw ? "Withdraw " : "Deposit ") + symbol}
      onClose={onClose}
    >
      <div className="wallet-demo-banner">
        <UiIcon name="shield" />
        <span>Selected network · review the address and minimum amount</span>
      </div>
      <ol className="wallet-stepper" aria-label="Transfer steps">
        {steps.map((s, i) => (
          <li
            key={s}
            className={i === step ? "active" : i < step ? "done" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i < step ? <UiIcon name="check" size={13} /> : i + 1}</span>
            <small>{s}</small>
          </li>
        ))}
      </ol>
      {step === 3 ? (
        <TransferProgress id={transferId} onClose={onClose} />
      ) : (
        <>
          <div className="wallet-transfer-asset">
            <CryptoIcon symbol={symbol} size={38} />
            <div>
              <strong>{coin(symbol).name}</strong>
              <small>
                {number(state.balances[symbol], 8)} {symbol} available
              </small>
            </div>
          </div>
          {step === 0 && (
            <section className="wallet-flow-step">
              <h3>Select the receiving network</h3>
              <p>
                The asset and network must match on both sides of the transfer.
              </p>
              <label htmlFor="transfer-network">Network</label>
              <select
                id="transfer-network"
                value={networkId}
                onChange={(e) => {
                  setNetworkId(e.target.value);
                  setAddress("");
                  setMemo("");
                  setError("");
                }}
              >
                {networks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
              <dl className="wallet-review">
                <dt>Minimum amount</dt>
                <dd>
                  {network.minimum} {symbol}
                </dd>
                <dt>Confirmations</dt>
                <dd>{network.confirmations}</dd>
                <dt>{withdraw ? "Network fee" : "Deposit fee"}</dt>
                <dd>
                  {withdraw ? network.fee : 0} {network.feeAsset}
                </dd>
              </dl>
              {withdraw && state.security.withdrawalsLocked && (
                <p role="alert" className="error">
                  Withdrawals are paused in Security settings.
                </p>
              )}
            </section>
          )}
          {step === 1 && !withdraw && (
            <section className="wallet-flow-step">
              <h3>Your deposit address</h3>
              <div className="wallet-deposit-code">
                <QrCode
                  value={qrPayload(symbol, networkId, demoAddress, depositMemo)}
                  label={symbol + " deposit QR code"}
                />
                <div>
                  <span className="wallet-network-badge">{network.name}</span>
                  <label>Deposit address</label>
                  <div className="wallet-copy-field">
                    <code>{demoAddress}</code>
                    <button
                      type="button"
                      aria-label="Copy deposit address"
                      onClick={() => copy(demoAddress, "address")}
                    >
                      <UiIcon name={copied === "address" ? "check" : "copy"} />
                    </button>
                  </div>
                  {network.memo && (
                    <>
                      <label>{network.memo}</label>
                      <div className="wallet-copy-field">
                        <code>{depositMemo}</code>
                        <button
                          aria-label="Copy memo"
                          onClick={() => copy(depositMemo, "memo")}
                        >
                          <UiIcon name={copied === "memo" ? "check" : "copy"} />
                        </button>
                      </div>
                    </>
                  )}
                  <small>
                    The QR includes the selected asset, network and destination.
                  </small>
                </div>
              </div>
              <label htmlFor="transfer-amount">Amount, {symbol}</label>
              <input
                id="transfer-amount"
                type="number"
                min={network.minimum}
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                placeholder={"Minimum " + network.minimum}
              />
              <p className="wallet-flow-note">
                Continue to review the deposit amount and confirmation progress.
              </p>
            </section>
          )}
          {step === 1 && withdraw && (
            <section className="wallet-flow-step">
              <h3>Recipient and amount</h3>
              <p className="wallet-network-badge">{network.name}</p>
              {destinations.length > 0 && (
                <>
                  <label htmlFor="trusted-destination">Saved address</label>
                  <select
                    id="trusted-destination"
                    defaultValue=""
                    onChange={(e) => {
                      const a = destinations.find(
                        (a) => a.id === e.target.value,
                      );
                      if (a) {
                        setAddress(a.address);
                        setMemo(a.memo);
                        setError("");
                      }
                    }}
                  >
                    <option value="">Choose a trusted address</option>
                    {destinations.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} · {a.address.slice(0, 14)}…
                      </option>
                    ))}
                  </select>
                </>
              )}
              <label htmlFor="withdraw-destination">Receiving address</label>
              <input
                id="withdraw-destination"
                autoComplete="off"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setError("");
                }}
                placeholder={
                  network.format === "evm" ? "0x…" : "Testnet address"
                }
              />
              <button
                type="button"
                className="wallet-text-button"
                onClick={() => {
                  setAddress(mockAddress(network, "recipient-" + symbol));
                  if (network.memo) setMemo("182739");
                  setError("");
                }}
              >
                Fill recipient
              </button>
              {network.memo && (
                <>
                  <label htmlFor="withdraw-memo">
                    {network.memo} (optional)
                  </label>
                  <input
                    id="withdraw-memo"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </>
              )}
              <label htmlFor="transfer-amount">Amount, {symbol}</label>
              <div className="wallet-amount-input">
                <input
                  id="transfer-amount"
                  type="number"
                  min={network.minimum}
                  step="any"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError("");
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setAmount(
                      String(
                        Math.max(
                          0,
                          Math.floor(
                            ((state.balances[symbol] ?? 0) -
                              (network.feeAsset === symbol ? network.fee : 0) +
                              1e-12) *
                              1e8,
                          ) / 1e8,
                        ),
                      ),
                    )
                  }
                >
                  MAX
                </button>
              </div>
              <dl className="wallet-review">
                <dt>Network fee</dt>
                <dd>
                  {network.fee} {network.feeAsset}
                </dd>
                <dt>You receive</dt>
                <dd>
                  {number(Number.isFinite(value) ? value : 0, 8)} {symbol}
                </dd>
              </dl>
              {state.security.whitelistOnly && (
                <p className="wallet-flow-note">
                  Trusted addresses only.{" "}
                  <a href="/app/settings/#whitelist">Manage whitelist →</a>
                </p>
              )}
            </section>
          )}
          {step === 2 && (
            <section className="wallet-flow-step">
              <h3>
                {withdraw ? "Review withdrawal" : "Review incoming deposit"}
              </h3>
              <dl className="wallet-review">
                <dt>Amount</dt>
                <dd>
                  {number(value, 8)} {symbol}
                </dd>
                <dt>Network</dt>
                <dd>{network.name}</dd>
                <dt>{withdraw ? "Recipient" : "Deposit address"}</dt>
                <dd className="wallet-address">{request.address}</dd>
                {request.memo && (
                  <>
                    <dt>Memo / tag</dt>
                    <dd>{request.memo}</dd>
                  </>
                )}
                <dt>Network fee</dt>
                <dd>
                  {withdraw ? network.fee : 0} {network.feeAsset}
                </dd>
                <dt>Total debit</dt>
                <dd>
                  {withdraw
                    ? number(
                        value + (network.feeAsset === symbol ? network.fee : 0),
                        8,
                      ) +
                      " " +
                      symbol +
                      (network.feeAsset !== symbol
                        ? " + " + network.fee + " " + network.feeAsset
                        : "")
                    : "No debit; incoming " + symbol}
                </dd>
                <dt>USD equivalent</dt>
                <dd>{money(value * coin(symbol).price)}</dd>
              </dl>
              {withdraw && (
                <>
                  <label className="wallet-checkbox">
                    <input
                      type="checkbox"
                      checked={ack}
                      onChange={(e) => setAck(e.target.checked)}
                    />
                    <span>I checked the address and selected network.</span>
                  </label>
                  {state.security.twoFactorEnabled && (
                    <div className="wallet-security-check">
                      <label htmlFor="withdraw-security">
                        Authenticator or recovery code
                      </label>
                      <input
                        id="withdraw-security"
                        autoComplete="off"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          setError("");
                        }}
                        placeholder="6 digits or recovery code"
                      />
                      <button
                        className="wallet-text-button"
                        onClick={() => setShowCode(!showCode)}
                      >
                        Show verification code
                      </button>
                      {showCode && (
                        <DemoCode secret={state.security.totpSecret} />
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="button"
              onClick={() => (step ? setStep(step - 1) : onClose())}
              disabled={busy}
            >
              {step ? "Back" : "Cancel"}
            </button>
            {step < 2 ? (
              <button
                className="button primary"
                onClick={next}
                disabled={
                  step === 0 && withdraw && state.security.withdrawalsLocked
                }
              >
                Continue
              </button>
            ) : (
              <button
                className="button primary"
                disabled={busy || (withdraw && !ack)}
                onClick={submit}
              >
                {busy
                  ? "Processing…"
                  : withdraw
                    ? "Confirm withdrawal"
                    : "Confirm deposit"}
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
