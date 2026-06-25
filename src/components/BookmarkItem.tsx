import { useEffect, useState } from "react";
import type { Bookmark } from "../lib/bookmarks";
import { getFavicon, faviconUrl, FAVICON_FALLBACK } from "../lib/favicon";

interface Props {
  bookmark: Bookmark;
}

/**
 * A single bookmark row (PRD §4 / §5 收藏网址项).
 *
 * - 36px tall, 16px favicon (locally cached, see lib/favicon), ellipsised title.
 * - Click → open in current tab; Ctrl/Cmd+Click → open in a new tab.
 */
export function BookmarkItem({ bookmark }: Props) {
  // Start synchronously from the S2 URL so online icons render exactly as
  // before; if a cached data URL exists, getFavicon swaps it in (and that data
  // URL is offline-safe). The placeholder only shows for non-URL bookmarks.
  const [iconSrc, setIconSrc] = useState<string>(
    () => faviconUrl(bookmark.url) ?? FAVICON_FALLBACK,
  );
  const title = bookmark.title || bookmark.url;

  useEffect(() => {
    let cancelled = false;
    // Prefer a cached data URL (offline-safe); falls back to the S2 URL
    // already set above when the cache misses.
    void getFavicon(bookmark.url).then((src) => {
      if (!cancelled && src) setIconSrc(src);
    });
    return () => {
      cancelled = true;
    };
  }, [bookmark.url]);

  const open = (e: React.MouseEvent) => {
    const newTab = e.metaKey || e.ctrlKey;
    e.preventDefault();
    if (newTab && chrome.tabs) {
      void chrome.tabs.create({ url: bookmark.url, active: !e.shiftKey });
    } else {
      // Default: navigate the current (new tab) page.
      window.location.href = bookmark.url;
    }
  };

  return (
    <a
      href={bookmark.url}
      onClick={open}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        height: "36px",
        // Prevent flex column parent from squashing this row when the list
        // overflows — keep each row a fixed 36px so the nav scrolls instead.
        flex: "0 0 36px",
        padding: "0 8px",
        borderRadius: "6px",
        textDecoration: "none",
        color: "var(--fg)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        userSelect: "none",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <img
        src={iconSrc}
        alt=""
        width={16}
        height={16}
        loading="lazy"
        // If even the cached data URL somehow fails, fall back to the glyph.
        onError={() => setIconSrc(FAVICON_FALLBACK)}
        style={{
          width: 16,
          height: 16,
          flex: "0 0 16px",
          borderRadius: 3,
          objectFit: "contain",
        }}
      />
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontSize: 14,
          lineHeight: "20px",
        }}
      >
        {title}
      </span>
    </a>
  );
}
