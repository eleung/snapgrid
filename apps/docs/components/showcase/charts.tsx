"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

export function useSize(): [RefObject<HTMLDivElement | null>, { w: number; h: number }] {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

const ACCENT = "var(--dg-accent)";

export function Sparkline({ data, up = true }: { data: number[]; up?: boolean }) {
  const w = 100;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((v - min) / span) * (h - 6);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const stroke = up ? "var(--dg-up)" : "var(--dg-down)";
  return (
    <svg
      className="sg-spark"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      role="img"
      aria-hidden="true"
    >
      <path d={area} fill={stroke} opacity={0.12} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function AreaChart({ data }: { data: number[] }) {
  const [ref, { w, h }] = useSize();
  return (
    <div ref={ref} className="sg-chart">
      {w > 0 && h > 0 ? <AreaSvg data={data} w={w} h={h} /> : null}
    </div>
  );
}

function AreaSvg({ data, w, h }: { data: number[]; w: number; h: number }) {
  const pad = 6;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (h - pad * 2);
  const line = data
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)} ${h - pad} L${x(0).toFixed(1)} ${h - pad} Z`;
  const gid = `sg-area-${w}-${h}`;
  return (
    <svg width={w} height={h} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.28} />
          <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={ACCENT} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export function BarChart({ data, labels }: { data: number[]; labels?: string[] }) {
  const [ref, { w, h }] = useSize();
  return (
    <div ref={ref} className="sg-chart">
      {w > 0 && h > 0 ? <BarSvg data={data} labels={labels} w={w} h={h} /> : null}
    </div>
  );
}

function BarSvg({
  data,
  labels,
  w,
  h,
}: { data: number[]; labels?: string[]; w: number; h: number }) {
  const labelH = labels ? 16 : 0;
  const pad = 4;
  const max = Math.max(...data) || 1;
  const gap = 8;
  const bw = (w - pad * 2 - gap * (data.length - 1)) / data.length;
  const chartH = h - labelH - pad;
  return (
    <svg width={w} height={h} role="img" aria-hidden="true">
      {data.map((v, i) => {
        const bh = (v / max) * (chartH - pad);
        const bx = pad + i * (bw + gap);
        const by = chartH - bh;
        return (
          <g key={`${i}-${v}`}>
            <rect
              x={bx}
              y={by}
              width={bw}
              height={bh}
              rx={Math.min(4, bw / 2)}
              fill={ACCENT}
              opacity={0.55 + 0.45 * (v / max)}
            />
            {labels ? (
              <text x={bx + bw / 2} y={h - 4} textAnchor="middle" className="sg-chart__axis">
                {labels[i]}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/** A donut chart with a center label, drawn from stroke-dashoffset arcs. */
export function Donut({
  segments,
  centerLabel,
  centerSub,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  centerLabel?: string;
  centerSub?: string;
}) {
  const [ref, { w, h }] = useSize();
  const size = Math.max(0, Math.min(w, h));
  const stroke = Math.max(10, size * 0.16);
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div ref={ref} className="sg-chart sg-chart--donut">
      {size > 0 ? (
        <svg width={size} height={size} role="img" aria-hidden="true">
          <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
            {segments.map((s) => {
              const len = (s.value / total) * c;
              const el = (
                <circle
                  key={s.label}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += len;
              return el;
            })}
          </g>
          {centerLabel ? (
            <text x={size / 2} y={size / 2 - 2} textAnchor="middle" className="sg-donut__num">
              {centerLabel}
            </text>
          ) : null}
          {centerSub ? (
            <text x={size / 2} y={size / 2 + 14} textAnchor="middle" className="sg-donut__sub">
              {centerSub}
            </text>
          ) : null}
        </svg>
      ) : null}
    </div>
  );
}
