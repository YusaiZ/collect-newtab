/**
 * Favicon resolution with a persistent local cache (PRD §4 网站图标).
 *
 * Online path is unchanged from the original: the <img> loads Google's S2
 * favicon URL directly, which always worked in the new-tab page. On top of
 * that we transparently cache each icon as a data URL in chrome.storage.local
 * so it still renders when S2 is unreachable (offline / blocked):
 *
 *  1. chrome.storage.local hit  → return the cached data URL (offline-safe).
 *  2. cache miss                → return the S2 URL (loads natively online) AND
 *                                  kick off a background prefetch that writes
 *                                  a data URL back to storage for next time.
 *
 * The prefetch never blocks rendering and silently no-ops on failure, so the
 * online experience is exactly as before. `chrome://favicon/` is intentionally
 * avoided: in MV3 it needs the "favicon" permission and resolves against the
 * extension origin, which adds friction for little benefit over S2 + caching.
 */

/** Favicon size cached from S2 (2x for crisp 16px display). */
const FAVICON_SIZE = 32;

/** In-memory set of domains already prefetched this session — avoids repeat
 *  background work after a storage miss. */
const prefetched = new Set<string>();

/** In-flight prefetches, keyed by domain — de-dupes concurrent requests. */
const pending = new Map<string, Promise<void>>();

function hasStorage(): boolean {
  return typeof chrome !== "undefined" && !!chrome.storage?.local;
}

/** Extract the hostname used both as the S2 query and the cache key. */
function domainOf(url: string): string | null {
  try {
    const href = new URL(url);
    return href.hostname || null;
  } catch {
    return null;
  }
}

/**
 * The Google S2 favicon URL for a bookmark URL. (Kept synchronous for the
 * online <img> path — the original, reliable behaviour.)
 */
export function faviconUrl(url: string, size = FAVICON_SIZE): string | null {
  const domain = domainOf(url);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/** Read a cached data URL for the domain from persistent storage. */
async function readStorage(domain: string): Promise<string | null> {
  const key = `fav:${domain}`;
  try {
    const res = await chrome.storage.local.get(key);
    return res[key] ?? null;
  } catch {
    return null;
  }
}

/** Persist a data URL for the domain. Failures (quota etc.) are non-fatal. */
async function writeStorage(domain: string, dataUrl: string): Promise<void> {
  try {
    await chrome.storage.local.set({ [`fav:${domain}`]: dataUrl });
  } catch {
    /* ignore — storage is best-effort */
  }
}

/** Convert a fetched image blob into a base64 data URL. */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Fetch from Google S2 in the background, convert to a data URL, persist it.
 *  Used only to warm the cache; rendering never waits on this. */
async function prefetchIcon(domain: string): Promise<void> {
  try {
    const res = await fetch(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${FAVICON_SIZE}`,
    );
    if (!res.ok) return;
    const blob = await res.blob();
    if (blob.size === 0) return;
    const dataUrl = await blobToDataURL(blob);
    await writeStorage(domain, dataUrl);
  } catch {
    // Network/CORS error — nothing cached; we'll retry another session.
  }
}

/**
 * Resolve the best available favicon source for a bookmark URL.
 *
 * Returns a cached data URL if we have one (offline-safe), otherwise the S2
 * URL for direct <img> loading (online). As a side effect it warms the cache
 * for next time. Returns `null` only for non-URL bookmarks.
 */
export async function getFavicon(
  url: string,
  size = FAVICON_SIZE,
): Promise<string | null> {
  const domain = domainOf(url);
  if (!domain) return null;

  const s2 = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;

  // Outside the extension (plain dev tab) there is no storage to cache into —
  // just hand back the S2 URL and let the <img> load it natively.
  if (!hasStorage()) return s2;

  // 1. Persistent cache hit → offline-safe data URL.
  const cached = await readStorage(domain);
  if (cached) return cached;

  // 2. Cache miss → return S2 for online rendering, prefetch in the background
  //    (de-duped per session) so the icon is cached for next time.
  if (!prefetched.has(domain)) {
    prefetched.add(domain);
    let inflight = pending.get(domain);
    if (!inflight) {
      inflight = prefetchIcon(domain).finally(() => pending.delete(domain));
      pending.set(domain, inflight);
    }
  }
  return s2;
}

/**
 * A data-URL placeholder shown when the favicon fails to load.
 *
 * NOTE: colours use a literal `#`; encodeURIComponent turns each into `%23`,
 * so we must NOT pre-encode here (doing both double-encodes to `%2523`, which
 * is an invalid fill and the rect falls back to black).
 */
export const FAVICON_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#e5e7eb"/><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5v5A1.5 1.5 0 0 1 10.5 12h-5A1.5 1.5 0 0 1 4 10.5z" fill="none" stroke="#9ca3af"/></svg>`,
  );
