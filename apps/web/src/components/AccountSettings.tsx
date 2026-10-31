import Verification from "./Verification";
import { useEffect, useState } from "react";
import { useDemo } from "./DemoContext";
import { Modal, CryptoIcon } from "./Primitives";
import { DemoCode, TransferProgress } from "./WalletTransfer";
import QrCode from "./QrCode";
import UiIcon from "./UiIcon";
import { assets, number } from "../data/demo";
import {
  createSecret,
  createRecoveryCodes,
  hashCode,
  networksFor,
  mockAddress,
  downloadData,
  type TrustedAddress,
  type AuditEvent,
} from "../data/wallet";
const tabs = [
  ["profile", "Profile"],
  ["verification", "Verification & limits"],
  ["preferences", "Preferences"],
  ["security", "Security & 2FA"],
  ["whitelist", "Address whitelist"],
  ["transfers", "Deposits / Withdrawals"],
  ["activity", "Activity log"],
  ["devices", "Devices & sessions"],
];
function Toggle({
  label,
  detail,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="settings-toggle">
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </label>
  );
}
function ExportButton({
  rows,
  name,
  label = "Export CSV",
}: {
  rows: Record<string, unknown>[];
  name: string;
  label?: string;
}) {
  return (
    <button
      className="button small"
      onClick={() => {
        const keys = Object.keys(rows[0] ?? { id: "" });
        const quote = (v: unknown) =>
          '"' + String(v ?? "").replaceAll('"', '""') + '"';
        downloadData(
          name,
          keys.map(quote).join(",") +
            "\n" +
            rows.map((r) => keys.map((k) => quote(r[k])).join(",")).join("\n"),
          "text/csv",
        );
      }}
    >
      <UiIcon name="download" />
      {label}
    </button>
  );
}
function Profile() {
  const { state, setProfile, reset, notify } = useDemo();
  const [name, setName] = useState(state.name);
  const [email, setEmail] = useState(state.email);
  const [confirm, setConfirm] = useState(false);
  const [word, setWord] = useState("");
  return (
    <>
      <section className="settings-card">
        <h2>Profile details</h2>
        <p>
          Your local demonstration profile. Login and Register still open the
          account directly.
        </p>
        <form
          className="settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            setProfile(name.trim(), email.trim());
            notify("Profile saved in this browser.");
          }}
        >
          <label htmlFor="profile-name">Name</label>
          <input
            id="profile-name"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="button primary">Save changes</button>
        </form>
      </section>
      <section className="settings-card">
        <h2>Local data</h2>
        <p>
          Export a snapshot of balances, operations, public demo addresses and
          preferences. Authenticator secrets and recovery hashes are excluded.
        </p>
        <button
          className="button"
          onClick={() => {
            const { security, ...safe } = state;
            downloadData(
              "tbci-local-demo.json",
              JSON.stringify(
                {
                  ...safe,
                  security: {
                    twoFactorEnabled: security.twoFactorEnabled,
                    whitelistOnly: security.whitelistOnly,
                    withdrawalsLocked: security.withdrawalsLocked,
                    dailyLimitUsd: security.dailyLimitUsd,
                    recoveryCodesRemaining: security.recoveryHashes.length,
                  },
                },
                null,
                2,
              ),
              "application/json",
            );
          }}
        >
          <UiIcon name="download" />
          Export local data
        </button>
      </section>
      <section className="settings-card settings-danger">
        <h2>Reset demonstration</h2>
        <p>
          Restore the initial balances and remove local transfers, trusted
          addresses and security settings.
        </p>
        <button className="button danger" onClick={() => setConfirm(true)}>
          Reset demo data
        </button>
      </section>
      {confirm && (
        <Modal title="Reset local demo" onClose={() => setConfirm(false)}>
          <p>This resets only this browser’s demonstration data.</p>
          <label htmlFor="reset-word">Type RESET to continue</label>
          <input
            id="reset-word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
          />
          <div className="modal-actions">
            <button className="button" onClick={() => setConfirm(false)}>
              Cancel
            </button>
            <button
              className="button danger"
              disabled={word !== "RESET"}
              onClick={() => {
                reset();
                location.reload();
              }}
            >
              Reset demo
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function Preferences() {
  const { state, setPreferences, notify } = useDemo();
  const p = state.preferences;
  return (
    <>
      <section className="settings-card">
        <h2>Display preferences</h2>
        <p>Applied to wallet equivalents and the list of available balances.</p>
        <div className="settings-field-grid">
          <label>
            Default currency
            <select
              aria-label="Default currency"
              value={p.currency}
              onChange={(e) => setPreferences({ currency: e.target.value })}
            >
              {["USD", "BTC", "ETH"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Time zone
            <select
              aria-label="Account time zone"
              value={p.timezone}
              onChange={(e) => setPreferences({ timezone: e.target.value })}
            >
              {[
                "UTC",
                "Europe/Moscow",
                "Europe/London",
                "America/New_York",
                "Asia/Singapore",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <Toggle
          label="Hide small balances"
          detail="Hide wallet rows worth less than $1; your balances stay available."
          value={p.hideSmallBalances}
          onChange={(v) => setPreferences({ hideSmallBalances: v })}
        />
      </section>
      <section className="settings-card">
        <h2>Notification preferences</h2>
        <p>
          Saved locally for the demo. No emails, push notifications or messages
          are sent.
        </p>
        {(
          [
            [
              "deposit",
              "Deposit confirmed",
              "Show deposit updates in the wallet.",
            ],
            ["withdraw", "Withdrawal status", "Show outgoing transfer status."],
            [
              "trades",
              "Index operations",
              "Buy, Sell, Compile and Unmake updates.",
            ],
            [
              "security",
              "Security changes",
              "Record security and address-book changes.",
            ],
            [
              "newsletter",
              "Market digest",
              "Remember a preference for a future email digest.",
            ],
          ] as const
        ).map(([key, label, detail]) => (
          <Toggle
            key={key}
            label={label}
            detail={detail}
            value={p.notifications[key]}
            onChange={(v) =>
              setPreferences({
                notifications: { ...p.notifications, [key]: v },
              })
            }
          />
        ))}
        <button
          className="button"
          onClick={() => notify("This is a local demonstration notification.")}
        >
          Preview notification
        </button>
      </section>
    </>
  );
}
function Security() {
  const { state, updateSecurity, notify } = useDemo();
  const security = state.security;
  const [mode, setMode] = useState<"setup" | "disable" | "recovery" | null>(
    null,
  );
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState<string[]>([]);
  const [limit, setLimit] = useState(String(security.dailyLimitUsd));
  const open = (kind: typeof mode) => {
    setMode(kind);
    setCode("");
    setError("");
    setShowCode(false);
    setRecovery([]);
    if (kind === "setup") setSecret(createSecret());
  };
  const save = async () => {
    setBusy(true);
    try {
      if (mode === "disable") {
        const failure = await updateSecurity(
          { twoFactorEnabled: false, totpSecret: "", recoveryHashes: [] },
          code,
        );
        if (failure) {
          setError(failure);
          return;
        }
        setMode(null);
        notify("Demo two-factor authentication disabled.");
        return;
      }
      const codes = createRecoveryCodes();
      const hashes = await Promise.all(codes.map(hashCode));
      const failure = await updateSecurity(
        mode === "setup"
          ? {
              twoFactorEnabled: true,
              totpSecret: secret,
              recoveryHashes: hashes,
            }
          : { recoveryHashes: hashes },
        code,
      );
      if (failure) {
        setError(failure);
        return;
      }
      setRecovery(codes);
      notify("Demo authenticator settings saved.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <section className="settings-card">
        <div className="section-row">
          <div>
            <h2>Two-factor authentication</h2>
            <p>
              Demo authenticator codes are checked before withdrawals in this
              browser. This does not add server authentication.
            </p>
          </div>
          <span
            className={
              "settings-badge " + (security.twoFactorEnabled ? "enabled" : "")
            }
          >
            {security.twoFactorEnabled ? "Enabled" : "Not enabled"}
          </span>
        </div>
        <div className="settings-actions">
          {security.twoFactorEnabled ? (
            <>
              <button className="button" onClick={() => open("disable")}>
                Disable 2FA
              </button>
              <button className="button" onClick={() => open("recovery")}>
                Regenerate recovery codes
              </button>
              <small>
                {security.recoveryHashes.length} unused recovery codes
              </small>
            </>
          ) : (
            <button className="button primary" onClick={() => open("setup")}>
              <UiIcon name="shield" />
              Set up 2FA
            </button>
          )}
        </div>
      </section>
      <section className="settings-card">
        <h2>Withdrawal controls</h2>
        <Toggle
          label="Pause withdrawals"
          detail="Block new outgoing transfers. Existing accepted transfers keep processing."
          value={security.withdrawalsLocked}
          onChange={(v) => void updateSecurity({ withdrawalsLocked: v })}
        />
        <Toggle
          label="Trusted addresses only"
          detail="Allow withdrawals only to an address saved for the same asset and network."
          value={security.whitelistOnly}
          onChange={(v) => void updateSecurity({ whitelistOnly: v })}
        />
        <a href="#whitelist" className="blue settings-inline-link">
          Manage trusted wallet addresses →
        </a>
        <form
          className="settings-form settings-limit"
          onSubmit={async (e) => {
            e.preventDefault();
            const failure = await updateSecurity({
              dailyLimitUsd: Number(limit),
            });
            if (failure) setError(failure);
            else {
              setError("");
              notify("24-hour withdrawal limit updated.");
            }
          }}
        >
          <label htmlFor="withdrawal-limit">
            24-hour withdrawal limit, USD
          </label>
          <div className="settings-inline-field">
            <input
              id="withdrawal-limit"
              type="number"
              min="1"
              max="1000000000"
              step="1"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
            <button className="button">Save limit</button>
          </div>
        </form>
        {error && !mode && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      <section className="settings-card">
        <h2>How this demonstration works</h2>
        <p>
          Security preferences, test-network addresses and transfer logs are
          local. The demo contains no real private keys, payment connection or
          server login. Do not reuse a real authenticator secret here.
        </p>
      </section>
      {mode && (
        <Modal
          title={
            recovery.length
              ? "Save recovery codes"
              : mode === "setup"
                ? "Set up demo authenticator"
                : mode === "disable"
                  ? "Disable demo 2FA"
                  : "Replace recovery codes"
          }
          onClose={() => setMode(null)}
        >
          {recovery.length ? (
            <>
              <p>
                Each code can confirm one demo withdrawal. New codes replace the
                previous set.
              </p>
              <div className="recovery-code-grid">
                {recovery.map((c) => (
                  <code key={c}>{c}</code>
                ))}
              </div>
              <button
                className="button"
                onClick={() =>
                  downloadData(
                    "tbci-demo-recovery-codes.txt",
                    "TBCi DEMO recovery codes\nDo not use for real accounts.\n\n" +
                      recovery.join("\n"),
                  )
                }
              >
                <UiIcon name="download" />
                Download recovery codes
              </button>
              <div className="modal-actions">
                <button
                  className="button primary"
                  onClick={() => setMode(null)}
                >
                  I saved the codes
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="wallet-demo-banner">
                Demo only · this authenticator protects simulated withdrawals in
                this browser.
              </p>
              {mode === "setup" && (
                <>
                  <p>
                    Scan this QR with an authenticator app or copy the demo
                    secret.
                  </p>
                  <QrCode
                    label="Demo authenticator setup QR"
                    value={
                      "otpauth://totp/" +
                      encodeURIComponent("TBCi Demo:" + state.email) +
                      "?" +
                      new URLSearchParams({
                        secret,
                        issuer: "TBCi Demo",
                        algorithm: "SHA1",
                        digits: "6",
                        period: "30",
                      })
                    }
                  />
                  <label>Demo secret</label>
                  <div className="wallet-copy-field">
                    <code>{secret}</code>
                    <button
                      aria-label="Copy demo secret"
                      onClick={() => void navigator.clipboard.writeText(secret)}
                    >
                      <UiIcon name="copy" />
                    </button>
                  </div>
                </>
              )}
              <label htmlFor="totp-code">
                {mode === "setup"
                  ? "6-digit authenticator code"
                  : "Authenticator or recovery code"}
              </label>
              <input
                id="totp-code"
                autoComplete="off"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                placeholder="Enter code"
              />
              <button
                className="wallet-text-button"
                onClick={() => setShowCode(!showCode)}
              >
                Show demo verification code
              </button>
              {showCode && (
                <DemoCode
                  secret={mode === "setup" ? secret : security.totpSecret}
                />
              )}
              <p className="settings-help">
                Authenticator codes refresh every 30 seconds. Unused recovery
                codes can verify an existing setup.
              </p>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="modal-actions">
                <button className="button" onClick={() => setMode(null)}>
                  Cancel
                </button>
                <button
                  className="button primary"
                  disabled={busy || !code}
                  onClick={save}
                >
                  {busy
                    ? "Checking…"
                    : mode === "setup"
                      ? "Verify and enable"
                      : mode === "disable"
                        ? "Confirm disable"
                        : "Generate new codes"}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
function Whitelist() {
  const { state, addTrusted, removeTrusted } = useDemo();
  const [add, setAdd] = useState(false);
  const [remove, setRemove] = useState<TrustedAddress | null>(null);
  const [label, setLabel] = useState("");
  const [symbol, setSymbol] = useState("BTC");
  const [network, setNetwork] = useState(networksFor("BTC")[0].id);
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const n = networksFor(symbol).find((n) => n.id === network)!;
  return (
    <section className="settings-card">
      <div className="section-row">
        <div>
          <h2>Trusted wallet addresses</h2>
          <p>
            Saved per asset and test network. Enable “Trusted addresses only” in
            Security to enforce the list.
          </p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setAdd(true);
            setError("");
          }}
        >
          <UiIcon name="plus" />
          Add address
        </button>
      </div>
      {state.trustedAddresses.length ? (
        <div className="table-scroll">
          <table className="settings-address-table">
            <thead>
              <tr>
                {[
                  "Label",
                  "Asset / network",
                  "Address / memo",
                  "Added",
                  "",
                ].map((s, i) => (
                  <th key={i}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.trustedAddresses.map((a) => (
                <tr key={a.id}>
                  <td>{a.label}</td>
                  <td>
                    {a.symbol}
                    <small>
                      {
                        networksFor(a.symbol).find((n) => n.id === a.network)
                          ?.name
                      }
                    </small>
                  </td>
                  <td>
                    <code>{a.address}</code>
                    {a.memo && <small>Memo: {a.memo}</small>}
                  </td>
                  <td>{new Date(a.createdAt).toLocaleDateString("en-GB")}</td>
                  <td>
                    <button
                      className="button small"
                      aria-label={"Remove " + a.label}
                      onClick={() => setRemove(a)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="settings-empty">
          <UiIcon name="wallet" size={35} />
          <h3>No saved addresses yet</h3>
          <p>Add a destination to use it in the withdrawal flow.</p>
        </div>
      )}
      {add && (
        <Modal title="Add trusted address" onClose={() => setAdd(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const failure = addTrusted({
                label,
                symbol,
                network,
                address: address.trim(),
                memo: memo.trim(),
              });
              if (failure) {
                setError(failure);
                return;
              }
              setAdd(false);
              setLabel("");
              setAddress("");
              setMemo("");
            }}
          >
            <label htmlFor="address-label">Address label</label>
            <input
              id="address-label"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My test wallet"
            />
            <div className="settings-field-grid">
              <label>
                Asset
                <select
                  aria-label="Address asset"
                  value={symbol}
                  onChange={(e) => {
                    setSymbol(e.target.value);
                    setNetwork(networksFor(e.target.value)[0].id);
                    setAddress("");
                    setMemo("");
                  }}
                >
                  {assets
                    .filter((a) => !["USD", "TBCi"].includes(a.symbol))
                    .map((a) => (
                      <option key={a.symbol}>{a.symbol}</option>
                    ))}
                </select>
              </label>
              <label>
                Network
                <select
                  aria-label="Address network"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                >
                  {networksFor(symbol).map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label htmlFor="trusted-wallet-address">Wallet address</label>
            <input
              id="trusted-wallet-address"
              required
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError("");
              }}
            />
            <button
              className="wallet-text-button"
              type="button"
              onClick={() => setAddress(mockAddress(n, "trusted-" + symbol))}
            >
              Use a sample address
            </button>
            {n.memo && (
              <>
                <label htmlFor="address-memo">{n.memo}</label>
                <input
                  id="address-memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button
                className="button"
                type="button"
                onClick={() => setAdd(false)}
              >
                Cancel
              </button>
              <button className="button primary">Save address</button>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title="Remove trusted address" onClose={() => setRemove(null)}>
          <p>Remove {remove.label} from the local whitelist?</p>
          <p className="wallet-address">{remove.address}</p>
          <div className="modal-actions">
            <button className="button" onClick={() => setRemove(null)}>
              Cancel
            </button>
            <button
              className="button danger"
              onClick={() => {
                removeTrusted(remove.id);
                setRemove(null);
              }}
            >
              Remove address
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
function Transfers() {
  const { state } = useDemo();
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [asset, setAsset] = useState("all");
  const [origin, setOrigin] = useState("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(15);
  const [detail, setDetail] = useState("");
  const rows = state.transfers
    .filter(
      (t) =>
        (type === "all" || t.kind === type) &&
        (status === "all" || t.status === status) &&
        (asset === "all" || t.symbol === asset) &&
        (origin === "all" || t.origin === origin) &&
        (t.address + " " + t.txHash + " " + t.id)
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <section className="settings-card">
      <div className="section-row">
        <div>
          <h2>Deposit and withdrawal history</h2>
          <p>
            Includes ongoing local simulations and clearly marked archive
            examples.
          </p>
        </div>
        <ExportButton
          rows={rows.map((t) => ({
            id: t.id,
            type: t.kind,
            asset: t.symbol,
            network: t.network,
            amount: t.amount,
            fee: t.fee,
            feeAsset: t.feeAsset,
            status: t.status,
            address: t.address,
            memo: t.memo,
            txId: t.txHash,
            dateUTC: t.createdAt,
            origin: t.origin,
          }))}
          name="tbci-transfers.csv"
        />
      </div>
      <div className="settings-history-filters">
        <label>
          Type
          <select
            aria-label="Transfer type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">All transfers</option>
            <option value="deposit">Deposits</option>
            <option value="withdraw">Withdrawals</option>
          </select>
        </label>
        <label>
          Status
          <select
            aria-label="Transfer status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {["confirming", "completed", "failed"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Asset
          <select
            aria-label="Transfer asset"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
          >
            <option value="all">All assets</option>
            {[...new Set(state.transfers.map((t) => t.symbol))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Data source
          <select
            aria-label="Transfer data source"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            <option value="all">All records</option>
            <option value="local">Local demo</option>
            <option value="sample">2018 samples</option>
          </select>
        </label>
        <label>
          Search
          <input
            aria-label="Search transfers"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Address, ID or hash"
          />
        </label>
      </div>
      <div className="table-scroll">
        <table className="settings-transfers">
          <thead>
            <tr>
              {[
                "Created",
                "Type",
                "Asset",
                "Amount / fee",
                "Network",
                "Status",
                "",
              ].map((v, i) => (
                <th key={i}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((t) => (
              <tr key={t.id}>
                <td>
                  {new Date(t.createdAt).toLocaleString("en-GB", {
                    timeZone: state.preferences.timezone,
                  })}
                  <small>
                    {t.origin === "sample"
                      ? "2018 archive sample"
                      : "Local demo transfer"}
                  </small>
                </td>
                <td>{t.kind === "deposit" ? "Deposit" : "Withdrawal"}</td>
                <td>
                  <span className="asset-label">
                    <CryptoIcon symbol={t.symbol} size={22} />
                    {t.symbol}
                  </span>
                </td>
                <td>
                  {number(t.amount, 8)} {t.symbol}
                  <small>
                    Fee {number(t.fee, 8)} {t.feeAsset}
                  </small>
                </td>
                <td>
                  {networksFor(t.symbol).find((n) => n.id === t.network)
                    ?.name ?? t.network}
                </td>
                <td>
                  <span className={"transfer-status " + t.status}>
                    {t.status}
                  </span>
                  <small>
                    {t.confirmations}/{t.requiredConfirmations} confirmations
                  </small>
                </td>
                <td>
                  <button
                    className="button small"
                    aria-label={"Details " + t.id}
                    onClick={() => setDetail(t.id)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="empty-cell">
                  No transfers match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > limit && (
        <button className="button" onClick={() => setLimit(limit + 15)}>
          Load more
        </button>
      )}
      {detail && (
        <Modal title="Transfer details" onClose={() => setDetail("")}>
          <TransferProgress id={detail} onClose={() => setDetail("")} />
        </Modal>
      )}
    </section>
  );
}
function Activity() {
  const { state } = useDemo();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState("all");
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const rows = state.audit
    .filter(
      (e) =>
        (category === "all" || e.category === category) &&
        (origin === "all" || e.origin === origin) &&
        (e.action + " " + e.details)
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .slice(0, 100);
  return (
    <section className="settings-card">
      <div className="section-row">
        <div>
          <h2>Activity log</h2>
          <p>
            Local profile, security, preference, trading and wallet events.
            Codes and authenticator secrets are not recorded.
          </p>
        </div>
        <ExportButton
          rows={rows.map((e) => ({ ...e }))}
          name="tbci-activity.csv"
        />
      </div>
      <div className="settings-history-filters">
        <label>
          Category
          <select
            aria-label="Activity category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {[
              "wallet",
              "security",
              "profile",
              "preferences",
              "trading",
              "session",
              "verification",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Source
          <select
            aria-label="Activity data source"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            <option value="all">All events</option>
            <option value="local">Local</option>
            <option value="sample">Archive examples</option>
          </select>
        </label>
        <label>
          Search
          <input
            aria-label="Search activity"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="table-scroll">
        <table className="settings-log">
          <thead>
            <tr>
              {["Time", "Category", "Action / data", ""].map((v, i) => (
                <th key={i}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>
                  {new Date(e.date).toLocaleString("en-GB", {
                    timeZone: state.preferences.timezone,
                  })}
                  <small>
                    {e.origin === "sample" ? "Archive sample" : "Local demo"}
                  </small>
                </td>
                <td>{e.category}</td>
                <td>
                  <strong>{e.action}</strong>
                  <small>{e.details}</small>
                </td>
                <td>
                  <button
                    className="button small"
                    aria-label={"Event details " + e.id}
                    onClick={() => setSelected(e)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="empty-cell">
                  No events match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selected && (
        <Modal title="Activity event data" onClose={() => setSelected(null)}>
          <dl className="wallet-review">
            <dt>Event ID</dt>
            <dd className="wallet-address">{selected.id}</dd>
            <dt>Time / UTC</dt>
            <dd>{selected.date}</dd>
            <dt>Category</dt>
            <dd>{selected.category}</dd>
            <dt>Action</dt>
            <dd>{selected.action}</dd>
            <dt>Details</dt>
            <dd>{selected.details}</dd>
            <dt>Source</dt>
            <dd>{selected.origin}</dd>
          </dl>
          <button
            className="button"
            onClick={() =>
              downloadData(
                "tbci-event-" + selected.id + ".json",
                JSON.stringify(selected, null, 2),
                "application/json",
              )
            }
          >
            Download event JSON
          </button>
        </Modal>
      )}
    </section>
  );
}
function Devices() {
  const { state, revokeSession } = useDemo();
  return (
    <section className="settings-card">
      <h2>Devices and sessions</h2>
      <p>
        The current browser and two illustrative devices. Revocation updates
        this local demo only; there is no server login service.
      </p>
      <div className="settings-devices">
        {state.sessions.map((s) => (
          <article key={s.id}>
            <span className="device-icon">
              <UiIcon name={s.current ? "shield" : "device"} size={22} />
            </span>
            <div>
              <h3>{s.device}</h3>
              <p>{s.location}</p>
              <small>
                {s.current
                  ? "Current local session"
                  : new Date(s.lastActive).toLocaleString("en-GB", {
                      timeZone: state.preferences.timezone,
                    })}
              </small>
            </div>
            {s.current ? (
              <span className="settings-badge enabled">Current</span>
            ) : (
              <button
                className="button small"
                disabled={s.revoked}
                onClick={() => revokeSession(s.id)}
              >
                {s.revoked ? "Revoked" : "Revoke sample session"}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
export default function AccountSettings() {
  const [tab, setTab] = useState(() => {
    const value = location.hash.slice(1);
    return tabs.some(([id]) => id === value) ? value : "profile";
  });
  const { state } = useDemo();
  useEffect(() => {
    const changed = () => {
      const v = location.hash.slice(1);
      if (tabs.some(([id]) => id === v)) setTab(v);
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  return (
    <div className="account-settings">
      <div className="settings-intro">
        <p>Profile, wallet controls, history and local security preferences.</p>
        <span className="settings-badge">Browser demo</span>
      </div>
      <div className="settings-layout">
        <nav
          role="tablist"
          aria-label="Settings sections"
          className="settings-tabs"
        >
          {tabs.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              id={"tab-" + id}
              aria-selected={tab === id}
              aria-controls={"panel-" + id}
              onClick={() => {
                setTab(id);
                history.replaceState(null, "", "#" + id);
              }}
            >
              {label}
              {id === "transfers" &&
                state.transfers.some((t) => t.status === "confirming") && (
                  <b>
                    {
                      state.transfers.filter((t) => t.status === "confirming")
                        .length
                    }
                  </b>
                )}
            </button>
          ))}
        </nav>
        <div
          className="settings-panel"
          role="tabpanel"
          id={"panel-" + tab}
          aria-labelledby={"tab-" + tab}
        >
          {tab === "verification" ? (
            <Verification />
          ) : tab === "profile" ? (
            <Profile />
          ) : tab === "preferences" ? (
            <Preferences />
          ) : tab === "security" ? (
            <Security />
          ) : tab === "whitelist" ? (
            <Whitelist />
          ) : tab === "transfers" ? (
            <Transfers />
          ) : tab === "activity" ? (
            <Activity />
          ) : (
            <Devices />
          )}
        </div>
      </div>
    </div>
  );
}
