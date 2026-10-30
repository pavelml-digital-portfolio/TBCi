import { useState } from "react";
import { useDemo } from "./DemoContext";
import { money, coin } from "../data/demo";
export default function ActivityChart() {
  const { state } = useDemo();
  const years = [
    ...new Set([
      "2018",
      ...state.transfers.map((t) => t.createdAt.slice(0, 4)),
    ]),
  ]
    .sort()
    .reverse();
  const [year, setYear] = useState("2018"),
    [metric, setMetric] = useState("volume"),
    [hover, setHover] = useState<number | null>(null),
    [selected, setSelected] = useState<number | null>(null);
  const active = hover ?? selected;
  const months = Array.from({ length: 12 }, (_, i) => {
    const rows = state.transfers.filter(
      (t) =>
        t.createdAt.startsWith(year + "-" + String(i + 1).padStart(2, "0")) &&
        t.status === "completed",
    );
    return {
      rows,
      count: rows.length,
      volume: rows.reduce((s, t) => s + t.amount * coin(t.symbol).price, 0),
    };
  });
  const values = months.map((m) => (metric === "count" ? m.count : m.volume));
  const top = Math.max(1, ...values),
    coords = values.map((v, i) => [25 + (i * 450) / 11, 122 - (v / top) * 92]);
  const labels = [
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
  return (
    <section className="profit-card raised transaction-chart interactive-history">
      <div className="section-row">
        <h2>Transaction history</h2>
        <div className="history-chart-controls">
          <select
            aria-label="Transaction chart year"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setSelected(null);
            }}
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <select
            aria-label="Transaction chart metric"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            <option value="volume">Volume, USD</option>
            <option value="count">Transfers</option>
          </select>
        </div>
      </div>
      <p className="infographic-help">
        {year === "2018" ? "Archive demo transfers" : "Local demo transfers"} ·
        select a month for details
      </p>
      <svg
        viewBox="0 0 500 150"
        role="group"
        aria-label="Interactive monthly transaction history"
      >
        {[30, 60, 90, 122].map((y) => (
          <line key={y} x1="25" x2="475" y1={y} y2={y} stroke="#e5e7e9" />
        ))}
        <path
          d={coords.map((p, i) => (i ? "L" : "M") + p.join(" ")).join(" ")}
          fill="none"
          stroke="#319dff"
          strokeWidth="2"
        />
        {coords.map((p, i) => (
          <g key={i}>
            <circle
              role="button"
              tabIndex={0}
              aria-label={
                labels[i] + " " + year + " · " + months[i].count + " transfers"
              }
              aria-pressed={selected === i}
              cx={p[0]}
              cy={p[1]}
              r="10"
              fill="transparent"
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
            />
            <circle
              cx={p[0]}
              cy={p[1]}
              r={active === i ? 5 : 3}
              fill="#319dff"
              pointerEvents="none"
            />
            {i % 2 === 0 || i === 11 ? (
              <text
                x={p[0]}
                y="146"
                textAnchor="middle"
                fontSize="10"
                fill="#8692a4"
              >
                {labels[i]}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <div className="history-chart-detail" aria-live="polite">
        {active !== null ? (
          <>
            <strong>
              {labels[active]} {year}
            </strong>
            <span>
              {months[active].count} transfers · {money(months[active].volume)}{" "}
              volume
            </span>
            {selected !== null && (
              <a href="/app/settings/#transfers">View transfer records</a>
            )}
          </>
        ) : (
          <span>Hover or focus a point to inspect monthly activity.</span>
        )}
      </div>
    </section>
  );
}
