// A paste into a text field that carries text (Word, Excel and Numbers put
// a picture of the copied text next to it) is a text paste: it is left to
// the field, never taken as a page.
function isTextPaste(e: ClipboardEvent): boolean {
  const target = e.target;
  const editable =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable);
  return editable && !!e.clipboardData?.types.includes("text/plain");
}

// The files a paste carries that can become pages: images (screenshots
// arrive as image/png), HEIC and PDFs. Anything else — plain text above all
// — yields an empty list, so the caller leaves the paste alone.
export function pastedPageFiles(e: ClipboardEvent): File[] {
  if (isTextPaste(e)) return [];
  return Array.from(e.clipboardData?.files ?? []).filter(
    (f) =>
      f.type.startsWith("image/") ||
      f.type === "application/pdf" ||
      /\.(pdf|heic|heif)$/i.test(f.name)
  );
}
