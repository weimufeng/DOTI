import { useState } from "react";
import map from "../data/china-provinces.json";
import type { TongjiDistrict } from "../lib/tongjiStats";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function heatFill(t: number): string {
  const x = Math.min(1, Math.max(0, t));
  const r = Math.round(lerp(58, 224, x));
  const g = Math.round(lerp(36, 122, x));
  const b = Math.round(lerp(24, 58, x));
  const a = lerp(0.22, 0.95, x);
  return `rgba(${r},${g},${b},${a})`;
}

function formatCount(n: number): string {
  return n.toLocaleString("zh-CN");
}

function formatRatio(ratio: number): string {
  const pct = ratio <= 1 ? ratio * 100 : ratio;
  return `${pct >= 10 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

export function ChinaPvMap({ districts }: { districts: TongjiDistrict[] }) {
  const byName = new Map(districts.map((d) => [d.name, d]));
  const maxPv = Math.max(1, ...districts.map((d) => d.pvCount));
  const [tip, setTip] = useState<{
    name: string;
    pvCount: number;
    ratio: number;
  } | null>(null);

  return (
    <div className="visit-stats__map-wrap">
      <svg
        className="visit-stats__map"
        viewBox={`0 0 ${map.width} ${map.height}`}
        role="img"
        aria-label="中国省份浏览量分布"
      >
        {map.provinces.map((p) => {
          const d = byName.get(p.name);
          const t = d && d.pvCount > 0 ? Math.sqrt(d.pvCount / maxPv) : 0;
          return (
            <path
              key={p.name}
              d={p.d}
              fill={t > 0 ? heatFill(t) : "rgba(198,160,110,0.07)"}
              stroke="rgba(243,230,212,0.18)"
              strokeWidth={0.6}
              onMouseEnter={() =>
                setTip({
                  name: p.name,
                  pvCount: d?.pvCount ?? 0,
                  ratio: d?.ratio ?? 0,
                })
              }
              onMouseLeave={() => setTip(null)}
            >
              <title>
                {p.name}
                {d && d.pvCount > 0
                  ? ` ${formatCount(d.pvCount)} · ${formatRatio(d.ratio)}`
                  : " 暂无数据"}
              </title>
            </path>
          );
        })}
      </svg>
      {tip ? (
        <p className="visit-stats__tooltip">
          {tip.name}
          {tip.pvCount > 0
            ? ` · ${formatCount(tip.pvCount)} · ${formatRatio(tip.ratio)}`
            : " · 暂无数据"}
        </p>
      ) : (
        <p className="visit-stats__legend">
          <span>低</span>
          <span className="visit-stats__legend-bar" aria-hidden />
          <span>高</span>
        </p>
      )}
    </div>
  );
}
