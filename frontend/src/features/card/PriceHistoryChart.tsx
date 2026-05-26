import { useState } from "react";
import {
  PRICE_SERIES_COLORS,
  formatUsdPrice,
  type PublishedPriceRow,
} from "../../lib";

type ChartTooltip = { cx: number; cy: number; amount: number; date: string };

export function PriceHistoryChart({
  rows,
  colorsByRowId,
}: {
  rows: PublishedPriceRow[];
  colorsByRowId: Record<string, string>;
}) {
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const series = rows
    .map((row, index) => ({
      row,
      color: colorsByRowId[row.rowId] ?? PRICE_SERIES_COLORS[index % PRICE_SERIES_COLORS.length],
      points: [...row.priceHistory].sort((left, right) =>
        left.observedAt.localeCompare(right.observedAt)
      ),
    }))
    .filter((entry) => entry.points.length > 0);

  if (series.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-border-default bg-[rgba(255,255,255,0.02)] px-4 py-3.5 text-[0.84rem] text-text-tertiary">
        Selected price rows do not have enough 7-day history to plot yet.
      </div>
    );
  }

  const allDates = [
    ...new Set(series.flatMap((entry) => entry.points.map((point) => point.observedAt))),
  ].sort();
  const allAmounts = series.flatMap((entry) => entry.points.map((point) => point.amount));
  const minAmount = Math.min(...allAmounts);
  const maxAmount = Math.max(...allAmounts);
  const padding =
    minAmount === maxAmount
      ? Math.max(minAmount * 0.1, 1)
      : (maxAmount - minAmount) * 0.12;
  const chartMin = Math.max(0, minAmount - padding);
  const chartMax = maxAmount + padding;
  const width = 680;
  const height = 240;
  const margin = { top: 20, right: 20, bottom: 34, left: 54 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const dateSpan = Math.max(allDates.length - 1, 1);
  const amountSpan = Math.max(chartMax - chartMin, 1);

  function xForDate(observedAt: string): number {
    const index = allDates.indexOf(observedAt);
    return margin.left + (chartWidth * (index < 0 ? 0 : index)) / dateSpan;
  }

  function yForAmount(amount: number): number {
    return margin.top + chartHeight - ((amount - chartMin) / amountSpan) * chartHeight;
  }

  const axisLabels = [chartMin, chartMax].map((value) => ({
    value,
    label: formatUsdPrice(value) ?? "$0.00",
    y: yForAmount(value),
  }));
  const dateLabels = allDates.map((value, index) => {
    const parsed = new Date(value);
    const label = Number.isNaN(parsed.getTime())
      ? value
      : new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }).format(parsed);

    return {
      key: value,
      label,
      x: margin.left + (chartWidth * index) / dateSpan,
    };
  });

  return (
    <div
      className="flex flex-col gap-3 rounded-[10px] border border-border-subtle bg-surface-2 p-4"
      data-testid="price-history-chart"
    >
      {/* SVG chart — series colors stay as inline style (runtime values) */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="Seven day market price history chart"
      >
        <rect
          x={margin.left}
          y={margin.top}
          width={chartWidth}
          height={chartHeight}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,255,255,0.08)"
        />

        {axisLabels.map((label) => (
          <g key={label.label}>
            <line
              x1={margin.left}
              y1={label.y}
              x2={margin.left + chartWidth}
              y2={label.y}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="4 6"
            />
            <text
              x={margin.left - 10}
              y={label.y + 4}
              textAnchor="end"
              style={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
            >
              {label.label}
            </text>
          </g>
        ))}

        {dateLabels.map((label) => (
          <text
            key={label.key}
            x={label.x}
            y={height - 10}
            textAnchor="middle"
            style={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
          >
            {label.label}
          </text>
        ))}

        {series.map((entry) => {
          const polylinePoints = entry.points
            .map((point) => `${xForDate(point.observedAt)},${yForAmount(point.amount)}`)
            .join(" ");

          return (
            <g key={entry.row.rowId}>
              {entry.points.length > 1 ? (
                <polyline
                  fill="none"
                  stroke={entry.color}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={polylinePoints}
                />
              ) : null}
              {entry.points.map((point) => {
                const cx = xForDate(point.observedAt);
                const cy = yForAmount(point.amount);
                return (
                  <circle
                    key={`${entry.row.rowId}-${point.observedAt}`}
                    cx={cx}
                    cy={cy}
                    r="5"
                    fill={entry.color}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() =>
                      setTooltip({ cx, cy, amount: point.amount, date: point.observedAt })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </g>
          );
        })}

        {tooltip &&
          (() => {
            const label = formatUsdPrice(tooltip.amount) ?? "";
            const parsed = new Date(tooltip.date);
            const dateLabel = Number.isNaN(parsed.getTime())
              ? tooltip.date
              : new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                }).format(parsed);
            const text = `${dateLabel}: ${label}`;
            const tooltipWidth = text.length * 7.2 + 16;
            const tooltipHeight = 24;
            const tx = Math.min(tooltip.cx - tooltipWidth / 2, width - tooltipWidth - 4);
            const ty =
              tooltip.cy - tooltipHeight - 8 < margin.top
                ? tooltip.cy + 10
                : tooltip.cy - tooltipHeight - 8;
            return (
              <g style={{ pointerEvents: "none" }}>
                <rect
                  x={tx}
                  y={ty}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx="4"
                  style={{
                    fill: "var(--color-surface-2)",
                    stroke: "var(--color-border-default)",
                    strokeWidth: 1,
                  }}
                />
                <text
                  x={tx + tooltipWidth / 2}
                  y={ty + 15.5}
                  textAnchor="middle"
                  style={{
                    fill: "var(--color-text-secondary)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {text}
                </text>
              </g>
            );
          })()}
      </svg>
    </div>
  );
}
