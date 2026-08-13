import { DIM_LABELS, DIMS } from "../lib/scoring";
import type { DimKey } from "../lib/types";
import "./DimRadar.css";

const MAX = 10;

/** Literal colors (match tokens.css) so html-to-image capture keeps them. */
const C = {
  inkMuted: "#b9a890",
  accentHot: "#e07a3a",
  ink: "#f3e6d4",
  gridFill: "rgba(198, 160, 110, 0.04)",
  gridStroke: "rgba(198, 160, 110, 0.18)",
  axis: "rgba(198, 160, 110, 0.2)",
  area: "rgba(224, 122, 58, 0.28)",
  stroke: "rgba(224, 122, 58, 0.95)",
} as const;

function polar(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.sin(angle),
    y: cy - r * Math.cos(angle),
  };
}

export function DimRadar({
  values,
  className = "",
}: {
  values: Record<DimKey, number>;
  className?: string;
}) {
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 108;
  const n = DIMS.length;
  const step = (Math.PI * 2) / n;

  const rings = [0.25, 0.5, 0.75, 1];
  const gridPolys = rings.map((t) =>
    DIMS.map((_, i) => {
      const p = polar(cx, cy, radius * t, i * step);
      return `${p.x},${p.y}`;
    }).join(" "),
  );

  const axes = DIMS.map((key, i) => {
    const outer = polar(cx, cy, radius, i * step);
    const label = polar(cx, cy, radius + 42, i * step);
    const shapeV = Math.min(MAX, Math.max(0, values[key] ?? 0));
    const point = polar(cx, cy, (shapeV / MAX) * radius, i * step);
    const score = values[key] ?? 0;
    return {
      key,
      outer,
      label,
      point,
      text: DIM_LABELS[key],
      scoreText: score.toFixed(1),
    };
  });

  const valuePoly = axes.map((a) => `${a.point.x},${a.point.y}`).join(" ");

  return (
    <div className={`dim-radar ${className}`.trim()}>
      <p className="dim-radar__title">本命英雄 · 标准十维（0–10）</p>
      <svg
        className="dim-radar__svg"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="本命英雄标准十维雷达图"
      >
        {gridPolys.map((pts) => (
          <polygon
            key={pts}
            points={pts}
            fill={C.gridFill}
            stroke={C.gridStroke}
            strokeWidth={1}
          />
        ))}
        {axes.map((a) => (
          <line
            key={a.key}
            x1={cx}
            y1={cy}
            x2={a.outer.x}
            y2={a.outer.y}
            stroke={C.axis}
            strokeWidth={1}
          />
        ))}
        <polygon points={valuePoly} fill={C.area} stroke="none" />
        <polygon
          points={valuePoly}
          fill="none"
          stroke={C.stroke}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {axes.map((a) => (
          <circle
            key={`${a.key}-dot`}
            cx={a.point.x}
            cy={a.point.y}
            r={3.5}
            fill={C.ink}
            stroke={C.accentHot}
            strokeWidth={1.5}
          />
        ))}
        {axes.map((a) => (
          <text
            key={`${a.key}-label`}
            x={a.label.x}
            y={a.label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            fontWeight={500}
            fill={C.inkMuted}
          >
            <tspan x={a.label.x} dy="-0.75em" fill={C.inkMuted}>
              {a.text}
            </tspan>
            <tspan
              x={a.label.x}
              dy="1.45em"
              fill={C.accentHot}
              fontWeight={700}
            >
              {a.scoreText}
            </tspan>
          </text>
        ))}
      </svg>
    </div>
  );
}
