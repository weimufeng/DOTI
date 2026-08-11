import "./Progress.css";

export function Progress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="progress" aria-label={`进度 ${current + 1} / ${total}`}>
      <div className="progress__meta">
        <span>
          第 {current + 1} / {total} 题
        </span>
        <span>{pct}%</span>
      </div>
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
