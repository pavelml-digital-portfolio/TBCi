import MyWallet from "./MyWallet";
import InternalWallet from "./InternalWallet";
import { indexBasket, allIndices } from "../data/portfolio";
import { faqs } from "../data/faq";
import { VerificationAllowance } from "./Verification";
import UiIcon from "./UiIcon";
import AccountSettings from "./AccountSettings";
import { profiles, marketStats } from "../data/market";
import { useState } from "react";
import {
  walletSymbols,
  coin,
  basket,
  findIndex,
  TOKEN_PRICE,
  money,
  number,
} from "../data/demo";
import { DemoProvider, useDemo } from "./DemoContext";
import {
  Wordmark,
  AssetLabel,
  TransferIcon,
  Sparkline,
  CurrencyButtons,
  Modal,
  Funding,
} from "./Primitives";
export type Section =
  | "overview"
  | "wallets"
  | "indices"
  | "buy"
  | "compile"
  | "sell"
  | "unmake"
  | "history"
  | "holders"
  | "settings"
  | "help";
const pages: Record<Section, string> = {
  overview: "Overview",
  wallets: "Wallet",
  indices: "Explore indices",
  buy: "Buy",
  compile: "Compile",
  sell: "Sell",
  unmake: "Unmake",
  history: "Historical price",
  holders: "Holders",
  settings: "Settings",
  help: "FAQ",
};
const refs: Record<Section, string> = {
  wallets: "CAB-01",
  indices: "CAB-02",
  overview: "CAB-03",
  buy: "CAB-04",
  compile: "CAB-05",
  sell: "CAB-06",
  unmake: "CAB-07",
  history: "CAB-08",
  holders: "CAB-09",
  settings: "NAV-SETTING",
  help: "NAV-FAQ",
};
const href = (section: Section) =>
  section === "overview"
    ? "/app/"
    : section === "buy" || section === "sell"
      ? "/app/?trade=" + section
      : "/app/" + section + "/";
function TokenSummary() {
  const { state } = useDemo();
  const selected = findIndex(state.selectedIndex);
  const [currency, setCurrency] = useState(state.preferences.currency);
  return (
    <section className="token-summary">
      <div className="token-summary-name">
        <span className="mini-donut" />
        <div>
          <strong>{selected.name}</strong>
          <a href="/app/">Information</a>
        </div>
      </div>
      <div className="summary-value">
        <span>Total balance</span>
        <strong>{number(state.balances.TBCi)} TBCi</strong>
      </div>
      <div className="summary-value">
        <span>Equivalent</span>
        <strong>
          {currency === "USD"
            ? money(state.balances.TBCi * selected.price, 3)
            : number(
                (state.balances.TBCi * selected.price) / coin(currency).price,
              ) +
              " " +
              currency}
        </strong>
        <select
          aria-label="Token equivalent currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option>USD</option>
          <option>BTC</option>
          <option>ETH</option>
        </select>
      </div>
      <div className="summary-change">
        <small>Change 24 hour · 31 Dec 2018 UTC</small>
        <div>
          <strong>{number(selected.points)}</strong>
          <span className={selected.change >= 0 ? "positive" : "negative"}>
            {selected.change >= 0 ? "▲" : "▼"} 1.468 &nbsp;{" "}
            {selected.change > 0 ? "+" : ""}
            {selected.change}%
          </span>
        </div>
      </div>
      <Sparkline
        negative={selected.change < 0}
        instrument={state.selectedIndex}
      />
    </section>
  );
}
function Choices() {
  const { state, selectIndex } = useDemo();
  const [currency, setCurrency] = useState(state.preferences.currency);
  const [sort, setSort] = useState("default");
  const choices = [...allIndices].sort((a, b) =>
    sort === "price"
      ? b.price - a.price
      : sort === "growth"
        ? b.change - a.change
        : 0,
  );
  const choose = (id: string, destination: Section) => {
    selectIndex(id);
    location.href =
      destination === "buy" || destination === "sell"
        ? "/app/?trade=" + destination + "&index=" + id
        : destination === "overview"
          ? "/app/?focus=" + id
          : href(destination);
  };
  return (
    <>
      <div className="choice-filters">
        <label>
          Price equivalent{" "}
          <CurrencyButtons value={currency} onChange={setCurrency} />
        </label>
        <label>
          Current balance{" "}
          <select
            aria-label="Sort index cards"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="default">All types</option>
            <option value="price">Price</option>
            <option value="growth">24h change</option>
          </select>
        </label>
      </div>
      <div className="choice-grid">
        {choices.map((a) => (
          <section className="choice-card" key={a.id}>
            <div className="choice-description">
              <h2>{a.name}</h2>
              <span>
                Price{" "}
                <b>
                  {currency === "USD"
                    ? money(a.price, 3)
                    : number(a.price / coin(currency).price) + " " + currency}
                </b>
              </span>
              <span>
                Balance <b>{number(state.tokenBalances[a.id] ?? 0)} TBCi</b>
              </span>
            </div>
            <div className="choice-market">
              <Sparkline negative={a.change < 0} instrument={a.id} />
              <div>
                <b className="blue">{number(a.points)}</b>{" "}
                <span className={a.change > 0 ? "positive" : "negative"}>
                  {a.change > 0 ? "▲" : "▼"} 1.468 &nbsp;{" "}
                  {a.change > 0 ? "+" : ""}
                  {a.change}% (24h)
                </span>
              </div>
            </div>
            <p className="choice-profile">{profiles[a.id]?.description}</p>
            <div className="choice-risk">
              <span>
                Risk <strong>{profiles[a.id]?.risk}</strong>
              </span>
              <span>
                2018 volatility{" "}
                <strong>{number(marketStats(a.id).volatility, 1)}%</strong>
              </span>
            </div>
            <div className="choice-actions">
              <button
                className="button small"
                onClick={() => choose(a.id, "overview")}
              >
                Overview
              </button>
              <button
                className="button small"
                onClick={() => choose(a.id, "compile")}
              >
                Compile
              </button>
              <button
                className="button primary small"
                onClick={() => choose(a.id, "buy")}
              >
                Buy
              </button>
              <details>
                <summary aria-label={"More actions for " + a.name}>•••</summary>
                <div className="dropdown">
                  {(["sell", "unmake", "history", "holders"] as Section[]).map(
                    (p) => (
                      <button key={p} onClick={() => choose(a.id, p)}>
                        {pages[p]}
                      </button>
                    ),
                  )}
                </div>
              </details>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
function Amount({
  value,
  onChange,
  label = "Amount",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div className="amount-box">
      <div className="stepper">
        <button
          aria-label="Increase amount"
          onClick={() => onChange(String(Math.max(0, Number(value) || 0) + 1))}
        >
          <UiIcon name="chevron-up" />
        </button>
        <button
          aria-label="Decrease amount"
          onClick={() =>
            onChange(String(Math.max(0, (Number(value) || 0) - 1)))
          }
        >
          <UiIcon name="chevron-down" />
        </button>
      </div>
      <label htmlFor="token-amount">{label}</label>
      <div>
        <input
          id="token-amount"
          aria-label={label + " TBCi"}
          type="number"
          min="0.00000001"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span>TBCi</span>
      </div>
    </div>
  );
}
function Compile({ unmake = false }: { unmake?: boolean }) {
  const { state, trade, redeem, notify } = useDemo();
  const active =
    unmake && state.redemption?.indexId === state.selectedIndex
      ? state.redemption
      : null;
  const [component, setComponent] = useState<string | null>(null);
  const [amount, setAmount] = useState(
    active ? String(active.amount) : unmake ? "1000" : "2000",
  );
  const [calculated, setCalculated] = useState(true);
  const [expanded, setExpanded] = useState(!!active);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [fund, setFund] = useState<string | null>(null);
  const q = Number(amount);
  const valid = Number.isFinite(q) && q > 0;
  const rows = (
    active
      ? basket.filter((a) => Object.hasOwn(active.remaining, a.symbol))
      : indexBasket(state.selectedIndex)
  ).map((a) => ({
    ...a,
    required:
      (((valid ? q : 0) * findIndex(state.selectedIndex).price * a.weight) /
        100 /
        a.price) *
      (unmake ? 0.995 : 1.005),
  }));
  const ready =
    calculated &&
    valid &&
    (unmake
      ? !!active || q <= state.balances.TBCi
      : rows.every((a) => a.required <= state.balances[a.symbol] + 1e-8));
  const action = unmake ? "Unmake" : "Compile";
  return (
    <>
      <TokenSummary />
      {unmake && <h2 className="unmake-title">How much to unmake</h2>}
      <VerificationAllowance />
      <div className="compile-controls">
        {unmake && (
          <div className="total-balance">
            <span>TOTAL BALANCE</span>
            <strong>
              {number(state.balances.TBCi)} <small>TBCi</small>
            </strong>
          </div>
        )}
        <Amount
          value={amount}
          onChange={(v) => {
            if (active) return;
            setAmount(v);
            setCalculated(false);
            setError("");
          }}
        />
        {unmake && (
          <div className="commission-box">
            <span>COMMISSION 0.5%</span>
            <strong className="negative">
              {number((valid ? q : 0) * 0.005)} TBCi
            </strong>
          </div>
        )}
        <div className="compile-actions">
          <div className="inline-actions">
            <button
              className="button primary"
              disabled={!valid}
              onClick={() => {
                setCalculated(true);
                setExpanded(true);
              }}
            >
              Calculate &nbsp; ›
            </button>
            <button
              className={"button " + (unmake ? "danger" : "primary")}
              disabled={!ready}
              onClick={() => {
                setComponent(null);
                setConfirm(true);
              }}
            >
              {unmake ? "Withdraw all" : "Compile"}
            </button>
          </div>
          <p className="update-note">
            ⟳ &nbsp; Update: Oct 22, 2018 09:42 PM UTC
          </p>
        </div>
      </div>
      <div className="table-scroll compile-table">
        <table>
          <thead>
            <tr>
              <th>Currency</th>
              <th>{unmake ? "Cost" : "Price"}</th>
              {!unmake && <th>Available</th>}
              <th>Balance TBCi</th>
              <th>{unmake ? "Withdraw" : "Rest"}</th>
              <th>{unmake ? "Available wallet" : "Deposit"}</th>
            </tr>
          </thead>
          <tbody>
            {(expanded ? rows : rows.slice(0, 10)).map((a) => (
              <tr key={a.symbol}>
                <td>
                  <AssetLabel symbol={a.symbol} />
                </td>
                <td>
                  {number(a.required)} {a.symbol}
                </td>
                {!unmake && (
                  <td
                    className={
                      state.balances[a.symbol] >= a.required ? "positive" : ""
                    }
                  >
                    {number(state.balances[a.symbol])} {a.symbol}
                  </td>
                )}
                <td>
                  <div className="component-balance">
                    <span>
                      {number(
                        calculated
                          ? unmake
                            ? (active?.remaining[a.symbol] ?? a.required)
                            : Math.min(state.balances[a.symbol], a.required)
                          : 0,
                      )}{" "}
                      {a.symbol}
                    </span>
                    <i>
                      <b
                        style={{
                          background: a.color,
                          width: calculated
                            ? (unmake
                                ? active
                                  ? ((active.remaining[a.symbol] ?? 0) /
                                      (a.required || 1)) *
                                    100
                                  : 100
                                : Math.min(
                                    100,
                                    (state.balances[a.symbol] /
                                      (a.required || 1)) *
                                      100,
                                  )) + "%"
                            : "0%",
                        }}
                      />
                    </i>
                  </div>
                </td>
                {unmake ? (
                  <>
                    <td>
                      <button
                        className="transfer-button"
                        aria-label={"Withdraw component " + a.symbol}
                        disabled={
                          !ready || (!!active && !active.remaining[a.symbol])
                        }
                        onClick={() => {
                          setComponent(a.symbol);
                          setConfirm(true);
                        }}
                      >
                        <TransferIcon out />
                        <span>Withdraw</span>
                      </button>
                    </td>
                    <td>
                      {number(state.balances[a.symbol])} {a.symbol}
                    </td>
                  </>
                ) : (
                  <>
                    <td
                      className={
                        calculated && a.required > state.balances[a.symbol]
                          ? "negative"
                          : ""
                      }
                    >
                      {number(
                        calculated
                          ? Math.max(0, a.required - state.balances[a.symbol])
                          : a.required,
                      )}{" "}
                      {a.symbol}
                    </td>
                    <td>
                      <button
                        className="transfer-button"
                        aria-label={"Deposit " + a.symbol}
                        onClick={() => setFund(a.symbol)}
                      >
                        <TransferIcon />
                        <span>Deposit</span>
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirm && (
        <Modal
          title={
            component
              ? "Withdraw " + component
              : "Confirm " + action.toLowerCase()
          }
          onClose={() => setConfirm(false)}
        >
          <p className="demo-note">
            Demo operation. Tokens are redeemed once into all 20 components.
          </p>
          {component && (
            <p>
              Receive{" "}
              {number(
                active?.remaining[component] ??
                  rows.find((a) => a.symbol === component)!.required,
              )}{" "}
              {component}. Remaining components stay available here.
            </p>
          )}
          <p>
            {action} {number(q)} TBCi. Commission: 0.5%.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button className="button" onClick={() => setConfirm(false)}>
              Cancel
            </button>
            <button
              className="button primary"
              onClick={() => {
                const failure = unmake
                  ? redeem(q, component ?? undefined)
                  : trade("compile", q);
                if (failure) {
                  setError(failure);
                  return;
                }
                notify("Demo " + action.toLowerCase() + " completed.");
                setConfirm(false);
                setCalculated(unmake);
              }}
            >
              {component
                ? "Confirm withdrawal"
                : "Confirm " + action.toLowerCase()}
            </button>
          </div>
        </Modal>
      )}
      {fund && <Funding symbol={fund} onClose={() => setFund(null)} />}
    </>
  );
}
function History() {
  const [period, setPeriod] = useState(1);
  const intervals = [
    "September 01, 2018 – October 31, 2018",
    "November 01, 2018 – December 24, 2018",
    "December 25, 2018 – December 31, 2018",
  ];
  return (
    <section className="history-comparison">
      <h2>
        Period {period + 1}: {intervals[period]}
      </h2>
      <div className="inline-actions">
        <button
          className="button blue-text"
          disabled={period === 0}
          onClick={() => setPeriod(period - 1)}
        >
          ← Previous period
        </button>
        <button
          className="button blue-text"
          disabled={period === 2}
          onClick={() => setPeriod(period + 1)}
        >
          Next period →
        </button>
      </div>
      <div className="history-tables">
        {[0, 1].map((side) => (
          <div key={side}>
            <h3>
              {side ? "End" : "Start"} price:{" "}
              <b>{side ? "$11 205" : "$10 422"}</b> &nbsp;{" "}
              <span className="blue">{side ? "124.842" : "87.842"} TBCi</span>{" "}
              {side === 1 && <span className="positive">&nbsp; +12,05%</span>}
            </h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Currency</th>
                    <th>Price of share</th>
                    <th>Value of share</th>
                    <th>Percent</th>
                  </tr>
                </thead>
                <tbody>
                  {walletSymbols.map((s, i) => {
                    const changed = i === 5;
                    const a = coin(changed && side === 1 ? "IOTA" : s);
                    return (
                      <tr
                        key={s}
                        className={changed ? "changed-composition" : ""}
                      >
                        <td>
                          <AssetLabel symbol={a.symbol} />
                        </td>
                        <td>
                          {number(17.361 * (i + 1) * (1 + (period - 1) * 0.1))}{" "}
                          {a.symbol}
                        </td>
                        <td>
                          {money(
                            (681921 / (i + 1)) * (1 + (period - 1) * 0.12),
                            0,
                          )}
                        </td>
                        <td>
                          {number(
                            [27, 14.2, 5.4, 4.5, 3.8, 2.9, 2.7, 2.4, 2.3, 2.1][
                              i
                            ],
                            1,
                          )}
                          %
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function Holders() {
  const { state, notify } = useDemo();
  const selected = findIndex(state.selectedIndex);
  const totalSupply = 140245398.2451327;
  const weightTotal = Array.from(
    { length: 212 },
    (_, i) => (i + 1) ** -1.2,
  ).reduce((s, v) => s + v, 0);
  const [page, setPage] = useState(0);
  const [all, setAll] = useState(false);
  const records = Array.from({ length: 212 }, (_, i) => ({
    address:
      "0x" +
      (BigInt("0x45261d4ee77acdb3286") + BigInt(i * 718953))
        .toString(16)
        .padStart(40, "0"),
    quantity: (totalSupply * (i + 1) ** -1.2) / weightTotal,
    share: (100 * (i + 1) ** -1.2) / weightTotal,
  }));
  const current = all
    ? records
    : page === 0
      ? records.slice(0, 12)
      : records.slice(12 + (page - 1) * 100, 12 + page * 100);
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notify("Demo address copied.");
    } catch {
      notify("Copy unavailable in this browser.");
    }
  };
  return (
    <>
      <TokenSummary />
      <section className="holder-information">
        <h2>Information</h2>
        <p>
          {selected.name} is a cryptocurrency basket index.
          <br />
          The figures and addresses shown here are demonstration data.
        </p>
        <div className="info-tables">
          {[
            [
              ["Total Supply", "140,245,398.2451327"],
              ["Index point", number(selected.points)],
              ["Price", money(selected.price, 3)],
              ["Holders", "212 demo addresses"],
              ["Contract", "Not connected — demo"],
              ["Decimals", "18"],
            ],
            [
              ["Market Volume", "$23,338,136.28"],
              ["Market Capitalization", "$375,221,919.00"],
              ["Circulating Supply", "140,245,398.00 TBCi"],
              ["Token Distribution Date", "Aug 31, 2018 (sample)"],
              ["Tokens quantity", "20"],
              ["Transfers total", "2,060,577"],
            ],
          ].map((rows, i) => (
            <table key={i}>
              <tbody>
                {rows.map(([label, value]) => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      </section>
      <section className="holders-list">
        <h2>List of all holders</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Address</th>
                <th>Quantity</th>
                <th>Percentage</th>
                <th>Equivalent</th>
              </tr>
            </thead>
            <tbody>
              {current.map((r, i) => (
                <tr key={r.address}>
                  <td>
                    {(all || page === 0 ? 0 : 12 + (page - 1) * 100) + i + 1}
                  </td>
                  <td>
                    <button
                      className="address-button"
                      onClick={() => copy(r.address)}
                      title="Copy demo address"
                    >
                      {r.address}
                    </button>
                  </td>
                  <td>{number(r.quantity, 6)}</td>
                  <td>{number(r.share, 4)}%</td>
                  <td>{money(r.quantity * TOKEN_PRICE, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button
            className="button blue-text"
            disabled={all || 12 + page * 100 >= records.length}
            onClick={() => setPage(page + 1)}
          >
            Next 100 →
          </button>
          <button
            className="button blue-text"
            disabled={all}
            onClick={() => setAll(true)}
          >
            View All
          </button>
        </div>
      </section>
    </>
  );
}
function Settings() {
  return <AccountSettings />;
}
function Help() {
  const [query, setQuery] = useState("");
  const shown = faqs.filter(([q, a]) =>
    (q + " " + a).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="faq">
      <p className="faq-intro">
        Practical answers about index operations, verification and your demo
        wallet.
      </p>
      <label className="faq-search">
        <UiIcon name="search" />
        <input
          aria-label="Search FAQ"
          type="search"
          placeholder="Search questions and answers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {shown.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <UiIcon name="chevron-down" />
          </summary>
          <p>{a}</p>
        </details>
      ))}
      {!shown.length && <p>No answers match your search.</p>}
      <p className="settings-help">
        Need to inspect your account?{" "}
        <a className="blue" href="/app/settings/">
          Open Settings
        </a>
      </p>
    </div>
  );
}
function Content({ section }: { section: Section }) {
  switch (section) {
    case "wallets":
      return <InternalWallet />;
    case "indices":
      return <Choices />;
    case "buy":
      return <MyWallet />;
    case "sell":
      return <MyWallet />;
    case "compile":
      return <Compile />;
    case "unmake":
      return <Compile unmake />;
    case "history":
      return <History />;
    case "holders":
      return <Holders />;
    case "settings":
      return <Settings />;
    case "help":
      return <Help />;
    default:
      return <MyWallet />;
  }
}
function Shell({ section }: { section: Section }) {
  const { state, message, dismiss } = useDemo();
  const [menu, setMenu] = useState(false);
  const indexed = ["compile", "unmake", "history", "holders"].includes(section);
  const title =
    pages[section] + (indexed ? " " + findIndex(state.selectedIndex).name : "");
  const active =
    section === "compile" ||
    section === "unmake" ||
    section === "buy" ||
    section === "sell"
      ? "overview"
      : section;
  return (
    <div
      className={"account-shell account-" + section}
      data-mockup={refs[section]}
    >
      <div className="mobile-account-bar">
        <a href="/">
          <Wordmark />
        </a>
        <button
          onClick={() => setMenu(!menu)}
          aria-label="Toggle account navigation"
          aria-expanded={menu}
        >
          <UiIcon name="menu" />
        </button>
      </div>
      {menu && (
        <button
          className="nav-backdrop"
          aria-label="Close account navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={"account-sidebar " + (menu ? "open" : "")}>
        <a className="sidebar-brand" href="/">
          <Wordmark />
          <small>Cryptocurrency index</small>
        </a>
        <a className="sidebar-user" href="/app/settings/">
          <UiIcon name="shield" />
          <span>
            {state.name}
            <small className="sidebar-level">
              Level {state.kyc.level} ·{" "}
              {state.kyc.level === 3
                ? "Full KYC"
                : state.kyc.level === 2
                  ? "Basic KYC"
                  : "Unverified"}
            </small>
          </span>
          <UiIcon name="chevron-right" />
        </a>
        <nav aria-label="Account navigation">
          {(
            [
              "overview",
              "wallets",
              "indices",
              "history",
              "holders",
              "help",
            ] as Section[]
          ).map((s) => (
            <a
              key={s}
              className={active === s ? "active" : ""}
              href={href(s)}
              aria-current={active === s ? "page" : undefined}
            >
              {pages[s]}
              {s === "overview" && (
                <small className="nav-description">Index portfolio</small>
              )}
              {s === "wallets" && (
                <small className="nav-description">Assets & transfers</small>
              )}
            </a>
          ))}
        </nav>
      </aside>
      <div className="account-main">
        <main className="account-canvas">
          <div className="account-page-title">
            <h1>{title}</h1>
            {indexed && (
              <a className="button choice-back" href="/app/indices/">
                ‹ &nbsp; Choice index
              </a>
            )}
          </div>
          <Content section={section} />
        </main>
        <footer className="account-footer">
          © TUGUSH, 2018. ALL RIGHTS RESERVED.
        </footer>
      </div>
      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          <button onClick={dismiss} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
export default function Account({
  section = "overview",
}: {
  section?: Section;
}) {
  return (
    <DemoProvider>
      <Shell section={section} />
    </DemoProvider>
  );
}
