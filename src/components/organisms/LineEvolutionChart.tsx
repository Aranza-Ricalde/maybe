"use client";

import { useId, useRef, useState } from "react";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { formatCurrency, formatMonthYearShort, formatShortDate } from "@/lib/format";

const WIDTH = 600;
const HEIGHT = 120;
const PAD_Y = 10;

export interface LineEvolutionPoint {
  date: string;
  value: number;
}

export interface LineEvolutionChartProps {
  series: LineEvolutionPoint[];
  dateGranularity: "daily" | "monthly";
  emptyMessage: string;
  tableCaption: string;
}

export function LineEvolutionChart({ series, dateGranularity, emptyMessage, tableCaption }: LineEvolutionChartProps) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const dateLabelFormatter = dateGranularity === "daily" ? formatShortDate : formatMonthYearShort;

  if (series.length < 2) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  const values = series.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.15, Math.abs(max) * 0.01, 1);
  const scaleY = (v: number) => HEIGHT - PAD_Y - ((v - (min - pad)) / (max - min + pad * 2)) * (HEIGHT - PAD_Y * 2);
  const scaleX = (i: number) => (i / (series.length - 1)) * WIDTH;

  const points = series.map((p, i) => [scaleX(i), scaleY(p.value)] as const);
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0]},${HEIGHT} L${points[0][0]},${HEIGHT} Z`;

  const last = series[series.length - 1];
  const [lastX, lastY] = points[points.length - 1];

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const index = Math.round((relativeX / WIDTH) * (series.length - 1));
    setHoverIndex(Math.min(series.length - 1, Math.max(0, index)));
  }

  const hovered = hoverIndex != null ? series[hoverIndex] : null;
  const hoveredPoint = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-28 w-full touch-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label={`${tableCaption}: de ${formatCurrency(series[0].value)} a ${formatCurrency(last.value)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r={4} fill="var(--accent)" stroke="var(--background)" strokeWidth={2} />
        {hoveredPoint && (
          <>
            <line x1={hoveredPoint[0]} x2={hoveredPoint[0]} y1={0} y2={HEIGHT} stroke="var(--separator)" strokeWidth={1} />
            <circle cx={hoveredPoint[0]} cy={hoveredPoint[1]} r={4} fill="var(--accent)" stroke="var(--background)" strokeWidth={2} />
          </>
        )}
      </svg>

      {hoverIndex == null && (
        <CurrencyText
          cents={last.value}
          size="xs"
          weight="medium"
          className="pointer-events-none absolute"
          style={{ left: `${(lastX / WIDTH) * 100}%`, top: 0, transform: "translate(-100%, -4px)" }}
        />
      )}

      {hovered && hoveredPoint && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-separator bg-surface p-2 text-xs shadow-lg"
          style={{ left: `${(hoveredPoint[0] / WIDTH) * 100}%`, top: 0 }}
        >
          <CurrencyText cents={hovered.value} size="xs" weight="semibold" />
          <Text size="xs" tone="muted">
            {dateLabelFormatter(hovered.date)}
          </Text>
        </div>
      )}

      <table className="sr-only">
        <caption>{tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {series.map((p) => (
            <tr key={p.date}>
              <td>{dateLabelFormatter(p.date)}</td>
              <td>{formatCurrency(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
