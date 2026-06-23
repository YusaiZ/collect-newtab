/**
 * Resolve a favicon URL for a given bookmark URL.
 *
 * Strategy (PRD §4 网站图标):
 *  1. Google's public S2 favicon service — reliable, no extra permissions,
 *     works in the new tab page context without CSP issues.
 *  2. Callers render an <img loading="lazy"> with an onError fallback so a
 *     broken/missing icon degrades gracefully to a placeholder glyph.
 *
 * `chrome://favicon/` is intentionally avoided: in MV3 it requires the
 * "favicon" permission and resolves against the extension origin, which adds
 * friction for little benefit over S2.
 */
export function faviconUrl(url: string, size = 32): string | null {
  let href: URL;
  try {
    href = new URL(url);
  } catch {
    return null;
  }
  const domain = href.hostname || href.pathname;
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/** A data-URL placeholder shown when the favicon fails to load. */
export const FAVICON_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="%23e5e7eb"/><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5v5A1.5 1.5 0 0 1 10.5 12h-5A1.5 1.5 0 0 1 4 10.5z" fill="none" stroke="%239ca3af"/></svg>`,
  );
