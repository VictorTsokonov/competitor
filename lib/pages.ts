// Client-side page preparation. Every upload format — photos, screenshots,
// HEIC, multi-page PDFs — becomes an ordered list of downscaled JPEG data
// URLs before anything reaches the server; the model only ever sees images.
// PDFs are rendered here with pdf.js (lazy-loaded) so the student can see
// and pick pages, and so the server never receives a raw PDF.

export type PageImage = {
  id: string;
  dataUrl: string; // JPEG, long edge ≤ LONG_EDGE px
  label: string; // "scan.pdf · p3" or the file name
  // Recorded example pages are served from public/; the full page opens
  // from its thumbnail so the handwriting can be read.
  href?: string;
};

export const MAX_PAGES_PER_PDF = 20;
export const MAX_ATTEMPT_PAGES = 8;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
// Shared with scripts/record-example.ts, which prepares pages the same way.
export const LONG_EDGE = 1600;
export const JPEG_QUALITY = 0.8;

export type PagesResult = {
  pages: PageImage[];
  // One user-facing line per file that could not be read; pages from the
  // readable files still come back.
  errors: string[];
};

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `page-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function isHeic(file: File): boolean {
  return /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

function looksLikeImage(file: File): boolean {
  return file.type.startsWith("image/") || isHeic(file);
}

function scaledCanvas(width: number, height: number): HTMLCanvasElement {
  const scale = Math.min(1, LONG_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  return canvas;
}

async function decodeImage(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    if (!isHeic(file)) {
      throw new Error(`Couldn't read ${file.name} — is it a valid image?`);
    }
  }
  // HEIC that the browser can't decode natively: convert via heic2any.
  try {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    return await createImageBitmap(Array.isArray(converted) ? converted[0] : converted);
  } catch {
    throw new Error(
      `Couldn't read the HEIC file ${file.name} — export it as JPEG or PDF and try again.`
    );
  }
}

async function imageToPage(file: File): Promise<PageImage> {
  const bitmap = await decodeImage(file);
  try {
    const canvas = scaledCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { id: uid(), dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY), label: file.name };
  } finally {
    bitmap.close();
  }
}

async function pdfToPages(
  file: File,
  onProgress?: (note: string) => void
): Promise<PageImage[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const doc = await task.promise.catch(() => {
    throw new Error(`Couldn't open ${file.name} — is it a valid PDF?`);
  });
  try {
    if (doc.numPages > MAX_PAGES_PER_PDF) {
      throw new Error(
        `${file.name} has ${doc.numPages} pages (max ${MAX_PAGES_PER_PDF}) — export just this problem's pages and try again.`
      );
    }
    const pages: PageImage[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      onProgress?.(`Reading ${file.name} — page ${n}/${doc.numPages}…`);
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, LONG_EDGE / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      ctx.fillStyle = "#fff"; // PDFs can be transparent; pages must not be
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      pages.push({
        id: uid(),
        dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
        label: `${file.name} · p${n}`,
      });
    }
    return pages;
  } finally {
    await task.destroy();
  }
}

export async function filesToPages(
  files: Iterable<File | undefined>,
  onProgress?: (note: string) => void
): Promise<PagesResult> {
  const pages: PageImage[] = [];
  const errors: string[] = [];
  for (const file of files) {
    if (!file) continue;
    try {
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(`${file.name} is over 25MB — compress or split it first.`);
      }
      if (isPdf(file)) {
        pages.push(...(await pdfToPages(file, onProgress)));
      } else if (looksLikeImage(file)) {
        onProgress?.(`Reading ${file.name}…`);
        pages.push(await imageToPage(file));
      } else {
        throw new Error(
          `${file.name} isn't a supported format — use photos (PNG, JPEG, WebP, HEIC) or a PDF.`
        );
      }
    } catch (e: unknown) {
      errors.push(e instanceof Error ? e.message : `Couldn't read ${file.name}.`);
    }
  }
  return { pages, errors };
}
