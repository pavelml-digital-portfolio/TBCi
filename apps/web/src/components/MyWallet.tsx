import { useEffect, useMemo, useState } from "react";
import { useDemo } from "./DemoContext";
import {
  allIndices,
  ownedIndices,
  accountTotals,
  equivalentValue,
} from "../data/portfolio";
import { money, number, findIndex } from "../data/demo";
import { profiles } from "../data/market";
import { Sparkline } from "./Primitives";
import TradingChart from "./TradingChart";
import IndexTrade, { type TradeIntent } from "./IndexTrade";
import UiIcon from "./UiIcon";
import { VerificationAllowance } from "./Verification";
import {
  PortfolioComposition,
  MonthlyReturns,
  ExposureMap,
} from "./PortfolioCharts";
export function PortfolioActivity() {
  const { state } = useDemo();
  const rows = state.operations
    .filter((o) =>
      ["buy", "sell", "compile", "unmake", "claim"].includes(o.type),
    )
    .slice(0, 7);
  return (
    <section className="portfolio-panel portfolio-activity">
      <div className="portfolio-section-head">
        <div>
          <h2>Recent index activity</h2>
          <p>Your completed index operations across the portfolio.</p>
        </div>
        <a className="button small" href="/app/settings/#activity">
          Activity log
          <UiIcon name="chevron-right" />
        </a>
      </div>
      {rows.length ? (
        <ul>
          {rows.map((o) => (
            <li key={o.id}>
              <span className={"operation-icon " + o.type}>
                <UiIcon
                  name={
                    o.type === "sell" || o.type === "unmake"
                      ? "arrow-out"
                      : "arrow-in"
                  }
                />
              </span>
              <div>
                <strong>
                  {o.type.charAt(0).toUpperCase() + o.type.slice(1)} ·{" "}
                  {o.indexId
                    ? findIndex(o.indexId).name
                    : "Legacy index operation"}
                </strong>
                <small>
                  {new Date(o.date).toLocaleString("en-GB", {
                    timeZone: state.preferences.timezone,
                  })}
                </small>
              </div>
              <span>
                {state.preferences.hideBalances
                  ? "••••"
                  : number(o.amount, 8) + " " + o.symbol}
                <small>
                  {state.preferences.hideBalances ? "••••" : money(o.value)}
                </small>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="portfolio-empty">
          No local index trades yet. Buy an index to start your activity
          history.
        </div>
      )}
    </section>
  );
}
export default function MyWallet() {
  const { state, setPreferences, selectIndex } = useDemo();
  const [intent, setIntent] = useState<TradeIntent | null>(null),
    [selection, setSelection] = useState<string[] | null>(null),
    [group, setGroup] = useState<"assets" | "indices">("assets");
  const owned = useMemo(() => ownedIndices(state), [state.tokenBalances]);
  const totals = accountTotals(state),
    hidden = state.preferences.hideBalances;
  const positions = useMemo(
    () =>
      owned
        .filter((i) => selection === null || selection.includes(i.id))
        .map((i) => ({
          id: i.id,
          value: i.value,
          label: i.name,
          color: i.color,
          quantity: i.quantity,
        })),
    [owned, selection],
  );
  const selectedValue = positions.reduce((s, p) => s + p.value, 0);
  useEffect(() => {
    const params = new URLSearchParams(location.search),
      mode = params.get("trade");
    if (mode === "buy" || mode === "sell") {
      const id = params.get("index") ?? state.selectedIndex;
      setIntent({
        mode,
        indexId: allIndices.some((i) => i.id === id) ? id : allIndices[0].id,
      });
      history.replaceState(null, "", location.pathname);
    }
  }, []);
  const display = (value: number) =>
    hidden ? "••••" : equivalentValue(value, state.preferences.currency);
  return (
    <div className="my-wallet-dashboard">
      <div className="portfolio-intro">
        <div>
          <p className="eyebrow">INDEX PORTFOLIO</p>
          <p>
            All your purchased indices, combined analytics and trading in one
            place.
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
            onClick={() =>
              setIntent({ indexId: allIndices[0].id, mode: "buy" })
            }
          >
            <UiIcon name="plus" />
            Buy index
          </button>
        </div>
      </div>
      <div className="portfolio-totals">
        <article>
          <span>Index holdings</span>
          <strong data-value={totals.indices}>{display(totals.indices)}</strong>
          <small>{owned.length} purchased indices</small>
        </article>
        <article>
          <span>Funding wallet · available</span>
          <strong>{display(totals.available)}</strong>
          <a href="/app/wallets/">
            Deposit or withdraw
            <UiIcon name="chevron-right" />
          </a>
        </article>
        <article>
          <span>Total account value</span>
          <strong data-value={totals.total}>{display(totals.total)}</strong>
          <small>Indices + wallet + reserved funds + unclaimed assets</small>
        </article>
      </div>
      <section className="owned-index-section">
        <div className="portfolio-section-head">
          <h2>
            Your indices <span className="count-badge">{owned.length}</span>
          </h2>
          <a className="blue" href="/app/indices/">
            Explore all indices
            <UiIcon name="chevron-right" />
          </a>
        </div>
        {owned.length ? (
          <div className="owned-index-grid">
            {owned.map((i) => (
              <article
                className="owned-index-card"
                key={i.id}
                data-index={i.id}
              >
                <div className="owned-index-top">
                  <span
                    className="index-mark"
                    style={{ background: i.color + "18", color: i.color }}
                  >
                    TBCi
                  </span>
                  <span className="settings-badge">
                    {profiles[i.id]?.risk} risk
                  </span>
                </div>
                <h3>{i.name}</h3>
                <div className="owned-index-balance">
                  <strong>
                    {hidden ? "••••" : number(i.quantity, 8)}{" "}
                    <small>TBCi</small>
                  </strong>
                  <span>{display(i.value)}</span>
                </div>
                <Sparkline instrument={i.id} />
                <div className="owned-index-meta">
                  <span>Unit price {money(i.price, 3)}</span>
                  <span>
                    {(i.value / (totals.indices || 1)) * 100 < 0.1
                      ? "<0.1"
                      : number((i.value / (totals.indices || 1)) * 100, 1)}
                    % of indices
                  </span>
                </div>
                <div className="owned-index-actions">
                  <button
                    className="button primary"
                    aria-label={"Buy " + i.name}
                    onClick={() => setIntent({ indexId: i.id, mode: "buy" })}
                  >
                    Buy
                  </button>
                  <button
                    className="button"
                    aria-label={"Sell " + i.name}
                    onClick={() => setIntent({ indexId: i.id, mode: "sell" })}
                  >
                    Sell
                  </button>
                  <details>
                    <summary aria-label={"More options for " + i.name}>
                      •••
                    </summary>
                    <div className="dropdown">
                      <a href={"/index/" + i.id + "/"}>Index information</a>
                      <a href="/app/compile/" onClick={() => selectIndex(i.id)}>
                        Compile
                      </a>
                      <a href="/app/unmake/" onClick={() => selectIndex(i.id)}>
                        Unmake / claim
                      </a>
                    </div>
                  </details>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="portfolio-empty">
            <h3>Your first index starts here</h3>
            <p>
              Choose any index and purchase it using the available wallet
              balance.
            </p>
            <button
              className="button primary"
              onClick={() =>
                setIntent({ indexId: allIndices[0].id, mode: "buy" })
              }
            >
              Buy your first index
            </button>
          </div>
        )}
      </section>
      <VerificationAllowance />
      <section
        className="portfolio-filter-panel"
        aria-label="Portfolio analytics filters"
      >
        <div className="portfolio-section-head">
          <div>
            <h2>Portfolio analytics</h2>
            <p>
              {selection === null
                ? "All purchased indices"
                : positions.length +
                  " of " +
                  owned.length +
                  " indices selected"}{" "}
              · {display(selectedValue)}
            </p>
          </div>
          <button className="button small" onClick={() => setSelection(null)}>
            Show all indices
          </button>
        </div>
        <div className="portfolio-filter-chips">
          {owned.map((i) => (
            <label key={i.id}>
              <input
                type="checkbox"
                checked={selection === null || selection.includes(i.id)}
                onChange={(e) => {
                  const next = selection ?? owned.map((a) => a.id);
                  setSelection(
                    e.target.checked
                      ? [...next, i.id]
                      : next.filter((id) => id !== i.id),
                  );
                }}
              />
              <span className="legend-dot" style={{ background: i.color }} />
              {i.name}
            </label>
          ))}
        </div>
      </section>
      <PortfolioComposition
        positions={positions}
        view={group}
        onView={setGroup}
        hidden={hidden}
      />
      <section className="portfolio-panel portfolio-history">
        <div className="portfolio-section-head">
          <div>
            <h2>Selected portfolio value</h2>
            <p>
              Current quantities revalued through simulated 2018 prices. This is
              a model, not personal trading profit.
            </p>
          </div>
          <span className="settings-badge">Area / line / candles</span>
        </div>
        {positions.length && !hidden ? (
          <TradingChart
            instrument="portfolio"
            portfolio={positions}
            height={310}
          />
        ) : (
          <div className="portfolio-empty">
            {hidden
              ? "Show balances to view the value chart."
              : "Select at least one index to display the model."}
          </div>
        )}
      </section>
      <div className="portfolio-chart-grid">
        <MonthlyReturns positions={positions} hidden={hidden} />
        <ExposureMap positions={positions} hidden={hidden} />
      </div>
      <PortfolioActivity />
      <p className="portfolio-footnote">
        Demo balances · static prices as of 31 Dec 2018 · no real funds,
        execution or investment return.
      </p>
      {intent && <IndexTrade {...intent} onClose={() => setIntent(null)} />}
    </div>
  );
}
