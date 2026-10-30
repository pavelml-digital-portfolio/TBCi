import { useEffect, useRef, useState, type ReactNode } from "react";
import { basket, assets, coin, findIndex, money, number } from "../data/demo";
import { useDemo } from "./DemoContext";
import TradingChart from "./TradingChart";
import { seriesFor, hash, random } from "../data/market";
export function Wordmark() {
  return (
    <span className="wordmark">
      TBC<span>i</span>
    </span>
  );
}
export function CryptoIcon({
  symbol,
  size = 30,
}: {
  symbol: string;
  size?: number;
}) {
  return [
    "BTC",
    "XRP",
    "ETH",
    "BCH",
    "EOS",
    "IOTA",
    "ETC",
    "QTUM",
    "ZIL",
    "LTC",
    "NEO",
    "XMR",
    "ADA",
    "DASH",
    "XLM",
    "TRX",
    "BNB",
    "USDT",
    "LINK",
    "ZEC",
    "USD",
  ].includes(symbol) ? (
    <img
      className="crypto-icon"
      src={"/coins/svg/" + symbol + ".svg"}
      alt=""
      width={size}
      height={size}
    />
  ) : (
    <span
      className="coin-fallback"
      style={{ width: size, height: size, color: "#218dff" }}
      aria-hidden="true"
    >
      ◉
    </span>
  );
}
export function AssetLabel({
  symbol,
  ticker = false,
}: {
  symbol: string;
  ticker?: boolean;
}) {
  const a = coin(symbol);
  return (
    <span className="asset-label">
      <CryptoIcon symbol={symbol} />
      <span>
        {a.name}
        {ticker && <small>{a.symbol}</small>}
      </span>
    </span>
  );
}
export function TransferIcon({ out = false }: { out?: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      {out ? (
        <>
          <path d="M4 4h6M4 4v16h13v-5M8 10h13m-5-5 5 5-5 5" />
        </>
      ) : (
        <>
          <path d="M4 12v8h16v-8M12 2v13m-5-5 5 5 5-5" />
        </>
      )}
    </svg>
  );
}
export function Sparkline({
  negative = false,
  instrument = "BTC",
}: {
  negative?: boolean;
  instrument?: string;
}) {
  const rnd = random(hash(instrument));
  const base = seriesFor(instrument)
    .slice(-30)
    .map((b) => b.close);
  const lo = Math.min(...base),
    hi = Math.max(...base);
  const points = base.map((v, i) => [
    (i / (base.length - 1)) * 180,
    45 - ((v - lo) / (hi - lo || 1)) * 35 + (rnd() - 0.5) * 2,
  ]);
  const path = points
    .map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1))
    .join(" ");
  return (
    <svg
      className={"sparkline " + (negative ? "negative-line" : "")}
      viewBox="0 0 180 55"
      aria-hidden="true"
      data-instrument={instrument}
    >
      <path d={path + "L180 55H0Z"} fill="currentColor" opacity=".1" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
export function CurrencyButtons({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="currency-buttons" aria-label="Currency equivalent">
      {["USD", "BTC", "ETH"].map((v) => (
        <button key={v} aria-pressed={v === value} onClick={() => onChange(v)}>
          {v}
        </button>
      ))}
      <span>⌄</span>
    </div>
  );
}
export function Chart({
  hero = false,
  multi = false,
  signed = false,
  height = 390,
  instrument = "tbci-20-stable",
}: {
  hero?: boolean;
  multi?: boolean;
  signed?: boolean;
  line?: boolean;
  compact?: boolean;
  height?: number;
  instrument?: string;
}) {
  return (
    <TradingChart
      hero={hero}
      compare={multi}
      signed={signed}
      height={hero ? 225 : height}
      instrument={instrument}
    />
  );
}
export function CoinChart({ instrument = "BTC" }: { instrument?: string }) {
  return <TradingChart height={390} instrument={instrument} compare />;
}
export function Composition({
  wallet = false,
  total = 55537,
  balances,
  indexId = "tbci-20-stable",
}: {
  wallet?: boolean;
  total?: number;
  balances?: Record<string, number>;
  indexId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const components =
    wallet && balances
      ? assets
          .filter((a) => a.symbol !== "TBCi")
          .map((a) => ({
            ...a,
            weight: ((balances[a.symbol] * a.price) / (total || 1)) * 100,
          }))
      : basket;
  const [hover, setHover] = useState<string | null>(null);
  let cursor = 0;
  const gradient = components
    .map((a) => {
      const start = cursor;
      cursor += a.weight;
      return a.color + " " + start + "% " + cursor + "%";
    })
    .join(",");
  const shown = wallet && !expanded ? components.slice(0, 10) : components;
  return (
    <div
      className={
        "composition " + (wallet ? "wallet-composition" : "index-composition")
      }
    >
      <div className="donut-wrap">
        <div
          className="donut"
          style={{ background: "conic-gradient(" + gradient + ")" }}
          role="img"
          aria-label={
            wallet
              ? "Wallet asset composition"
              : "Index sample composition, 20 assets"
          }
        >
          <div className="donut-hole">
            <strong>
              {wallet ? money(total, 0) : findIndex(indexId).name}
            </strong>
            <span>{wallet ? "Total balance" : "Sample basket"}</span>
          </div>
        </div>
        {hover && (
          <div className="composition-tooltip">
            {coin(hover).name}{" "}
            <strong>
              {number(
                components.find((a) => a.symbol === hover)?.weight ?? 0,
                2,
              )}
              %
            </strong>
          </div>
        )}
      </div>
      <div className="composition-tables">
        {(wallet ? [shown] : [shown.slice(0, 10), shown.slice(10)])
          .filter((a) => a.length)
          .map((list, i) => (
            <table key={i}>
              <thead>
                <tr>
                  <th>Currency</th>
                  <th>{wallet ? "Percentage" : "Weight"}</th>
                  {wallet && (
                    <>
                      <th>Balance</th>
                      <th>Equivalent</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr
                    key={a.symbol}
                    onMouseEnter={() => setHover(a.symbol)}
                    onMouseLeave={() => setHover(null)}
                    className={hover === a.symbol ? "row-hover" : ""}
                  >
                    <td>
                      <span
                        className="legend-dot"
                        style={{ background: a.color }}
                      />
                      {a.symbol} <span className="subtle">{a.name}</span>
                    </td>
                    <td>{number(a.weight, 1)}%</td>
                    {wallet && (
                      <>
                        <td>
                          {number(
                            balances?.[a.symbol] ??
                              (total * a.weight) / 100 / a.price,
                          )}{" "}
                          {a.symbol}
                        </td>
                        <td>{money((total * a.weight) / 100)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
      </div>
      {wallet && (
        <button
          className="button small composition-expand"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? "Show fewer assets"
            : "View all " + components.length + " assets"}
        </button>
      )}
    </div>
  );
}
export function Formula() {
  return (
    <div className="formula">
      <span>
        TBCI 20<sub>t+1</sub> ={" "}
      </span>
      <span className="fraction">
        <span>
          ∑<sup>n</sup>
          <sub>i+1</sub> P<sub>t+1</sub>Q<sub>t+1</sub>
        </span>
        <span>
          D<sub>t</sub>
        </span>
      </span>
      <span> = </span>
      <span className="fraction">
        <span>
          ∑<sup>n</sup>
          <sub>i+1</sub> M<sub>t+1</sub>
        </span>
        <span>
          D<sub>t</sub>
        </span>
      </span>
    </div>
  );
}
export function Methodology() {
  return (
    <section className="methodology">
      <h2>Design and calculation methodology</h2>
      <p>
        Data for computation of our designed TBC 20 Crypto Index is sourced from
        coinmarketcap.com resources. Straightforward calculation of the index,
        measuring value of change of total market capitalization of our basket
        of cryptocurrencies for 24 hours, would result in weird impractical
        values of often up to several billions.
      </p>
      <p>
        That is why we have followed a commonplace solution in this field and
        defined a proprietary first-day number for our index, as 100. Dividing
        total market capitalization of index constituents by our first-day
        number, we have found our common divisor that we will apply going
        forward, until modifications are required. Continuity of index
        computations is assured by adjusting the divisor in case any
        cryptocurrency undergoes forks or changes its value drastically due to
        any other technological or market circumstances.
      </p>
      <div className="formula-description">
        <Formula />
        <dl>
          <dt>TBCI 20</dt>
          <dd>Tugush Blockchain Capital 20 Crypto Index</dd>
          <dt>
            P<sub>t+1</sub>
          </dt>
          <dd>Price of cryptocurrency at the current moment</dd>
          <dt>
            Q<sub>t+1</sub>
          </dt>
          <dd>Quantity of cryptocurrency in circulation</dd>
          <dt>
            D<sub>t</sub>
          </dt>
          <dd>Divisor defined at the first day of index creation</dd>
          <dt>
            M<sub>t+1</sub>
          </dt>
          <dd>Market capitalization at the current moment</dd>
        </dl>
      </div>
    </section>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>
      </header>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function Funding({
  symbol,
  withdraw = false,
  onClose,
}: {
  symbol: string;
  withdraw?: boolean;
  onClose: () => void;
}) {
  const { state, fund, notify } = useDemo();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  return (
    <Modal
      title={(withdraw ? "Withdraw " : "Deposit ") + symbol}
      onClose={onClose}
    >
      <p className="demo-note">
        Demonstration balance. No real transfer will be made.
      </p>
      <p>
        Available: {number(state.balances[symbol])} {symbol}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const error = fund(symbol, Number(amount), withdraw);
          if (error) {
            setError(error);
            return;
          }
          notify(
            "Demo " + (withdraw ? "withdrawal" : "deposit") + " completed.",
          );
          onClose();
        }}
      >
        <label htmlFor="fund-amount">Amount, {symbol}</label>
        <input
          id="fund-amount"
          type="number"
          min="0.00000001"
          step="any"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {withdraw && (
          <>
            <label htmlFor="withdraw-address">Receiving address</label>
            <input
              id="withdraw-address"
              required
              minLength={6}
              placeholder="Demo address"
            />
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit">
            {withdraw ? "Confirm withdrawal" : "Deposit balance"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
