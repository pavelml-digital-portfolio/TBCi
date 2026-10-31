import { indexBasket } from "../data/portfolio";
import InteractiveDonut from "./InteractiveDonut";
import WalletTransfer from "./WalletTransfer";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { assets, coin, findIndex, money, number } from "../data/demo";
import TradingChart from "./TradingChart";
import { seriesFor } from "../data/market";
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
  const rows = seriesFor(instrument).slice(-30);
  const lo = Math.min(...rows.map((b) => b.close)),
    hi = Math.max(...rows.map((b) => b.close));
  const [point, setPoint] = useState<number | null>(null);
  const coords = rows.map((b, i) => [
    (i / (rows.length - 1)) * 180,
    45 - ((b.close - lo) / (hi - lo || 1)) * 35,
  ]);
  const path = coords.map((p, i) => (i ? "L" : "M") + p.join(" ")).join(" ");
  const show = (x: number) =>
    setPoint(
      Math.max(0, Math.min(rows.length - 1, Math.round(x * (rows.length - 1)))),
    );
  return (
    <div
      className={
        "sparkline interactive-sparkline " + (negative ? "negative-line" : "")
      }
      data-instrument={instrument}
      tabIndex={0}
      role="group"
      aria-label={
        instrument + " · 30-day sample history. Use arrow keys to inspect."
      }
      onPointerMove={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        show((e.clientX - box.left) / box.width);
      }}
      onPointerLeave={() => setPoint(null)}
      onFocus={() => setPoint(rows.length - 1)}
      onBlur={() => setPoint(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          setPoint(
            Math.max(
              0,
              Math.min(
                rows.length - 1,
                (point ?? rows.length - 1) + (e.key === "ArrowRight" ? 1 : -1),
              ),
            ),
          );
        }
        if (e.key === "Escape") setPoint(null);
      }}
    >
      <svg viewBox="0 0 180 55" aria-hidden="true">
        <path d={path + "L180 55H0Z"} fill="currentColor" opacity=".1" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.8" />
        {point !== null && (
          <>
            <line
              x1={coords[point][0]}
              x2={coords[point][0]}
              y1="0"
              y2="55"
              stroke="currentColor"
              strokeDasharray="2 2"
            />
            <circle
              cx={coords[point][0]}
              cy={coords[point][1]}
              r="3"
              fill="currentColor"
            />
          </>
        )}
      </svg>
      {point !== null && (
        <span className="sparkline-tooltip" role="status">
          {new Date(rows[point].time * 1000).toISOString().slice(0, 10)} ·{" "}
          {number(rows[point].close, 3)}
        </span>
      )}
    </div>
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
  const [expanded, setExpanded] = useState(false),
    [hover, setHover] = useState<string | null>(null),
    [selected, setSelected] = useState<string | null>(null);
  const components =
    wallet && balances
      ? assets
          .filter((a) => a.symbol !== "TBCi")
          .map((a) => ({
            ...a,
            weight:
              (((balances[a.symbol] || 0) * a.price) / (total || 1)) * 100,
          }))
      : indexBasket(indexId);
  const shown = wallet && !expanded ? components.slice(0, 10) : components;
  const active = hover || selected;
  return (
    <div
      className={
        "composition " + (wallet ? "wallet-composition" : "index-composition")
      }
    >
      <div className="donut-wrap">
        <InteractiveDonut
          items={components.map((a) => ({
            id: a.symbol,
            label: a.symbol + " · " + a.name,
            value: a.weight,
            color: a.color,
            detail: wallet
              ? money((balances?.[a.symbol] || 0) * a.price)
              : "Sample basket weight",
          }))}
          title={wallet ? money(total, 0) : findIndex(indexId).name}
          subtitle={wallet ? "Total balance" : "Sample basket"}
          active={hover}
          selected={selected}
          onActive={setHover}
          onSelect={setSelected}
        />
        <p className="infographic-help">
          Hover to inspect · select a segment or currency
        </p>
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
                    onPointerEnter={() => setHover(a.symbol)}
                    onPointerLeave={() => setHover(null)}
                    className={active === a.symbol ? "row-hover" : ""}
                  >
                    <td>
                      <button
                        className="composition-legend-button"
                        aria-pressed={selected === a.symbol}
                        onFocus={() => setHover(a.symbol)}
                        onBlur={() => setHover(null)}
                        onClick={() =>
                          setSelected(selected === a.symbol ? null : a.symbol)
                        }
                      >
                        <span
                          className="legend-dot"
                          style={{ background: a.color }}
                        />
                        {a.symbol} <span className="subtle">{a.name}</span>
                      </button>
                    </td>
                    <td>{number(a.weight, 1)}%</td>
                    {wallet && (
                      <>
                        <td>
                          {number(balances?.[a.symbol] ?? 0)} {a.symbol}
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
  return (
    <WalletTransfer symbol={symbol} withdraw={withdraw} onClose={onClose} />
  );
}
