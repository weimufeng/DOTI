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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

function isSameOrigin(url: string): boolean {
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * html-to-image on mobile Safari often paints cross-origin / filtered <img>
 * as black. Embed same-origin portraits as data URLs and strip CSS filters
 * for the duration of the capture.
 */
async function prepareNodeForCapture(node: HTMLElement): Promise<() => void> {
  const restorers: Array<() => void> = [];

  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const url = img.currentSrc || img.src;
      if (!url || url.startsWith("data:")) {
        try {
          if (!img.complete) await img.decode();
        } catch {
          /* ignore */
        }
        return;
      }

      if (!isSameOrigin(url)) {
        // Cross-origin (e.g. Steam CDN) cannot be rasterized → leave blank area
        // rather than a black rectangle if we clear the src temporarily.
        const prev = img.getAttribute("src");
        img.removeAttribute("src");
        restorers.push(() => {
          if (prev != null) img.setAttribute("src", prev);
          else img.src = url;
        });
        return;
      }

      try {
        const res = await fetch(url, { cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const dataUrl = await blobToDataUrl(await res.blob());
        const prev = img.src;
        img.src = dataUrl;
        restorers.push(() => {
          img.src = prev;
        });
        try {
          await img.decode();
        } catch {
          /* ignore */
        }
      } catch {
        /* keep original src */
      }
    }),
  );

  const filtered = Array.from(
    node.querySelectorAll<HTMLElement>(".hero-card__art img, img"),
  );
  for (const el of filtered) {
    if (!el.style.filter && getComputedStyle(el).filter === "none") continue;
    const prev = el.style.filter;
    el.style.filter = "none";
    restorers.push(() => {
      el.style.filter = prev;
    });
  }

  return () => {
    for (const restore of restorers.reverse()) restore();
  };
}

/** Capture a result-page DOM node (everything above the share bar). */
export async function captureResultPoster(node: HTMLElement): Promise<Blob> {
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }

  const restore = await prepareNodeForCapture(node);

  try {
    // Give layout a frame after swapping data-URL images.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const blob = await toBlob(node, {
      cacheBust: false,
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
  } finally {
    restore();
  }
}
