import AssetConversion from "./AssetConversion";
import { useEffect, useMemo, useState } from "react";
import { useDemo } from "./DemoContext";
import { assets, money, number } from "../data/demo";
import {
  allIndices,
  accountTotals,
  reservedBalance,
  equivalentValue,
} from "../data/portfolio";
import { networksFor, downloadData } from "../data/wallet";
import { CryptoIcon, Funding, Modal } from "./Primitives";
import { TransferProgress } from "./WalletTransfer";
import UiIcon from "./UiIcon";
import MobileCarousel from "./MobileCarousel";
type WalletRow = {
  id: string;
  name: string;
  symbol: string;
  kind: "crypto" | "cash" | "index";
  price: number;
  quantity: number;
  available: number;
  reserved: number;
  value: number;
};
export default function InternalWallet() {
  const { state, setPreferences, selectIndex } = useDemo();
  const [convert, setConvert] = useState<string | null>(null);
  const [query, setQuery] = useState(""),
    [kind, setKind] = useState("all"),
    [sort, setSort] = useState("value"),
    [fund, setFund] = useState<{ symbol: string; withdraw: boolean } | null>(
      null,
    ),
    [choose, setChoose] = useState<boolean | null>(null),
    [assetQuery, setAssetQuery] = useState(""),
    [detail, setDetail] = useState<WalletRow | null>(null),
    [transfer, setTransfer] = useState(""),
    [status, setStatus] = useState("all");
  const hidden = state.preferences.hideBalances,
    hideZero = state.preferences.hideZeroBalances,
    totals = accountTotals(state);
  const rows = useMemo(() => {
    const currencies: WalletRow[] = assets
      .filter((a) => a.symbol !== "TBCi")
      .map((a) => {
        const reserved = reservedBalance(state, a.symbol),
          available = state.balances[a.symbol] ?? 0;
        return {
          id: a.symbol,
          name: a.name,
          symbol: a.symbol,
          kind: a.symbol === "USD" ? "cash" : "crypto",
          price: a.price,
          quantity: available + reserved,
          available,
          reserved,
          value: (available + reserved) * a.price,
        };
      });
    const indices: WalletRow[] = allIndices.map((i) => ({
      id: i.id,
      name: i.name,
      symbol: "TBCi",
      kind: "index",
      price: i.price,
      quantity: state.tokenBalances[i.id] ?? 0,
      available: state.tokenBalances[i.id] ?? 0,
      reserved: 0,
      value: (state.tokenBalances[i.id] ?? 0) * i.price,
    }));
    return [...currencies, ...indices];
  }, [state.balances, state.tokenBalances, state.transfers]);
  const currentDetail = rows.find((a) => a.id === detail?.id) ?? detail;
  const filtered = rows
    .filter(
      (a) =>
        (kind === "all" || a.kind === kind) &&
        (!hideZero || a.quantity > 1e-8) &&
        (!state.preferences.hideSmallBalances || a.value >= 1) &&
        (a.name + " " + a.symbol).toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "balance"
          ? b.quantity - a.quantity
          : b.value - a.value,
    );
  const transfers = state.transfers
    .filter((t) => status === "all" || t.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  const amount = (v: number, digits = 8) =>
    hidden ? "••••" : number(v, digits);
  const value = (v: number) =>
    hidden ? "••••" : equivalentValue(v, state.preferences.currency);
  useEffect(() => {
    const symbol = new URLSearchParams(location.search).get("asset");
    if (
      symbol &&
      assets.some((a) => a.symbol === symbol && a.symbol !== "TBCi")
    ) {
      setFund({ symbol, withdraw: false });
      history.replaceState(null, "", location.pathname);
    }
  }, []);
  const exportBalances = () => {
    const quote = (v: unknown) => '"' + String(v).replaceAll('"', '""') + '"';
    downloadData(
      "tbci-wallet-balances.csv",
      "asset,name,type,balance,available,reserved,priceUSD,valueUSD\n" +
        filtered
          .map((a) =>
            [
              a.symbol,
              a.name,
              a.kind,
              a.quantity,
              a.available,
              a.reserved,
              a.price,
              a.value,
            ]
              .map(quote)
              .join(","),
          )
          .join("\n"),
      "text/csv",
    );
  };
  const openFund = (symbol: string, withdraw: boolean) => {
    setChoose(null);
    setDetail(null);
    setFund({ symbol, withdraw });
  };
  return (
    <div className="internal-wallet">
      <div className="portfolio-intro">
        <div>
          <p className="eyebrow">ASSETS & TRANSFERS</p>
          <p>
            Your internal wallet: available funds, reserved withdrawals and
            every supported asset.
          </p>
        </div>
        <div className="portfolio-header-actions">
          <label className="wallet-display-currency">
            Display currency
            <select
              aria-label="Display currency"
              value={state.preferences.currency}
              onChange={(e) => setPreferences({ currency: e.target.value })}
            >
              <option>USD</option>
              <option>BTC</option>
              <option>ETH</option>
            </select>
          </label>
          <button
            className="button"
            aria-label={hidden ? "Show balances" : "Hide balances"}
            onClick={() => setPreferences({ hideBalances: !hidden })}
          >
            <UiIcon name={hidden ? "eye" : "eye-off"} />
            {hidden ? "Show balances" : "Hide balances"}
          </button>
          <button
            className="button primary"
            onClick={() => {
              setChoose(false);
              setAssetQuery("");
            }}
          >
            <UiIcon name="arrow-in" />
            Deposit
          </button>
          <button
            className="button"
            disabled={state.kyc.level === 1}
            onClick={() => setConvert("USD")}
          >
            <UiIcon name="refresh" />
            Convert
          </button>
          <button
            className="button"
            disabled={state.security.withdrawalsLocked || state.kyc.level === 1}
            onClick={() => {
              setChoose(true);
              setAssetQuery("");
            }}
          >
            <UiIcon name="arrow-out" />
            Withdraw
          </button>
        </div>
      </div>
      <div className="portfolio-totals wallet-total-cards">
        <article>
          <span>Total account value</span>
          <strong data-value={totals.total}>{value(totals.total)}</strong>
          <small>All indices and wallet assets, including reserved funds</small>
        </article>
        <article>
          <span>Available wallet assets</span>
          <strong>{value(totals.available)}</strong>
          <small>
            Crypto and USD available for transfers or index purchases
          </small>
        </article>
        <article>
          <span>Reserved withdrawals</span>
          <strong data-value={totals.reserved}>{value(totals.reserved)}</strong>
          <small>Pending outgoing amounts and network fees</small>
        </article>
      </div>
      {totals.claims > 0 && (
        <div className="wallet-claim-notice">
          <UiIcon name="wallet" />
          <p>
            Unclaimed basket assets: <strong>{value(totals.claims)}</strong>.
            Continue your redemption to move them into available wallets.
          </p>
          <a
            className="button small"
            href="/app/unmake/"
            onClick={() =>
              state.redemption && selectIndex(state.redemption.indexId)
            }
          >
            View claims
          </a>
        </div>
      )}
      <section className="portfolio-panel wallet-assets-panel">
        <div className="portfolio-section-head">
          <div>
            <h2>
              All assets <span className="count-badge">{filtered.length}</span>
            </h2>
            <p>
              Transfer wallet assets directly; buy or sell index holdings in
              Overview.
            </p>
          </div>
          <button
            className="button small wallet-export-balances"
            aria-label="Export balances"
            title="Export balances"
            onClick={exportBalances}
          >
            <UiIcon name="download" />
            <span>Export balances</span>
          </button>
        </div>
        <div className="wallet-asset-toolbar">
          <label className="asset-search">
            <UiIcon name="search" />
            <input
              aria-label="Search wallet assets"
              type="search"
              placeholder="Search asset or index"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="wallet-zero-toggle">
            <input
              type="checkbox"
              aria-label="Hide zero balances"
              checked={hideZero}
              onChange={(e) =>
                setPreferences({ hideZeroBalances: e.target.checked })
              }
            />
            <span className="wallet-zero-full-label">Hide zero balances</span>
            <span className="wallet-zero-short-label" aria-hidden="true">
              Hide zero
            </span>
          </label>
          <label className="wallet-sort-label">
            <span>Sort</span>
            <select
              aria-label="Sort wallet assets"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="value">Highest value</option>
              <option value="name">Asset name</option>
              <option value="balance">Largest balance</option>
            </select>
          </label>
        </div>
        <div
          className="wallet-asset-tabs"
          role="group"
          aria-label="Asset categories"
        >
          {[
            ["all", "All assets"],
            ["index", "Indices"],
            ["crypto", "Crypto"],
            ["cash", "Cash"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={kind === id}
              onClick={() => setKind(id)}
            >
              {label}
              <span>
                {rows.filter((r) => id === "all" || r.kind === id).length}
              </span>
            </button>
          ))}
        </div>
        {state.preferences.hideSmallBalances && (
          <p className="wallet-filter-note">
            Balances worth less than $1 are hidden by your{" "}
            <a href="/app/settings/#preferences">display preferences</a>.
          </p>
        )}
        {filtered.some((a) => a.kind === "index") && (
          <section
            className="wallet-mobile-indices"
            aria-label="Index holdings"
          >
            <h3>
              Indices{" "}
              <span className="count-badge">
                {filtered.filter((a) => a.kind === "index").length}
              </span>
            </h3>
            <MobileCarousel
              label="Wallet indices"
              className="wallet-index-carousel"
              items={filtered
                .filter((a) => a.kind === "index")
                .map((a) => ({
                  key: a.id,
                  label: a.name,
                  content: (
                    <article
                      className="wallet-index-card"
                      data-wallet-index={a.id}
                    >
                      <div className="wallet-index-heading">
                        <span className="index-mark">TBCi</span>
                        <h4>
                          <button
                            onClick={() => setDetail(a)}
                            aria-label={"Details " + a.name}
                          >
                            {a.name}
                          </button>
                        </h4>
                      </div>
                      <strong>
                        {amount(a.quantity)} <small>TBCi</small>
                      </strong>
                      <span>{value(a.value)}</span>
                      <div className="wallet-index-actions">
                        <a
                          className="button primary"
                          href={"/app/?trade=buy&index=" + a.id}
                        >
                          Buy
                        </a>
                        <a
                          className={
                            "button " +
                            (a.quantity <= 1e-8 ? "is-disabled" : "")
                          }
                          aria-disabled={a.quantity <= 1e-8}
                          href={
                            a.quantity > 1e-8
                              ? "/app/?trade=sell&index=" + a.id
                              : undefined
                          }
                        >
                          Sell
                        </a>
                      </div>
                    </article>
                  ),
                }))}
            />
          </section>
        )}
        <table
          className={
            "asset-wallet-table " +
            (filtered.every((a) => a.kind === "index")
              ? "wallet-indices-only"
              : "")
          }
        >
          <thead>
            <tr>
              {["Asset", "Unit price", "Balance", "Value", "Actions"].map(
                (v) => (
                  <th key={v}>{v}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} data-asset={a.id} data-kind={a.kind}>
                <td>
                  <button
                    className="wallet-asset-name"
                    onClick={() => setDetail(a)}
                    aria-label={"Details " + a.name}
                  >
                    {a.kind === "index" ? (
                      <span className="index-mark">TBCi</span>
                    ) : (
                      <CryptoIcon symbol={a.symbol} size={30} />
                    )}
                    <span>
                      <strong>{a.name}</strong>
                      <b className="wallet-mobile-symbol">{a.symbol}</b>
                      <small>
                        {a.symbol} ·{" "}
                        {a.kind === "index"
                          ? "Index"
                          : a.kind === "cash"
                            ? "Demo cash account"
                            : "Crypto asset"}
                      </small>
                    </span>
                  </button>
                </td>
                <td data-label="Unit price">
                  {money(a.price, a.price < 1 ? 6 : 3)}
                </td>
                <td data-label="Balance">
                  <strong className="wallet-full-balance">
                    {amount(a.quantity)} {a.symbol}
                  </strong>
                  <strong className="wallet-mobile-balance">
                    {amount(a.quantity, a.quantity >= 1000 ? 2 : 6)}
                  </strong>
                  <small className="wallet-mobile-value">
                    {value(a.value)}
                  </small>
                  <small className="wallet-available">
                    Available {amount(a.available)}
                  </small>
                  {a.reserved > 0 && (
                    <small className="reserved-asset">
                      Reserved {amount(a.reserved)}
                    </small>
                  )}
                </td>
                <td data-label="Value">
                  <strong data-value={a.value}>{value(a.value)}</strong>
                </td>
                <td className="wallet-row-actions">
                  {a.kind !== "index" && (
                    <button
                      className="button wallet-mobile-action"
                      aria-label={"Actions for " + a.symbol}
                      onClick={() => setDetail(a)}
                    >
                      •••
                    </button>
                  )}
                  {a.kind === "index" ? (
                    <>
                      <a
                        className="button small primary"
                        href={"/app/?trade=buy&index=" + a.id}
                      >
                        Buy
                      </a>
                      <a
                        className={
                          "button small " +
                          (a.quantity <= 1e-8 ? "is-disabled" : "")
                        }
                        aria-disabled={a.quantity <= 1e-8}
                        href={
                          a.quantity > 1e-8
                            ? "/app/?trade=sell&index=" + a.id
                            : undefined
                        }
                      >
                        Sell
                      </a>
                    </>
                  ) : (
                    <>
                      <button
                        className="button small"
                        aria-label={"Deposit " + a.symbol}
                        onClick={() => openFund(a.symbol, false)}
                      >
                        <UiIcon name="arrow-in" />
                        Deposit
                      </button>
                      <button
                        className="button small"
                        aria-label={"Withdraw " + a.symbol}
                        disabled={
                          a.available <= 0 ||
                          state.security.withdrawalsLocked ||
                          state.kyc.level === 1
                        }
                        onClick={() => openFund(a.symbol, true)}
                      >
                        <UiIcon name="arrow-out" />
                        Withdraw
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="portfolio-empty">
            <h3>No matching assets</h3>
            <p>Try a different search or show zero balances.</p>
            <button
              className="button"
              onClick={() => {
                setQuery("");
                setKind("all");
                setPreferences({
                  hideZeroBalances: false,
                  hideSmallBalances: false,
                });
              }}
            >
              Reset asset filters
            </button>
          </div>
        )}
        <p className="portfolio-footnote">
          Balances include every index and wallet asset once.
        </p>
      </section>
      <section className="portfolio-panel wallet-transfer-history">
        <div className="portfolio-section-head">
          <div>
            <h2>Recent transfers</h2>
            <p>Pending, completed and failed deposits or withdrawals.</p>
          </div>
          <div className="wallet-history-controls">
            <select
              aria-label="Recent transfer status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="confirming">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <a className="button small" href="/app/settings/#transfers">
              Full history
              <UiIcon name="chevron-right" />
            </a>
          </div>
        </div>
        <ul className="wallet-transfer-list">
          {transfers.map((t) => (
            <li key={t.id}>
              <span className={"operation-icon " + t.kind}>
                <UiIcon
                  name={t.kind === "deposit" ? "arrow-in" : "arrow-out"}
                />
              </span>
              <div>
                <strong>
                  {t.kind === "deposit" ? "Deposit" : "Withdrawal"} · {t.symbol}
                </strong>
                <small>
                  {networksFor(t.symbol).find((n) => n.id === t.network)
                    ?.name ?? t.network}{" "}
                  ·{" "}
                  {t.origin === "sample"
                    ? "Archive demo example"
                    : new Date(t.createdAt).toLocaleString("en-GB", {
                        timeZone: state.preferences.timezone,
                      })}
                </small>
              </div>
              <div className="wallet-transfer-result">
                <strong>
                  {amount(t.amount)} {t.symbol}
                </strong>
                <span className={"transfer-status " + t.status}>
                  {t.status === "confirming" ? "Pending" : t.status}
                </span>
              </div>
              <button
                className="button small"
                aria-label={"Transfer details " + t.id}
                onClick={() => setTransfer(t.id)}
              >
                Details
              </button>
            </li>
          ))}
        </ul>
        {!transfers.length && (
          <div className="portfolio-empty">No transfers match this status.</div>
        )}
      </section>
      {state.security.withdrawalsLocked && (
        <p className="wallet-filter-note">
          Withdrawals are paused.{" "}
          <a href="/app/settings/#security">Manage withdrawal controls</a>.
        </p>
      )}
      {state.kyc.level === 1 && (
        <p className="wallet-filter-note">
          Level 1 allows purchases only.{" "}
          <a href="/app/settings/#verification">Complete Basic KYC</a> to enable
          withdrawals.
        </p>
      )}
      <p className="portfolio-footnote">
        Wallet demonstration · no real funds, private keys or blockchain
        broadcasts.
      </p>
      {state.operations.some((o) => o.type === "convert") && (
        <section className="portfolio-panel">
          <div className="portfolio-section-head">
            <h2>Recent conversions</h2>
            <a className="button small" href="/app/settings/#activity">
              Activity log
            </a>
          </div>
          <ul className="wallet-conversion-list">
            {state.operations
              .filter((o) => o.type === "convert")
              .slice(0, 5)
              .map((o) => (
                <li key={o.id}>
                  <UiIcon name="refresh" />
                  <div>
                    <strong>
                      {amount(o.amount)} {o.symbol} →{" "}
                      {amount(o.receivedAmount ?? 0)} {o.receivedSymbol}
                    </strong>
                    <small>
                      {new Date(o.date).toLocaleString("en-GB", {
                        timeZone: state.preferences.timezone,
                      })}{" "}
                      · fee {value(o.fee ?? 0)}
                    </small>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}
      {convert && (
        <AssetConversion initial={convert} onClose={() => setConvert(null)} />
      )}
      {choose !== null && (
        <Modal
          title={
            choose ? "Choose asset to withdraw" : "Choose asset to deposit"
          }
          onClose={() => setChoose(null)}
        >
          <label className="asset-search">
            <UiIcon name="search" />
            <input
              aria-label="Choose wallet asset"
              type="search"
              placeholder="Search supported assets"
              value={assetQuery}
              onChange={(e) => setAssetQuery(e.target.value)}
            />
          </label>
          <div className="wallet-asset-picker">
            {assets
              .filter(
                (a) =>
                  a.symbol !== "TBCi" &&
                  (a.name + " " + a.symbol)
                    .toLowerCase()
                    .includes(assetQuery.toLowerCase()),
              )
              .map((a) => (
                <button
                  key={a.symbol}
                  disabled={
                    choose &&
                    (state.balances[a.symbol] <= 0 ||
                      state.security.withdrawalsLocked ||
                      state.kyc.level === 1)
                  }
                  onClick={() => openFund(a.symbol, choose)}
                >
                  <CryptoIcon symbol={a.symbol} size={28} />
                  <span>
                    <strong>{a.name}</strong>
                    <small>{a.symbol}</small>
                  </span>
                  <span>
                    {amount(state.balances[a.symbol])}
                    <small>{value(state.balances[a.symbol] * a.price)}</small>
                  </span>
                  <UiIcon name="chevron-right" />
                </button>
              ))}
          </div>
          <p className="settings-help">
            Choose the network in the next step. Index tokens can be converted
            through Buy, Sell or Unmake.
          </p>
        </Modal>
      )}
      {currentDetail && (
        <Modal
          title={currentDetail.name + " wallet"}
          onClose={() => setDetail(null)}
        >
          <dl className="wallet-review">
            <dt>Asset type</dt>
            <dd>{currentDetail.kind}</dd>
            <dt>Total balance</dt>
            <dd>
              {amount(currentDetail.quantity)} {currentDetail.symbol}
            </dd>
            <dt>Available</dt>
            <dd>
              {amount(currentDetail.available)} {currentDetail.symbol}
            </dd>
            <dt>Reserved</dt>
            <dd>
              {amount(currentDetail.reserved)} {currentDetail.symbol}
            </dd>
            <dt>USD value</dt>
            <dd>{value(currentDetail.value)}</dd>
          </dl>
          {currentDetail.kind === "index" ? (
            <>
              <p>
                Buy or sell this index in Overview. Unmake redeems its basket
                components.
              </p>
              <div className="modal-actions">
                <a
                  className="button primary"
                  href={"/app/?trade=buy&index=" + currentDetail.id}
                >
                  Buy index
                </a>
                <a
                  className="button"
                  href={"/app/?trade=sell&index=" + currentDetail.id}
                >
                  Sell index
                </a>
              </div>
            </>
          ) : (
            <>
              <h3>Supported demo networks</h3>
              <ul className="wallet-network-list">
                {networksFor(currentDetail.symbol).map((n) => (
                  <li key={n.id}>
                    <strong>{n.name}</strong>
                    <small>
                      Minimum {n.minimum} {currentDetail.symbol} · fee {n.fee}{" "}
                      {n.feeAsset} · {n.confirmations} confirmations
                    </small>
                  </li>
                ))}
              </ul>
              <div className="modal-actions">
                <button
                  className="button primary"
                  onClick={() => openFund(currentDetail.symbol, false)}
                >
                  Deposit {currentDetail.symbol}
                </button>
                <button
                  className="button"
                  disabled={
                    currentDetail.available <= 0 ||
                    state.security.withdrawalsLocked ||
                    state.kyc.level === 1
                  }
                  onClick={() => openFund(currentDetail.symbol, true)}
                >
                  Withdraw {currentDetail.symbol}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
      {fund && <Funding {...fund} onClose={() => setFund(null)} />}{" "}
      {transfer && (
        <Modal title="Transfer details" onClose={() => setTransfer("")}>
          <TransferProgress id={transfer} onClose={() => setTransfer("")} />
        </Modal>
      )}
    </div>
  );
}
