import { useEffect, useMemo, useState } from "react";
import { money, number } from "../data/demo";
import {
  portfolioSeries,
  monthlyPerformance,
  underlyingExposure,
  exposureTiles,
  type PortfolioPosition,
} from "../data/portfolio";
import InteractiveDonut from "./InteractiveDonut";
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export function PortfolioComposition({
  positions,
  view,
  onView,
  hidden,
}: {
  positions: PortfolioPosition[];
  view: "assets" | "indices";
  onView: (v: "assets" | "indices") => void;
  hidden: boolean;
}) {
  const [active, setActive] = useState<string | null>(null),
    [pinned, setPinned] = useState<string | null>(null);
  useEffect(() => {
    setActive(null);
    setPinned(null);
  }, [positions, view]);
  const exposure = useMemo(() => underlyingExposure(positions), [positions]);
  const rows =
    view === "assets"
      ? exposure
      : positions.map((p) => ({
          id: p.id,
          label: p.label ?? p.id,
          value: p.value,
          color: p.color ?? "#218dff",
          quantity: p.quantity ?? 0,
        }));
  const total = rows.reduce((s, a) => s + a.value, 0);
  return (
    <section
      className="portfolio-panel portfolio-composition"
      aria-label="Balance composition"
    >
      <div className="portfolio-section-head">
        <div>
          <h2>Balance Composition</h2>
          <p>
            USD value of the selected indices. Underlying exposure is a
            breakdown, not an extra balance.
          </p>
        </div>
        <div
          className="segmented-control"
          role="group"
          aria-label="Composition grouping"
        >
          <button
            aria-pressed={view === "assets"}
            onClick={() => {
              onView("assets");
              setPinned(null);
            }}
          >
            Underlying assets
          </button>
          <button
            aria-pressed={view === "indices"}
            onClick={() => {
              onView("indices");
              setPinned(null);
            }}
          >
            By index
          </button>
        </div>
      </div>
      {total > 0 ? (
        <div className="portfolio-composition-grid">
          <div className="donut-wrap">
            <InteractiveDonut
              title={hidden ? "Balance hidden" : money(total, 0)}
              subtitle="Selected index holdings"
              items={rows.map((a) => ({
                id: a.id,
                label: view === "assets" ? a.id + " · " + a.label : a.label,
                value: a.value,
                color: a.color,
                detail: hidden ? "" : money(a.value),
              }))}
              active={active}
              selected={pinned}
              onActive={setActive}
              onSelect={setPinned}
            />
            <p className="infographic-help">
              Select a segment or row to inspect its share
            </p>
          </div>
          <div
            className="portfolio-composition-list"
            aria-label="Composition breakdown"
          >
            <p className="composition-list-caption">
              {rows.length}{" "}
              {view === "assets" ? "underlying assets" : "indices"} · scroll to
              explore the full breakdown
            </p>
            {rows.map((a) => (
              <button
                key={a.id}
                className={(active || pinned) === a.id ? "is-highlighted" : ""}
                onPointerEnter={() => setActive(a.id)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(a.id)}
                onBlur={() => setActive(null)}
                aria-pressed={pinned === a.id}
                onClick={() => setPinned(pinned === a.id ? null : a.id)}
              >
                <i style={{ background: a.color }} />
                <span>
                  <strong>{view === "assets" ? a.id : a.label}</strong>
                  <small>{view === "assets" ? a.label : "Index holding"}</small>
                </span>
                <b>{number((a.value / total) * 100, 1)}%</b>
                <span className="composition-value">
                  {hidden ? "••••" : money(a.value)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="portfolio-empty">
          Select at least one owned index to display its composition.
        </div>
      )}
      <p className="portfolio-footnote">
        Illustrative basket mappings across the supported asset catalog; no
        actual underlying ownership or published index methodology is implied.
      </p>
    </section>
  );
}
export function MonthlyReturns({
  positions,
  hidden,
}: {
  positions: PortfolioPosition[];
  hidden: boolean;
}) {
  const data = useMemo(
    () => monthlyPerformance(portfolioSeries(positions)),
    [positions],
  );
  const [hover, setHover] = useState<number | null>(null),
    [selected, setSelected] = useState<number | null>(null);
  const active = hover ?? selected;
  const max = Math.max(1, ...data.map((d) => Math.abs(d.change)));
  return (
    <section className="portfolio-panel monthly-returns">
      <div className="portfolio-section-head">
        <div>
          <h2>Monthly model returns</h2>
          <p>
            How today’s selected holdings would move through the simulated 2018
            market.
          </p>
        </div>
        <span className="settings-badge">Column chart · %</span>
      </div>
      {positions.length ? (
        <>
          <svg
            viewBox="0 0 600 250"
            role="group"
            aria-label="Monthly model return column chart"
          >
            {[-1, -0.5, 0, 0.5, 1].map((v) => (
              <g key={v}>
                <line
                  x1="45"
                  x2="595"
                  y1={115 - v * 90}
                  y2={115 - v * 90}
                  stroke={v === 0 ? "#abbad0" : "#ecf0f6"}
                />
                <text
                  x="38"
                  y={119 - v * 90}
                  textAnchor="end"
                  fill="#8b99ac"
                  fontSize="10"
                >
                  {number(v * max, 0)}%
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const h = Math.max(1, (Math.abs(d.change) / max) * 90),
                x = 56 + i * 45;
              return (
                <g
                  key={i}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    monthNames[i] + " model return " + number(d.change, 2) + "%"
                  }
                  aria-pressed={selected === i}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  onClick={() => setSelected(selected === i ? null : i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(selected === i ? null : i);
                    }
                    if (e.key === "Escape") setSelected(null);
                  }}
                >
                  <rect
                    x={x - 5}
                    y="10"
                    width="37"
                    height="210"
                    fill="transparent"
                  />
                  <rect
                    x={x}
                    y={d.change >= 0 ? 115 - h : 115}
                    width="26"
                    height={h}
                    rx="3"
                    fill={d.change >= 0 ? "#40b99c" : "#ee8c99"}
                    opacity={active === null || active === i ? 1 : 0.45}
                  />
                  <text
                    x={x + 13}
                    y="239"
                    textAnchor="middle"
                    fill="#8b99ac"
                    fontSize="10"
                  >
                    {monthNames[i]}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="portfolio-chart-detail" aria-live="polite">
            {active !== null ? (
              <>
                <strong>{monthNames[active]} 2018</strong>
                <span
                  className={data[active].change >= 0 ? "positive" : "negative"}
                >
                  {data[active].change >= 0 ? "+" : ""}
                  {number(data[active].change, 2)}%
                </span>
                {!hidden && (
                  <span>
                    {money(data[active].from, 0)} → {money(data[active].to, 0)}
                  </span>
                )}
              </>
            ) : (
              <span>Hover, focus or select a month to view its return.</span>
            )}
          </div>
        </>
      ) : (
        <div className="portfolio-empty">
          Select indices to compare monthly returns.
        </div>
      )}
    </section>
  );
}
export function ExposureMap({
  positions,
  hidden,
}: {
  positions: PortfolioPosition[];
  hidden: boolean;
}) {
  const rows = useMemo(() => underlyingExposure(positions), [positions]),
    tiles = useMemo(() => exposureTiles(rows), [rows]);
  const total = rows.reduce((s, a) => s + a.value, 0);
  const [active, setActive] = useState<string | null>(null);
  const chosen = rows.find((a) => a.id === active);
  return (
    <section className="portfolio-panel exposure-map">
      <div className="portfolio-section-head">
        <div>
          <h2>Asset exposure map</h2>
          <p>
            Each tile’s area shows an asset’s share across the selected indices.
          </p>
        </div>
        <span className="settings-badge">Treemap · {rows.length} assets</span>
      </div>
      {rows.length ? (
        <>
          <svg
            viewBox="0 0 600 250"
            role="group"
            aria-label="Underlying asset exposure treemap"
          >
            {tiles.map((t) => (
              <g
                key={t.id}
                tabIndex={0}
                role="button"
                aria-label={
                  t.id + " exposure " + number((t.value / total) * 100, 2) + "%"
                }
                aria-pressed={active === t.id}
                onPointerEnter={() => setActive(t.id)}
                onFocus={() => setActive(t.id)}
                onClick={() => setActive(active === t.id ? null : t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(active === t.id ? null : t.id);
                  }
                  if (e.key === "Escape") setActive(null);
                }}
              >
                <rect
                  x={t.x + 2}
                  y={t.y + 2}
                  width={Math.max(0, t.width - 4)}
                  height={Math.max(0, t.height - 4)}
                  rx="5"
                  fill={t.color}
                  opacity={!active || active === t.id ? 1 : 0.4}
                />
                {t.width > 48 && t.height > 28 && (
                  <text
                    x={t.x + t.width / 2}
                    y={t.y + t.height / 2 - 1}
                    textAnchor="middle"
                    fill="#142442"
                    fontSize={t.width > 90 ? 16 : 12}
                    fontWeight="600"
                  >
                    {t.id}
                  </text>
                )}
                {t.width > 70 && t.height > 55 && (
                  <text
                    x={t.x + t.width / 2}
                    y={t.y + t.height / 2 + 19}
                    textAnchor="middle"
                    fill="#142442"
                    fontSize="11"
                  >
                    {number((t.value / total) * 100, 1)}%
                  </text>
                )}
              </g>
            ))}
          </svg>
          <div className="portfolio-chart-detail" aria-live="polite">
            {chosen ? (
              <>
                <strong>
                  {chosen.id} · {chosen.label}
                </strong>
                <span>{number((chosen.value / total) * 100, 2)}%</span>
                {!hidden && <span>{money(chosen.value)} exposure</span>}
              </>
            ) : (
              <span>Select a tile to inspect aggregate asset exposure.</span>
            )}
          </div>
        </>
      ) : (
        <div className="portfolio-empty">
          Select indices to display underlying exposure.
        </div>
      )}
    </section>
  );
}
