import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { basket, coin, money, number } from "../data/demo";
import { useDemo } from "./DemoContext";
import sourceSeries from "../data/chart-series.json";
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
  const local = [
    "BTC",
    "ETH",
    "XRP",
    "BCH",
    "EOS",
    "XLM",
    "LTC",
    "ADA",
    "XMR",
    "USDT",
    "USD",
  ];
  return local.includes(symbol) ? (
    <img
      className="crypto-icon"
      src={"/coins/" + symbol + ".png"}
      alt=""
      width={size}
      height={size}
    />
  ) : (
    <span
      className="coin-fallback"
      style={{ width: size, height: size, color: coin(symbol).color }}
      aria-hidden="true"
    >
      {symbol === "TBCi" ? "◉" : symbol.slice(0, 1)}
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
export function Sparkline({ negative = false }: { negative?: boolean }) {
  return (
    <svg
      className={"sparkline " + (negative ? "negative-line" : "")}
      viewBox="0 0 180 55"
      aria-hidden="true"
    >
      <path
        d="M0 14 8 7 16 18 25 12 34 19 45 15 54 10 64 8 73 18 84 15 95 21 105 18 114 24 126 16 137 26 147 23 157 36 169 29 180 32L180 55H0Z"
        fill="currentColor"
        opacity=".1"
      />
      <path
        d="M0 14 8 7 16 18 25 12 34 19 45 15 54 10 64 8 73 18 84 15 95 21 105 18 114 24 126 16 137 26 147 23 157 36 169 29 180 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
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
  line = false,
  signed = false,
  compact = false,
  height = 390,
}: {
  hero?: boolean;
  multi?: boolean;
  line?: boolean;
  signed?: boolean;
  compact?: boolean;
  height?: number;
}) {
  const [period, setPeriod] = useState("1Y");
  const [at, setAt] = useState<number | null>(null);
  const [series, setSeries] = useState("TBCi-20");
  const [compares, setCompares] = useState(["BTC"]);
  const [add, setAdd] = useState("");
  const id = useId().replaceAll(":", "");
  const base = signed
    ? sourceSeries.coinBlue
    : hero
      ? sourceSeries.hero
      : multi
        ? sourceSeries.overview
        : sourceSeries.wallet;
  const factor =
    period === "1Y" || period === "All"
      ? 1
      : period === "LIVE"
        ? 0.74
        : period === "1W"
          ? 0.82
          : 0.9;
  const data = base.map((v, i) =>
    signed
      ? v * factor
      : Math.max(
          12,
          v *
            factor *
            (series === "TBCi-20" ? 1 : series === "TBCi-10" ? 0.9 : 1.1) +
            (period === "1Y" || period === "All" ? 0 : Math.sin(i * 0.7) * 25),
        ),
  );
  const width = 1100,
    H = height - (compact ? 10 : 45);
  const coords = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    H - (v / (signed ? 1 : multi ? 800 : 750)) * H,
  ]);
  const path = coords
    .map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1))
    .join(" ");
  return (
    <div
      className={
        "reference-chart " +
        (hero ? "hero-chart " : "") +
        (compact ? "compact-chart" : "") +
        (signed ? " signed-chart" : "")
      }
      style={{ "--chart-height": height + "px" } as React.CSSProperties}
    >
      {!hero && !compact && (
        <div className="chart-tools">
          <div className="chart-series">
            {multi && !signed ? (
              <>
                <select
                  aria-label="Main chart series"
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                >
                  <option>TBCi-20</option>
                  <option>TBCi-10</option>
                  <option>TBCi-50</option>
                </select>
                {compares.map((v, i) => (
                  <button
                    key={v}
                    className={
                      "compare-chip " + (i ? "series-green" : "series-yellow")
                    }
                    aria-label={"Remove " + v + " comparison"}
                    onClick={() => setCompares(compares.filter((c) => c !== v))}
                  >
                    ● {v} ×
                  </button>
                ))}
                <input
                  aria-label="Add coins to comparison"
                  placeholder="Add coins"
                  list={"chart-coins" + id}
                  value={add}
                  onChange={(e) => setAdd(e.target.value)}
                />
                <datalist id={"chart-coins" + id}>
                  {["ETH", "BTC", "LTC"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </datalist>
                <button
                  className="add-series"
                  aria-label="Add comparison"
                  disabled={
                    !["ETH", "BTC", "LTC"].includes(add.toUpperCase()) ||
                    compares.includes(add.toUpperCase())
                  }
                  onClick={() => {
                    setCompares([...compares, add.toUpperCase()]);
                    setAdd("");
                  }}
                >
                  +
                </button>
              </>
            ) : (
              <>
                <span className="series-blue">●</span>
                {signed ? "BTC" : line ? "Price" : "TBCi-20"}
                {signed && <span className="series-yellow">● ETH</span>}
              </>
            )}
          </div>
          <div className="chart-periods" aria-label="Chart period">
            {["LIVE", "1W", "1M", "3M", "6M", "1Y", "2Y", "All"].map((p) => (
              <button
                key={p}
                aria-pressed={p === period}
                onClick={() => {
                  setPeriod(p);
                  setAt(null);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
      <div
        className="chart-viewport"
        tabIndex={0}
        aria-label="Interactive price chart. Use left and right arrows."
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            setAt((v) =>
              Math.max(
                0,
                Math.min(
                  data.length - 1,
                  (v ?? Math.floor(data.length * 0.65)) +
                    (e.key === "ArrowLeft" ? -1 : 1),
                ),
              ),
            );
          }
        }}
        onMouseLeave={() => setAt(null)}
      >
        {!hero && (
          <div className="chart-axis">
            {(signed
              ? [2, 1, 0, -1, -2, -3, -4]
              : multi
                ? [800, 700, 600, 500, 400, 300, 200, 100, 0]
                : [700, 600, 500, 400, 300, 200, 100, 0]
            ).map((n) => (
              <span key={n}>{n + "%"}</span>
            ))}
          </div>
        )}
        <svg
          viewBox={"0 0 " + width + " " + H}
          preserveAspectRatio="none"
          role="img"
          aria-label="Illustrative historical price chart"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setAt(
              Math.max(
                0,
                Math.min(
                  data.length - 1,
                  Math.round(
                    ((e.clientX - r.left) / r.width) * (data.length - 1),
                  ),
                ),
              ),
            );
          }}
        >
          <defs>
            <linearGradient id={"area" + id} x1="0" y1="0" x2="0" y2="1">
              <stop
                stopColor={hero ? "#304f78" : "#aad8f8"}
                stopOpacity={hero ? ".7" : ".65"}
              />
              <stop
                offset="1"
                stopColor={hero ? "#233959" : "#d9ecfb"}
                stopOpacity=".6"
              />
            </linearGradient>
          </defs>
          {!hero &&
            Array.from({ length: signed ? 7 : multi ? 9 : 8 }, (_, n) => (
              <line
                key={n}
                x1="0"
                x2={width}
                y1={(n * H) / (signed ? 6 : multi ? 8 : 7)}
                y2={(n * H) / (signed ? 6 : multi ? 8 : 7)}
                stroke="#e6e6e9"
                strokeWidth="1"
              />
            ))}
          {!signed && (
            <path
              d={path + "L" + width + "," + H + "L0," + H + "Z"}
              fill={"url(#area" + id + ")"}
            />
          )}
          {signed && (
            <path
              d={sourceSeries.coinYellow
                .map(
                  (v, i) =>
                    (i ? "L" : "M") +
                    (
                      (i / (sourceSeries.coinYellow.length - 1)) *
                      width
                    ).toFixed(1) +
                    "," +
                    (H - v * factor * H).toFixed(1),
                )
                .join(" ")}
              fill="none"
              stroke="#e6cf7b"
              strokeWidth="1.4"
            />
          )}
          {multi &&
            !signed &&
            compares.map((v, k) => (
              <path
                key={v}
                data-comparison={v}
                d={
                  coords
                    .map(
                      (p, i) =>
                        (i ? "L" : "M") +
                        p[0].toFixed(1) +
                        "," +
                        (
                          H -
                          ((sourceSeries.overviewYellow[i] * factor) / 800) *
                            H +
                          k * 20 +
                          (series === "TBCi-20" ? 0 : 20)
                        ).toFixed(1),
                    )
                    .join(" ") +
                  "L" +
                  width +
                  "," +
                  H +
                  "L0," +
                  H +
                  "Z"
                }
                fill={k ? "#96d6b5" : "#f5cd88"}
                opacity=".5"
                stroke={k ? "#61aa92" : "#e1c582"}
                strokeWidth="1"
              />
            ))}
          <path
            d={path}
            fill="none"
            stroke={hero ? "#3c5c83" : "#7abfed"}
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
          />
          {at !== null && (
            <>
              <line
                x1={coords[at][0]}
                x2={coords[at][0]}
                y1="0"
                y2={H}
                stroke={hero ? "#2dabff" : "#ddd"}
              />
              <circle
                cx={coords[at][0]}
                cy={coords[at][1]}
                r="4"
                fill="#248fff"
                stroke="white"
              />
            </>
          )}
        </svg>
        {at !== null && (
          <div
            className="chart-tooltip"
            style={{
              left:
                Math.max(8, Math.min(80, (at / (data.length - 1)) * 100)) + "%",
              top: Math.max(8, Math.min(70, (coords[at][1] / H) * 100)) + "%",
            }}
          >
            {signed ? "BTC" : hero ? "TBCi" : "Total balance"}
            <strong>
              {signed
                ? number(data[at] * 6 - 4, 2) + "%"
                : hero
                  ? number(data[at] / 7, 3)
                  : money(data[at] * 76, 0)}
            </strong>
          </div>
        )}
      </div>
      {!hero && !compact && (
        <div className="chart-months">
          {(signed
            ? [
                "09:00",
                "10:00",
                "11:00",
                "12:00",
                "13:00",
                "14:00",
                "15:00",
                "16:00",
              ]
            : [
                "Oct",
                "Nov",
                "Dec",
                "2018",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
              ]
          ).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
export function CoinChart() {
  const [period, setPeriod] = useState("1Y");
  const [scale, setScale] = useState("Linear Scale");
  const [from, setFrom] = useState("2017-11-03");
  const [to, setTo] = useState("2018-11-03");
  const [visible, setVisible] = useState([
    "Market Cap",
    "Price (USD)",
    "24h Vol",
  ]);
  const [technical, setTechnical] = useState(false);
  const [at, setAt] = useState<number | null>(null);
  const values = sourceSeries.coinPrice.map((v) =>
    scale === "Log Scale" ? Math.log1p(v * 5) / Math.log(6) : v,
  );
  const valid = from <= to;
  const factor =
    (period === "1Y" ? 1 : 0.8) *
    Math.max(
      0.2,
      Math.min(1, (Date.parse(to) - Date.parse(from)) / (365 * 86400000)),
    );
  const path = values
    .map(
      (v, i) =>
        (i ? "L" : "M") +
        ((i / (values.length - 1)) * 1000).toFixed(1) +
        "," +
        (285 - v * factor * 285).toFixed(1),
    )
    .join(" ");
  return (
    <div className="coin-price-chart">
      <div className="coin-chart-tools">
        <div>
          {["1D", "7D", "1M", "3M", "1Y", "YTD", "All"].map((p) => (
            <button
              className="plain"
              key={p}
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <label>
          From
          <input
            aria-label="Chart from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            aria-label="Chart to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className="button small blue-text"
          aria-pressed={technical}
          onClick={() => setTechnical(!technical)}
        >
          Technical Chart
        </button>
        {["Linear Scale", "Log Scale"].map((v) => (
          <button
            key={v}
            className="button small"
            aria-pressed={v === scale}
            onClick={() => setScale(v)}
          >
            {v}
          </button>
        ))}
      </div>
      {!valid ? (
        <p role="alert" className="error">
          The end date must be after the start date.
        </p>
      ) : (
        <>
          <div
            className="coin-price-plot"
            tabIndex={0}
            aria-label="Bitcoin price and market capitalization chart"
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
                setAt(
                  Math.max(
                    0,
                    Math.min(
                      values.length - 1,
                      (at ?? 200) + (e.key === "ArrowLeft" ? -1 : 1),
                    ),
                  ),
                );
              }
            }}
          >
            <div className="coin-plot-axis">
              {["$400B", "$300B", "$200B", "$100B", "$0"].map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
            <svg
              viewBox="0 0 1000 285"
              preserveAspectRatio="none"
              role="img"
              aria-label="Historical price, illustrative data"
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setAt(
                  Math.round(
                    ((e.clientX - r.left) / r.width) * (values.length - 1),
                  ),
                );
              }}
              onPointerLeave={() => setAt(null)}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="0"
                  x2="1000"
                  y1={i * 71}
                  y2={i * 71}
                  stroke="#ddd"
                />
              ))}
              {visible.includes("Market Cap") && (
                <path d={path} fill="none" stroke="#7fa7e8" strokeWidth="2.8" />
              )}
              {visible.includes("Price (USD)") && (
                <path d={path} fill="none" stroke="#00a335" strokeWidth="1.8" />
              )}
              {visible.includes("Price (BTC)") && (
                <path
                  d={path}
                  fill="none"
                  stroke="#777"
                  strokeWidth="1"
                  transform="translate(0,8)"
                />
              )}
              {technical && (
                <path
                  d="M0 200 Q250 100 500 190 T1000 215"
                  fill="none"
                  stroke="#ba8bbd"
                  strokeWidth="2"
                />
              )}
              {at !== null && (
                <line
                  x1={(at / (values.length - 1)) * 1000}
                  x2={(at / (values.length - 1)) * 1000}
                  y1="0"
                  y2="285"
                  stroke="#777"
                />
              )}
            </svg>
            <div className="coin-plot-axis right">
              {[
                "$24 000,00",
                "$18 000,00",
                "$12 000,00",
                "$6 000,00",
                "$0.00",
              ].map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
            {at !== null && (
              <output className="coin-price-tooltip">
                {money((values[at] ?? 0) * 24000)}
              </output>
            )}
          </div>
          {visible.includes("24h Vol") && (
            <div className="volume-histogram coin-chart-volumes">
              {Array.from({ length: 170 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height:
                      8 +
                      Math.abs(Math.sin(i * 1.7)) * 60 * (1 - i / 200) +
                      "%",
                  }}
                />
              ))}
            </div>
          )}
          <div className="chart-months">
            {[
              "Dec ’17",
              "Jan ’18",
              "Feb ’18",
              "Mar ’18",
              "Apr ’18",
              "May ’18",
              "Jun ’18",
              "Jul ’18",
              "Aug ’18",
              "Sep ’18",
              "Oct ’18",
              "Nov ’18",
            ].map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
          <div className="chart-navigator">
            <Sparkline />
            <input
              aria-label="Chart range start"
              type="range"
              min="0"
              max="100"
              defaultValue="80"
              onChange={(e) =>
                setPeriod(Number(e.target.value) > 50 ? "1Y" : "All")
              }
            />
          </div>
          <div className="chart-key">
            {["Market Cap", "Price (USD)", "Price (BTC)", "24h Vol"].map(
              (v) => (
                <button
                  key={v}
                  aria-pressed={visible.includes(v)}
                  onClick={() =>
                    setVisible(
                      visible.includes(v)
                        ? visible.filter((s) => s !== v)
                        : [...visible, v],
                    )
                  }
                >
                  — {v}
                </button>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
export function Composition({
  wallet = false,
  total = 55537,
}: {
  wallet?: boolean;
  total?: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  let cursor = 0;
  const gradient = basket
    .map((a) => {
      const start = cursor;
      cursor += a.weight;
      return a.color + " " + start + "% " + cursor + "%";
    })
    .join(",");
  const shown = wallet ? basket.slice(0, 10) : basket;
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
          aria-label="Index composition, 20 assets"
        >
          <div className="donut-hole">
            <strong>{wallet ? money(total, 0) : "TBCi-20"}</strong>
            <span>{wallet ? "Total balance" : "Stable index"}</span>
          </div>
        </div>
        {hover && (
          <div className="composition-tooltip">
            {coin(hover).name} <strong>{coin(hover).weight}%</strong>
          </div>
        )}
      </div>
      <div className="composition-tables">
        {[shown.slice(0, 10), shown.slice(10)]
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
                          {number((total * a.weight) / 100 / a.price)}{" "}
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
