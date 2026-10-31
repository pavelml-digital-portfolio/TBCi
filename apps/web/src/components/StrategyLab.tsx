import { useEffect, useMemo, useState } from "react";
import { allIndices } from "../data/portfolio";
import { profiles } from "../data/market";
import { money, number } from "../data/demo";
import { backtest, stressLoss, mean } from "../data/strategy-lab";
import { ComparisonChart } from "./TradingChart";
import { useDemo } from "./DemoContext";

export default function StrategyLab() {
  const { state, selectIndex } = useDemo();
  const [id, setId] = useState(state.selectedIndex),
    [days, setDays] = useState(365),
    [initial, setInitial] = useState(10000),
    [fee, setFee] = useState(0.5),
    [rebalance, setRebalance] = useState(30);
  const [settingsOpen, setSettingsOpen] = useState(true);
  useEffect(() => setSettingsOpen(innerWidth >= 768), []);
  const [shock, setShock] = useState(30),
    [target, setTarget] = useState("all");
  useEffect(() => {
    const requested = new URLSearchParams(location.search).get("index");
    if (requested && allIndices.some((a) => a.id === requested)) {
      setId(requested);
      selectIndex(requested);
    }
  }, []);
  const result = useMemo(
    () => backtest(id, { days, initial, fee, rebalance }),
    [id, days, initial, fee, rebalance],
  );
  const index = allIndices.find((i) => i.id === id)!;
  const losses = stressLoss(result.components, shock, target, result.final),
    loss = losses.reduce((s, a) => s + a.loss, 0);
  const largest = [...result.components].sort((a, b) => b.weight - a.weight);
  const liquidDays = Math.max(
    ...result.liquidity.map((a) =>
      a.capacity ? (result.final * a.weight) / 100 / a.capacity : 0,
    ),
  );
  return (
    <div className="strategy-lab">
      <section className="lab-intro">
        <span className="mini-donut" aria-hidden="true" />
        <div>
          <strong className="lab-index-name">{index.name}</strong>
          <p>{profiles[id]?.description}</p>
          <span>
            {money(index.price, 3)} per token · {result.components.length}{" "}
            basket components
          </span>{" "}
          ·{" "}
          <a className="blue" href={"/index/" + id + "/"}>
            Index information
          </a>
        </div>
      </section>
      <details
        className="lab-settings"
        open={settingsOpen}
        onToggle={(e) => setSettingsOpen(e.currentTarget.open)}
      >
        <summary>Backtest settings</summary>
        <div className="lab-controls">
          <label>
            Period
            <select
              aria-label="Backtest period"
              value={days}
              onChange={(e) => setDays(+e.target.value)}
            >
              <option value="90">Last 90 days of 2018</option>
              <option value="180">Last 180 days of 2018</option>
              <option value="365">Full year 2018</option>
            </select>
          </label>
          <label>
            Initial amount (USD)
            <input
              aria-label="Initial amount"
              type="number"
              min="1"
              max="1000000000"
              value={initial}
              onChange={(e) => setInitial(+e.target.value)}
            />
          </label>
          <label>
            Trading fee (%)
            <input
              aria-label="Trading fee"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={fee}
              onChange={(e) => setFee(+e.target.value)}
            />
          </label>
          <label>
            Rebalance
            <select
              aria-label="Rebalance rule"
              value={rebalance}
              onChange={(e) => setRebalance(+e.target.value)}
            >
              <option value="0">Buy and hold</option>
              <option value="7">Every 7 days</option>
              <option value="30">Every 30 days</option>
              <option value="90">Every 90 days</option>
            </select>
          </label>
        </div>
        <p>
          Close-to-close research estimates using the available 2018 component
          series. Entry, liquidation and both sides of rebalance turnover
          include the selected fee. Target weights come from the current basket;
          slippage, taxes and changing constituents are excluded.
        </p>
      </details>
      <div className="lab-metrics">
        {[
          ["Final value", money(result.final)],
          ["Return after costs", number(result.netReturn, 2) + "%"],
          ["Maximum drawdown", number(result.maxDrawdown, 2) + "%"],
          ["Annual volatility", number(result.volatility, 2) + "%"],
          ["Total fees", money(result.fees)],
          ["BTC return after costs", number(result.btcReturn, 2) + "%"],
        ].map(([label, value]) => (
          <section key={label}>
            <small>{label}</small>
            <strong data-testid={label}>{value}</strong>
          </section>
        ))}
      </div>
      <section className="lab-panel">
        <h2>Strategy vs BTC</h2>
        <p>
          Equal starting capital · BTC includes the same entry and exit fee.
        </p>
        <ComparisonChart points={result.points} label={index.name} />
      </section>
      <section className="lab-panel">
        <h2>Drawdown from peak</h2>
        <ComparisonChart points={result.points} label={index.name} drawdown />
      </section>
      <section className="lab-panel">
        <h2>Rebalance journal</h2>
        <p>
          Entry fee:{" "}
          {money((result.initial * Math.min(5, Math.max(0, fee))) / 100)}. Final
          liquidation is included in final value and total fees.
        </p>
        {result.log.length ? (
          <div className="lab-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Traded notional</th>
                  <th>Fee</th>
                  <th>Value after fee</th>
                </tr>
              </thead>
              <tbody>
                {result.log.map((l) => (
                  <tr key={l.date}>
                    <td>{l.date}</td>
                    <td>{money(l.turnover)}</td>
                    <td>{money(l.fee)}</td>
                    <td>{money(l.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No rebalances under Buy and hold.</p>
        )}
      </section>
      <section className="lab-panel">
        <h2>Stress scenarios</h2>
        <div className="lab-controls">
          <label>
            Shock target
            <select
              aria-label="Shock target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="all">Entire market</option>
              {result.components.map((a) => (
                <option key={a.symbol}>{a.symbol}</option>
              ))}
            </select>
          </label>
          <label>
            Price decline: {shock}%
            <input
              aria-label="Price decline"
              type="range"
              min="0"
              max="100"
              value={shock}
              onChange={(e) => setShock(+e.target.value)}
            />
          </label>
        </div>
        <p>
          Applied to the final portfolio at target weights; other assets remain
          unchanged.
        </p>
        <div className="lab-metrics">
          <section>
            <small>Index loss</small>
            <strong data-testid="stress-loss">
              {money(loss)} ({number((loss / result.final) * 100, 2)}%)
            </strong>
          </section>
          <section>
            <small>Value after shock</small>
            <strong>{money(result.final - loss)}</strong>
          </section>
        </div>
        <h3>Main loss contributions</h3>
        {losses
          .filter((a) => a.loss > 0)
          .slice(0, 5)
          .map((a) => (
            <div className="lab-loss" key={a.symbol}>
              <span>{a.symbol}</span>
              <meter min="0" max={loss || 1} value={a.loss} />
              <span>
                {money(a.loss)} · {number((a.loss / (loss || 1)) * 100, 1)}%
              </span>
            </div>
          ))}
        {!loss && <p>No loss at the selected shock.</p>}
      </section>
      <section className="lab-panel">
        <h2>Risk analysis</h2>
        <div className="lab-metrics">
          <section>
            <small>Largest component</small>
            <strong>
              {largest[0].symbol} · {number(largest[0].weight, 1)}%
            </strong>
          </section>
          <section>
            <small>Top 3 concentration</small>
            <strong>
              {number(
                largest.slice(0, 3).reduce((s, a) => s + a.weight, 0),
                1,
              )}
              %
            </strong>
          </section>
          <section>
            <small>Effective diversification</small>
            <strong>{number(result.effective, 1)} assets</strong>
          </section>
          <section>
            <small>Average pair correlation</small>
            <strong>{number(mean(result.pairs.map((p) => p.value)), 2)}</strong>
          </section>
        </div>
        <p>
          Effective asset count is 1 / sum of squared weights (HHI{" "}
          {number(result.hhi, 3)}). More components may still share market and
          liquidity risks.
        </p>
        <h3>Strongest component correlations</h3>
        <div className="lab-table">
          <table>
            <thead>
              <tr>
                <th>Pair</th>
                <th>Daily return correlation</th>
              </tr>
            </thead>
            <tbody>
              {[...result.pairs]
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((p) => (
                  <tr key={p.a + p.b}>
                    <td>
                      {p.a} / {p.b}
                    </td>
                    <td>{number(p.value, 2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <h3>Liquidity estimate</h3>
        <p>
          {number(liquidDays, 2)} trading days to exit the slowest component at
          1% of its trailing 30-day quoted dollar volume. This capacity estimate
          assumes stable volume and excludes market impact.
        </p>
        <h3>Main risk factors</h3>
        <ul>
          <li>
            {largest[0].symbol} has the largest impact on basket performance.
          </li>
          <li>
            Shared cryptocurrency market exposure can increase losses across
            components.
          </li>
          <li>
            Rebalancing adds turnover costs; lower liquidity can increase
            execution time.
          </li>
        </ul>
        <a className="blue" href="/app/history/">
          Historical price
        </a>{" "}
        ·{" "}
        <a className="blue" href="/app/holders/">
          Holders
        </a>
      </section>
    </div>
  );
}
