import { useState } from "react";
export type DonutItem = {
  id: string;
  label: string;
  value: number;
  color: string;
  detail?: string;
};
export default function InteractiveDonut({
  items,
  title,
  subtitle,
  active: externalActive,
  onActive,
  onSelect,
  selected: externalSelected,
}: {
  items: DonutItem[];
  title: string;
  subtitle: string;
  active?: string | null;
  selected?: string | null;
  onActive?: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
}) {
  const [hover, setHover] = useState<string | null>(null),
    [pinned, setPinned] = useState<string | null>(null);
  const selected = externalSelected === undefined ? pinned : externalSelected;
  const active =
    (externalActive === undefined ? hover : externalActive) || selected;
  const item = items.find((i) => i.id === active);
  const total = items.reduce((s, i) => s + Math.max(0, i.value), 0);
  let cursor = 0;
  const focus = (id: string | null) => {
    setHover(id);
    onActive?.(id);
  };
  const pin = (id: string | null) => {
    const next = selected === id ? null : id;
    setPinned(next);
    onSelect?.(next);
  };
  return (
    <div className="donut interactive-donut" data-selected={selected || ""}>
      <svg
        viewBox="0 0 240 240"
        role="group"
        aria-label={title + " · interactive composition"}
      >
        <circle
          cx="120"
          cy="120"
          r="91"
          fill="none"
          stroke="#edf1f7"
          strokeWidth="52"
        />
        {items
          .filter((i) => i.value > 0)
          .map((i) => {
            const percent = (i.value / (total || 1)) * 100;
            const start = cursor;
            cursor += percent;
            return (
              <circle
                key={i.id}
                role="button"
                tabIndex={0}
                aria-label={i.label + " · " + percent.toFixed(1) + "%"}
                aria-pressed={selected === i.id}
                cx="120"
                cy="120"
                r="91"
                fill="none"
                stroke={i.color}
                strokeWidth={active === i.id ? 57 : 52}
                pathLength="100"
                strokeDasharray={percent + " " + (100 - percent)}
                strokeDashoffset={-start}
                transform="rotate(-90 120 120)"
                style={{ opacity: active && active !== i.id ? 0.35 : 1 }}
                onPointerEnter={() => focus(i.id)}
                onPointerLeave={() => focus(null)}
                onFocus={() => focus(i.id)}
                onBlur={() => focus(null)}
                onClick={() => pin(i.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pin(i.id);
                  } else if (e.key === "Escape") {
                    pin(null);
                    focus(null);
                  } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    const controls = Array.from(
                      e.currentTarget.parentElement!.querySelectorAll<SVGElement>(
                        "[role=button]",
                      ),
                    );
                    controls[
                      (controls.indexOf(e.currentTarget) +
                        (e.key === "ArrowRight" ? 1 : controls.length - 1)) %
                        controls.length
                    ].focus();
                  }
                }}
              >
                <title>
                  {i.label +
                    " · " +
                    percent.toFixed(2) +
                    "%" +
                    (i.detail ? " · " + i.detail : "")}
                </title>
              </circle>
            );
          })}
      </svg>
      <div className="donut-hole" aria-live="polite">
        <strong>{item ? item.label : title}</strong>
        <span>
          {item
            ? ((item.value / (total || 1)) * 100).toFixed(1) + "%"
            : subtitle}
        </span>
        {item?.detail && <small>{item.detail}</small>}
        {selected && (
          <button
            className="wallet-text-button"
            onClick={() => {
              pin(null);
              focus(null);
            }}
          >
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
}
