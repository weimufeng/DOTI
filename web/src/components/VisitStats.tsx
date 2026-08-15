import { useEffect, useState } from "react";
import { loadTongjiStats, type TongjiStats } from "../lib/tongjiStats";
import { ChinaPvMap } from "./ChinaPvMap";
import "./VisitStats.css";

function formatCount(n: number): string {
  if (n >= 10000) {
    const wan = n / 10000;
    return `${wan >= 100 ? wan.toFixed(0) : wan.toFixed(1).replace(/\.0$/, "")}万`;
  }
  return n.toLocaleString("zh-CN");
}

export function VisitStats({ className = "" }: { className?: string }) {
  const [stats, setStats] = useState<TongjiStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTongjiStats().then((data) => {
      if (!cancelled) setStats(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;
  const hasPv = stats.pvCount > 0;
  const districts = stats.districts.filter(
    (d) => d.name && (d.ratio > 0 || d.pvCount > 0),
  );
  if (!hasPv && districts.length === 0) return null;

  return (
    <aside className={`visit-stats ${className}`.trim()} aria-label="访问统计">
      {hasPv ? (
        <div className="visit-stats__pv">
          <p className="visit-stats__label">累计浏览</p>
          <p className="visit-stats__value">{formatCount(stats.pvCount)}</p>
          <p className="visit-stats__range">全站累计</p>
        </div>
      ) : null}

      {districts.length > 0 ? (
        <div className="visit-stats__geo">
          <p className="visit-stats__label">地域分布</p>
          <ChinaPvMap districts={districts} />
        </div>
      ) : null}
    </aside>
  );
}
