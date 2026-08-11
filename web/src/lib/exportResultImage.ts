import { toBlob } from "html-to-image";

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Capture a result-page DOM node (everything above the share bar). */
export async function captureResultPoster(node: HTMLElement): Promise<Blob> {
  // Warm up fonts; skip embedding remote Google Fonts (CORS breaks html-to-image).
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }

  const blob = await toBlob(node, {
    cacheBust: true,
    skipFonts: true,
    pixelRatio: Math.min(2, window.devicePixelRatio || 2),
    backgroundColor: "#1a1612",
    filter: (el) => {
      if (!(el instanceof HTMLElement)) return true;
      return !el.dataset.captureIgnore;
    },
  });
  if (!blob) throw new Error("capture failed");
  return blob;
}
