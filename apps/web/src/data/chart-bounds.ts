import type { IChartApi } from "lightweight-charts";
export type ChartRange = { from: number; to: number };
export function clampChartRange(range: ChartRange, count: number): ChartRange {
  const end = Math.max(0, count - 1);
  if (!end) return { from: 0, to: 0 };
  const requested =
    Number.isFinite(range.from) && Number.isFinite(range.to)
      ? range
      : { from: 0, to: end };
  const span = Math.min(
    end,
    Math.max(Math.min(7, end), requested.to - requested.from),
  );
  const start = Math.max(
    0,
    Math.min(end - span, (requested.from + requested.to - span) / 2),
  );
  return { from: start, to: start + span };
}
export function bindChartBounds(
  api: IChartApi,
  count: number,
  onChange?: (r: ChartRange) => void,
) {
  const scale = api.timeScale();
  let adjusting = false;
  let disposed = false;
  let reportFrame = 0;
  const apply = (request: ChartRange) => {
    if (disposed) return;
    scale.setVisibleLogicalRange(clampChartRange(request, count));
    cancelAnimationFrame(reportFrame);
    reportFrame = requestAnimationFrame(() => {
      if (!disposed) changed(scale.getVisibleLogicalRange());
    });
  };
  const changed = (range: ChartRange | null) => {
    if (!range || disposed) return;
    const safe = clampChartRange(range, count);
    if (
      !adjusting &&
      (Math.abs(range.from - safe.from) > 0.001 ||
        Math.abs(range.to - safe.to) > 0.001)
    ) {
      adjusting = true;
      scale.setVisibleLogicalRange(safe);
      adjusting = false;
    }
    onChange?.(scale.getVisibleLogicalRange() ?? safe);
  };
  const resize = () => {
    if (disposed) return;
    const width = Math.max(1, scale.width());
    scale.applyOptions({
      rightOffset: 0,
      fixLeftEdge: true,
      fixRightEdge: true,
      minBarSpacing: width / Math.max(1, count - 1),
      maxBarSpacing: width / Math.max(1, Math.min(7, count - 1)),
      lockVisibleTimeRangeOnResize: true,
    });
    const current = scale.getVisibleLogicalRange();
    if (current) apply(current);
  };
  scale.subscribeVisibleLogicalRangeChange(changed);
  scale.subscribeSizeChange(resize);
  resize();
  return {
    set: apply,
    reset: () => apply({ from: 0, to: Math.max(0, count - 1) }),
    zoom: (factor: number) => {
      const r = scale.getVisibleLogicalRange();
      if (!r) return;
      const mid = (r.from + r.to) / 2,
        half = ((r.to - r.from) * factor) / 2;
      apply({ from: mid - half, to: mid + half });
    },
    destroy: () => {
      disposed = true;
      cancelAnimationFrame(reportFrame);
      scale.unsubscribeVisibleLogicalRangeChange(changed);
      scale.unsubscribeSizeChange(resize);
    },
  };
}
