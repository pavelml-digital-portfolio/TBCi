import { bindChartBounds } from "../data/chart-bounds";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  AreaSeries,
  LineSeries,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  PriceScaleMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import {
  seriesFor,
  average,
  rsi,
  instrumentName,
  ARCHIVE_START,
  ARCHIVE_END,
  type Interval,
  type Bar,
} from "../data/market";
import { number, basket } from "../data/demo";
type Props = {
  instrument?: string;
  height?: number;
  hero?: boolean;
  compare?: boolean;
  signed?: boolean;
};
type Mode = "Area" | "Candles" | "Line";
const toDate = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
export default function TradingChart({
  instrument = "tbci-20-stable",
  height = 410,
  hero = false,
  compare = false,
  signed = false,
}: Props) {
  const [interval, setInterval] = useState<Interval>("1D");
  const [period, setPeriod] = useState("1Y");
  const [from, setFrom] = useState(ARCHIVE_START);
  const [to, setTo] = useState(ARCHIVE_END);
  const [mode, setMode] = useState<Mode>("Area");
  const [metric, setMetric] = useState(signed ? "Return %" : "Value");
  const [scale, setScale] = useState("Linear Scale");
  const [indicators, setIndicators] = useState<string[]>([]);
  const [compares, setCompares] = useState<string[]>(
    compare ? [instrument === "BTC" ? "ETH" : "BTC"] : [],
  );
  const [add, setAdd] = useState("");
  const [hover, setHover] = useState<Bar | null>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(0);
  const [showData, setShowData] = useState(false);
  const [notice, setNotice] = useState("");
  const [symbol, setSymbol] = useState(instrument);
  const plot = useRef<HTMLDivElement>(null);
  const widget = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const main = useRef<ISeriesApi<"Area" | "Line" | "Candlestick"> | null>(null);
  const lines = useRef<ReturnType<ISeriesApi<"Line">["createPriceLine"]>[]>([]);
  const hoverIndex = useRef(0);
  const viewport = useRef<{ from: number; to: number } | null>(null);
  const lastDataKey = useRef("");
  const bounds = useRef<ReturnType<typeof bindChartBounds> | null>(null);
  const [logical, setLogical] = useState({ from: 0, to: 0 });
  useEffect(() => {
    setSymbol(instrument);
    setHover(null);
  }, [instrument]);
  const valid = from <= to && from >= ARCHIVE_START && to <= ARCHIVE_END;
  const bars = useMemo(
    () =>
      valid
        ? seriesFor(symbol, interval).filter(
            (b) => toDate(b.time) >= from && toDate(b.time) <= to,
          )
        : [],
    [symbol, interval, from, to, valid],
  );
  const values = useMemo(() => {
    if (metric !== "Return %" || !bars.length) return bars;
    const first = bars[0].close;
    return bars.map((b) => ({
      ...b,
      open: (b.open / first - 1) * 100,
      high: (b.high / first - 1) * 100,
      low: (b.low / first - 1) * 100,
      close: (b.close / first - 1) * 100,
    }));
  }, [bars, metric]);
  const point = hover ?? values.at(-1);
  const dataKey = symbol + "-" + interval + "-" + from + "-" + to;
  const setRange = (p: string) => {
    setPeriod(p);
    const n =
      p === "1W"
        ? 7
        : p === "1M"
          ? 31
          : p === "3M"
            ? 92
            : p === "6M"
              ? 183
              : 365;
    setTo(ARCHIVE_END);
    setFrom(toDate(Date.parse(ARCHIVE_END) / 1000 - (n - 1) * 86400));
  };
  useEffect(() => {
    if (!plot.current || !values.length) {
      setReady(false);
      return;
    }
    const restoreViewport =
      lastDataKey.current === dataKey ? viewport.current : null;
    lastDataKey.current = dataKey;
    setReady(false);
    setHover(null);
    setNotice("");
    lines.current = [];
    const dark = hero;
    const api = createChart(plot.current, {
      autoSize: true,
      height: hero
        ? height
        : height + (indicators.includes("RSI 14") ? 110 : 0),
      layout: {
        background: {
          type: ColorType.Solid,
          color: dark ? "#1b233d" : "#ffffff",
        },
        textColor: dark ? "#9faac0" : "#858b9b",
        fontFamily: "Open Sans, sans-serif",
        fontSize: 11,
        attributionLogo: true,
        panes: {
          separatorColor: "#e8ebf1",
          separatorHoverColor: "#b4d6f8",
          enableResize: true,
        },
      },
      grid: {
        vertLines: { color: dark ? "#ffffff05" : "#f3f4f7" },
        horzLines: { color: dark ? "#ffffff09" : "#e9edf2" },
      },
      rightPriceScale: {
        borderColor: dark ? "#ffffff18" : "#e9edf2",
        mode:
          scale === "Log Scale" && metric !== "Return %"
            ? PriceScaleMode.Logarithmic
            : PriceScaleMode.Normal,
        scaleMargins: { top: 0.12, bottom: 0.08 },
      },
      timeScale: {
        borderColor: dark ? "#ffffff18" : "#e9edf2",
        timeVisible: interval === "1H" || interval === "4H",
        secondsVisible: false,
        rightOffset: 0,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#9aa8bf", labelBackgroundColor: "#28364c" },
        horzLine: { color: "#9aa8bf", labelBackgroundColor: "#28364c" },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
      },
    });
    chart.current = api;
    const decimals =
      metric === "Return %" ? 2 : values.at(-1)!.close < 1 ? 6 : 2;
    const priceFormat =
      metric === "Return %"
        ? {
            type: "custom" as const,
            minMove: 0.01,
            formatter: (v: number) => number(v, 2) + "%",
          }
        : {
            type: "price" as const,
            precision: decimals,
            minMove: 10 ** -decimals,
          };
    const primary =
      mode === "Candles"
        ? api.addSeries(CandlestickSeries, {
            upColor: "#29a887",
            downColor: "#e26a7c",
            borderVisible: false,
            wickUpColor: "#29a887",
            wickDownColor: "#e26a7c",
            priceFormat,
          })
        : mode === "Line"
          ? api.addSeries(LineSeries, {
              color: dark ? "#65b7f8" : "#278fff",
              lineWidth: 2,
              priceFormat,
            })
          : api.addSeries(AreaSeries, {
              lineColor: dark ? "#6cafe1" : "#6cb1e8",
              topColor: dark ? "#385b8580" : "#c3e4faac",
              bottomColor: dark ? "#293e6170" : "#eef7fd40",
              lineWidth: 2,
              priceFormat,
            });
    main.current = primary;
    primary.setData(
      values.map((b) =>
        mode === "Candles"
          ? {
              time: b.time as UTCTimestamp,
              open: b.open,
              high: b.high,
              low: b.low,
              close: b.close,
            }
          : { time: b.time as UTCTimestamp, value: b.close },
      ),
    );
    const colors = ["#d9b468", "#8a7fd1", "#3eb496"];
    compares.forEach((id, k) => {
      const other = seriesFor(id, interval).filter(
        (b) => toDate(b.time) >= from && toDate(b.time) <= to,
      );
      if (!other.length) return;
      const factor =
        metric === "Return %"
          ? 100 / other[0].close
          : values[0].close / other[0].close;
      const s = api.addSeries(LineSeries, {
        color: colors[k % 3],
        lineWidth: 1,
        title: id,
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat,
      });
      s.setData(
        other.map((b) => ({
          time: b.time as UTCTimestamp,
          value: b.close * factor - (metric === "Return %" ? 100 : 0),
        })),
      );
    });
    const line = (
      data: { time: number; value: number }[],
      color: string,
      title: string,
    ) => {
      const s = api.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        title,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      s.setData(data.map((b) => ({ ...b, time: b.time as UTCTimestamp })));
      return s;
    };
    if (indicators.includes("SMA 20"))
      line(average(values, 20), "#ce9b38", "SMA20");
    if (indicators.includes("EMA 50"))
      line(average(values, 50, true), "#9d80ca", "EMA50");
    if (indicators.includes("Bollinger")) {
      const means = average(values, 20);
      line(means, "#90afd1", "BB20");
      for (const sign of [-1, 1])
        line(
          means.map((p, i) => {
            const group = values.slice(i, i + 20);
            const std = Math.sqrt(
              group.reduce((s, b) => s + (b.close - p.value) ** 2, 0) /
                group.length,
            );
            return { time: p.time, value: p.value + sign * 2 * std };
          }),
          "#abc6df",
          sign > 0 ? "BB Upper" : "BB Lower",
        );
    }
    let pane = 1;
    if (indicators.includes("Volume")) {
      const v = api.addSeries(
        HistogramSeries,
        {
          priceFormat: { type: "volume" },
          priceLineVisible: false,
          lastValueVisible: false,
        },
        pane++,
      );
      v.setData(
        bars.map((b) => ({
          time: b.time as UTCTimestamp,
          value: b.volume,
          color: b.close >= b.open ? "#64baaa88" : "#d78e9b88",
        })),
      );
      api.panes()[1].setHeight(78);
    }
    if (indicators.includes("RSI 14")) {
      const r = api.addSeries(
        LineSeries,
        {
          color: "#aa80cd",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
          priceFormat: { type: "price", precision: 1, minMove: 0.1 },
        },
        pane,
      );
      r.setData(rsi(bars).map((b) => ({ ...b, time: b.time as UTCTimestamp })));
      for (const p of [30, 70])
        r.createPriceLine({
          price: p,
          color: "#b4b8c4",
          lineStyle: LineStyle.Dashed,
          lineWidth: 1,
          axisLabelVisible: true,
          title: "",
        });
      api.panes()[pane].setHeight(105);
    }
    const byTime = new Map(values.map((b, i) => [b.time, { b, i }]));
    api.subscribeCrosshairMove((param) => {
      const value = byTime.get(Number(param.time));
      if (value) {
        setHover(value.b);
        hoverIndex.current = value.i;
      } else setHover(null);
    });
    const bound = bindChartBounds(api, values.length, (range) => {
      viewport.current = range;
      setLogical(range);
      setVisible(
        Math.min(values.length, Math.round(range.to - range.from) + 1),
      );
    });
    bounds.current = bound;
    if (restoreViewport) bound.set(restoreViewport);
    else bound.reset();
    hoverIndex.current = values.length - 1;
    setVisible(
      restoreViewport
        ? Math.round(restoreViewport.to - restoreViewport.from)
        : values.length,
    );
    setReady(true);
    return () => {
      bound.destroy();
      bounds.current = null;
      api.remove();
      chart.current = null;
      main.current = null;
    };
  }, [
    dataKey,
    values,
    mode,
    scale,
    metric,
    indicators,
    compares,
    height,
    hero,
  ]);
  const toggle = (v: string) =>
    setIndicators((a) =>
      a.includes(v) ? a.filter((s) => s !== v) : [...a, v],
    );
  const zoom = (factor: number) => bounds.current?.zoom(factor);
  const exportCsv = () => {
    const content =
      "Date,Open,High,Low,Close,Volume\n" +
      bars
        .map((b) =>
          [
            new Date(b.time * 1000).toISOString(),
            b.open,
            b.high,
            b.low,
            b.close,
            b.volume,
          ].join(","),
        )
        .join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = symbol + "-" + interval + "-2018.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section
      ref={widget}
      className={"trading-widget " + (hero ? "trading-dark" : "")}
      data-instrument={symbol}
      data-series-key={dataKey}
      data-ready={ready}
      data-range-from={logical.from}
      data-range-to={logical.to}
      data-bar-count={values.length}
      aria-label={instrumentName(symbol) + " interactive chart"}
    >
      {!hero && (
        <>
          <div className="trading-toolbar">
            <div className="trading-main-controls">
              <label>
                <span className="sr-only">Main chart series</span>
                <select
                  aria-label="Main chart series"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                >
                  {(symbol.startsWith("tbci-")
                    ? [
                        "tbci-20-stable",
                        "tbci-10-stable",
                        "tbci-20-balance",
                        "tbci-50-active",
                        "tbci-20-balance-2",
                        "tbci-20-utility",
                        "tbci-20-security",
                      ]
                    : [...basket.map((a) => a.symbol), "portfolio"]
                  ).map((id) => (
                    <option key={id} value={id}>
                      {instrumentName(id)}
                    </option>
                  ))}
                </select>
              </label>
              <select
                aria-label="Chart type"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
              >
                {["Area", "Candles", "Line"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select
                aria-label="Chart interval"
                value={interval}
                onChange={(e) => setInterval(e.target.value as Interval)}
              >
                {["1H", "4H", "1D", "1W"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select
                aria-label="Chart metric"
                value={metric}
                onChange={(e) => {
                  setMetric(e.target.value);
                  if (e.target.value === "Return %") setScale("Linear Scale");
                }}
              >
                <option>Value</option>
                <option>Return %</option>
              </select>
            </div>
            <div className="trading-periods">
              {["1W", "1M", "3M", "6M", "1Y", "All"].map((p) => (
                <button
                  key={p}
                  aria-pressed={p === period}
                  onClick={() => setRange(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="trading-secondary">
            <div className="trading-comparisons">
              {compares.map((id, i) => (
                <button
                  key={id}
                  className={"compare-chip color-" + i}
                  data-comparison={id}
                  aria-label={"Remove " + id + " comparison"}
                  onClick={() => setCompares(compares.filter((s) => s !== id))}
                >
                  ● {id} ×
                </button>
              ))}
              <input
                aria-label="Add coins to comparison"
                placeholder="Add coins"
                list="comparison-symbols"
                value={add}
                onChange={(e) => setAdd(e.target.value.toUpperCase())}
              />
              <datalist id="comparison-symbols">
                {["BTC", "ETH", "XRP", "LTC", "EOS"].map((id) => (
                  <option key={id}>{id}</option>
                ))}
              </datalist>
              <button
                aria-label="Add comparison"
                disabled={
                  !["BTC", "ETH", "XRP", "LTC", "EOS"].includes(add) ||
                  compares.includes(add) ||
                  add === symbol
                }
                onClick={() => {
                  setCompares([...compares, add].slice(-4));
                  setAdd("");
                }}
              >
                +
              </button>
            </div>
            <div className="trading-dates">
              <label>
                From
                <input
                  aria-label="Chart from"
                  type="date"
                  min={ARCHIVE_START}
                  max={ARCHIVE_END}
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPeriod("Custom");
                  }}
                />
              </label>
              <label>
                To
                <input
                  aria-label="Chart to"
                  type="date"
                  min={ARCHIVE_START}
                  max={ARCHIVE_END}
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPeriod("Custom");
                  }}
                />
              </label>
            </div>
          </div>
          <div className="trading-indicators">
            {["Volume", "SMA 20", "EMA 50", "Bollinger", "RSI 14"].map((v) => (
              <button
                key={v}
                aria-pressed={indicators.includes(v)}
                onClick={() => toggle(v)}
              >
                {v}
              </button>
            ))}
            <span className="trading-divider" />
            {["Linear Scale", "Log Scale"].map((v) => (
              <button
                key={v}
                disabled={v === "Log Scale" && metric === "Return %"}
                aria-pressed={v === scale}
                onClick={() => setScale(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="trading-ohlc" aria-live="off">
            {point ? (
              <>
                <time>
                  {new Date(point.time * 1000).toLocaleString("en-GB", {
                    timeZone: "UTC",
                    dateStyle: "medium",
                    ...(interval.includes("H") ? { timeStyle: "short" } : {}),
                  })}
                </time>
                {[
                  ["O", point.open],
                  ["H", point.high],
                  ["L", point.low],
                  ["C", point.close],
                ].map(([label, value]) => (
                  <span key={label}>
                    <b>{label}</b>{" "}
                    {number(
                      Number(value),
                      metric === "Return %" ? 2 : point.close < 1 ? 6 : 3,
                    )}
                    {metric === "Return %" ? "%" : ""}
                  </span>
                ))}
                <span
                  className={
                    point.close >= point.open ? "positive" : "negative"
                  }
                >
                  {point.open === 0
                    ? "—"
                    : number((point.close / point.open - 1) * 100, 2) + "%"}
                </span>
                <span className="subtle">
                  Vol{" "}
                  {number(
                    bars.find((b) => b.time === point.time)?.volume ?? 0,
                    0,
                  )}
                </span>
              </>
            ) : (
              <span>Choose a valid period</span>
            )}
          </div>
        </>
      )}
      {hero && (
        <div className="trading-hero-controls">
          {["1M", "3M", "6M", "1Y"].map((p) => (
            <button
              key={p}
              aria-pressed={period === p}
              onClick={() => setRange(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      {!valid && (
        <p role="alert" className="error">
          The end date must be after the start date. Choose dates within 2018.
        </p>
      )}
      <div
        className="trading-canvas"
        ref={plot}
        style={{ height: height + (indicators.includes("RSI 14") ? 110 : 0) }}
        tabIndex={0}
        aria-label="Interactive chart canvas. Drag to pan, scroll to zoom; use arrow keys, plus, minus or zero."
        onKeyDown={(e) => {
          if (!chart.current || !main.current) return;
          if (["+", "=", "-", "0", "ArrowLeft", "ArrowRight"].includes(e.key))
            e.preventDefault();
          if (e.key === "+" || e.key === "=") zoom(0.7);
          if (e.key === "-") zoom(1.4);
          if (e.key === "0") bounds.current?.reset();
          if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
            const i = Math.max(
              0,
              Math.min(
                values.length - 1,
                hoverIndex.current + (e.key === "ArrowLeft" ? -1 : 1),
              ),
            );
            hoverIndex.current = i;
            const p = values[i];
            setHover(p);
            chart.current.setCrosshairPosition(
              p.close,
              p.time as UTCTimestamp,
              main.current,
            );
          }
        }}
      />
      {!hero && (
        <>
          <div className="trading-bottom">
            <div className="trading-zoom">
              <button
                aria-label="Zoom in"
                disabled={
                  logical.to - logical.from <=
                  Math.min(7, values.length - 1) + 0.01
                }
                onClick={() => zoom(0.7)}
              >
                +
              </button>
              <button
                aria-label="Zoom out"
                disabled={logical.to - logical.from >= values.length - 1 - 0.01}
                onClick={() => zoom(1.4)}
              >
                −
              </button>
              <button
                aria-label="Reset chart zoom"
                onClick={() => bounds.current?.reset()}
              >
                Reset
              </button>
              <button
                disabled={!ready}
                onClick={() => {
                  if (!main.current || !point) return;
                  lines.current.push(
                    main.current.createPriceLine({
                      price: point.close,
                      color: "#b18bca",
                      lineWidth: 1,
                      lineStyle: LineStyle.Dashed,
                      axisLabelVisible: true,
                      title: "Level " + (lines.current.length + 1),
                    }),
                  );
                  setNotice("Price level added at " + number(point.close));
                }}
              >
                Price level +
              </button>
              <button
                onClick={() => {
                  for (const line of lines.current)
                    main.current?.removePriceLine(line);
                  lines.current = [];
                  setNotice("Price levels cleared");
                }}
              >
                Clear levels
              </button>
            </div>
            <div className="trading-export">
              <button onClick={exportCsv}>CSV</button>
              <button
                disabled={!ready}
                onClick={() => {
                  const a = document.createElement("a");
                  a.href =
                    chart.current?.takeScreenshot(true, true).toDataURL() ?? "";
                  a.download = symbol + "-2018.png";
                  a.click();
                }}
              >
                PNG
              </button>
              <button
                aria-label="Fullscreen chart"
                onClick={async () => {
                  try {
                    if (document.fullscreenElement)
                      await document.exitFullscreen();
                    else await widget.current?.requestFullscreen();
                  } catch {
                    setNotice("Fullscreen is unavailable in this browser.");
                  }
                }}
              >
                ⛶
              </button>
              <button
                aria-pressed={showData}
                onClick={() => setShowData(!showData)}
              >
                {showData ? "Hide data" : "Show data"}
              </button>
            </div>
          </div>
          <label className="trading-navigator">
            <span>2018</span>
            <input
              aria-label="Chart range start"
              type="range"
              min="0"
              max="90"
              defaultValue="0"
              onChange={(e) => {
                const start = (Number(e.target.value) / 100) * values.length;
                bounds.current?.set({
                  from: start,
                  to: Math.min(
                    values.length,
                    start + Math.max(15, values.length * 0.25),
                  ),
                });
              }}
            />
            <output aria-label="Visible chart bars">{visible} bars</output>
          </label>
          <p className="trading-caption">
            2018 archive · Simulated OHLCV
            {compares.length
              ? " · Comparison series rebased to the same starting value"
              : ""}
            .{" "}
            <a
              href="https://www.tradingview.com/"
              target="_blank"
              rel="noreferrer"
            >
              Charts by TradingView
            </a>
          </p>
          {notice && (
            <p
              role="status"
              aria-label="Chart notification"
              className="trading-notice"
            >
              {notice}
            </p>
          )}
          {showData && (
            <div className="table-scroll trading-data">
              <table>
                <caption>
                  {instrumentName(symbol)} · Last 30 bars of selected interval ·
                  mock data
                </caption>
                <thead>
                  <tr>
                    {["UTC date", "Open", "High", "Low", "Close", "Volume"].map(
                      (v) => (
                        <th key={v}>{v}</th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bars
                    .slice(-30)
                    .reverse()
                    .map((b) => (
                      <tr key={b.time}>
                        <td>
                          {new Date(b.time * 1000)
                            .toISOString()
                            .replace("T", " ")
                            .slice(0, 16)}
                        </td>
                        {[b.open, b.high, b.low, b.close, b.volume].map(
                          (v, i) => (
                            <td key={i}>{number(v, i === 4 ? 0 : 6)}</td>
                          ),
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function ExchangeVolumeChart({
  exchange,
  period,
}: {
  exchange: string;
  period: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ date: string; value: number } | null>(null);
  const hourly = period === "24h";
  const count = hourly
    ? 24
    : period === "Week"
      ? 7
      : period === "Month"
        ? 31
        : 365;
  const rows = seriesFor("volume:" + exchange, hourly ? "1H" : "1D").slice(
    -count,
  );
  useEffect(() => {
    if (!ref.current) return;
    setAt(null);
    const api = createChart(ref.current, {
      autoSize: true,
      height: 165,
      layout: {
        background: { type: ColorType.Solid, color: "#fff" },
        textColor: "#99a4b6",
        fontSize: 9,
        attributionLogo: true,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: "#f0f3f7" } },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        timeVisible: hourly,
        borderVisible: false,
        rightOffset: 0,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
      },
      crosshair: { mode: CrosshairMode.Normal },
    });
    const series = api.addSeries(HistogramSeries, {
      color: "#a6bfda",
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: "volume" },
    });
    series.setData(
      rows.map((r) => ({
        time: r.time as UTCTimestamp,
        value: r.close / (hourly ? 24 : 1),
      })),
    );
    api.subscribeCrosshairMove((p) => {
      const item = rows.find((r) => r.time === p.time);
      if (item)
        setAt({
          date: new Date(item.time * 1000)
            .toISOString()
            .replace("T", " ")
            .slice(0, hourly ? 16 : 10),
          value: item.close / (hourly ? 24 : 1),
        });
      else setAt(null);
    });
    const bounds = bindChartBounds(api, rows.length);
    bounds.reset();
    return () => {
      bounds.destroy();
      api.remove();
    };
  }, [exchange, period]);
  return (
    <div className="exchange-interactive-volume">
      <div className="exchange-volume-legend">
        {at ? (
          <>
            <time>{at.date} UTC</time>
            <strong>{number(at.value, 0)} USD</strong>
          </>
        ) : (
          <span>2018 archive · simulated USD volume</span>
        )}
      </div>
      <div ref={ref} style={{ height: 165 }} />
      <small>Drag to pan · scroll to zoom</small>
    </div>
  );
}
