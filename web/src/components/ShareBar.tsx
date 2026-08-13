import { useState, type RefObject } from "react";
import { AnalyticsEvents, trackEvent } from "../lib/analytics";
import {
  captureResultPoster,
  triggerBlobDownload,
} from "../lib/exportResultImage";
import "./ShareBar.css";

function canShareFiles(file: File): boolean {
  try {
    return (
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    );
  } catch {
    return false;
  }
}

export function ShareBar({
  captureRef,
  fileName,
}: {
  captureRef: RefObject<HTMLElement | null>;
  fileName: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveImage() {
    if (saving) return;
    const node = captureRef.current;
    if (!node) {
      setStatus("生成失败，请稍后重试");
      return;
    }

    setSaving(true);
    setStatus("正在生成结果海报…");
    try {
      const blob = await captureResultPoster(node);
      const file = new File([blob], fileName, { type: "image/png" });

      if (canShareFiles(file)) {
        try {
          await navigator.share({
            files: [file],
            title: "DOTI 本命英雄",
          });
          trackEvent(AnalyticsEvents.savePoster, { method: "share" });
          setStatus("已唤起系统分享海报");
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            setStatus(null);
            return;
          }
        }
      }

      triggerBlobDownload(blob, file.name);
      trackEvent(AnalyticsEvents.savePoster, { method: "download" });
      setStatus("结果海报已保存");
    } catch {
      setStatus("生成失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="share-bar">
      <button
        type="button"
        className="btn"
        onClick={saveImage}
        disabled={saving}
      >
        {saving ? "生成中…" : "保存结果海报"}
      </button>
      {status ? <p className="share-bar__status muted">{status}</p> : null}
    </div>
  );
}
