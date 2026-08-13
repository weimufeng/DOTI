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

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Same-origin SVG so html-to-image can rasterize when the portrait is unavailable. */
function nameCardDataUrl(label: string): string {
  const ch = escapeXml(label.trim().slice(0, 1) || "·");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <radialGradient id="g" cx="30%" cy="20%">
        <stop offset="0%" stop-color="#3a2418"/>
        <stop offset="100%" stop-color="#161210"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" fill="url(#g)"/>
    <text x="400" y="255" text-anchor="middle" fill="#c45a28" font-size="160" font-weight="600" font-family="PingFang SC,Hiragino Sans GB,sans-serif">${ch}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function embedSameOrigin(img: HTMLImageElement, url: string): Promise<boolean> {
  if (!url || url.startsWith("data:") || !isSameOrigin(url)) return false;
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return false;
    const blob = await res.blob();
    if (blob.size < 500) return false;
    img.src = await blobToDataUrl(blob);
    try {
      await img.decode();
    } catch {
      /* ignore */
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * html-to-image on mobile Safari often paints cross-origin / filtered <img>
 * as black. Embed same-origin assets as data URLs; if a portrait only exists
 * on a CDN, swap in a name card instead of a blank or black rectangle.
 */
async function prepareNodeForCapture(node: HTMLElement): Promise<() => void> {
  const restorers: Array<() => void> = [];

  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const prevSrc = img.getAttribute("src");
      restorers.push(() => {
        if (prevSrc != null) img.setAttribute("src", prevSrc);
        else img.removeAttribute("src");
      });

      const current = img.currentSrc || img.src;
      if (current.startsWith("data:")) {
        try {
          if (!img.complete) await img.decode();
        } catch {
          /* ignore */
        }
        return;
      }

      const localSrc = img.dataset.localSrc;
      if (localSrc && (await embedSameOrigin(img, localSrc))) return;
      if (current && (await embedSameOrigin(img, current))) return;

      const isPortrait =
        Boolean(localSrc) || Boolean(img.closest(".hero-card__art"));
      if (!isPortrait) return;

      img.src = nameCardDataUrl(img.alt || "");
      try {
        await img.decode();
      } catch {
        /* ignore */
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

function waitFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    const tick = (left: number) => {
      if (left <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => tick(left - 1));
    };
    tick(count);
  });
}

/** Capture a result-page DOM node (everything above the share bar). */
export async function captureResultPoster(node: HTMLElement): Promise<Blob> {
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }

  const restore = await prepareNodeForCapture(node);
  const prevCapturing = node.getAttribute("data-capturing");
  node.setAttribute("data-capturing", "1");

  try {
    await waitFrames(2);

    const blob = await toBlob(node, {
      cacheBust: false,
      skipFonts: true,
      pixelRatio: Math.min(2, window.devicePixelRatio || 2),
      backgroundColor: "#1a1612",
      style: {
        fontFamily:
          '"PingFang SC","Hiragino Sans GB","Heiti SC","Noto Sans SC","Microsoft YaHei",sans-serif',
      },
      filter: (el) => {
        if (!(el instanceof HTMLElement)) return true;
        return !el.dataset.captureIgnore;
      },
    });
    if (!blob) throw new Error("capture failed");
    return blob;
  } finally {
    if (prevCapturing == null) node.removeAttribute("data-capturing");
    else node.setAttribute("data-capturing", prevCapturing);
    restore();
  }
}
