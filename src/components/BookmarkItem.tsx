import { useState } from "react";
import type { Bookmark } from "../lib/bookmarks";
import { faviconUrl, FAVICON_FALLBACK } from "../lib/favicon";

interface Props {
  bookmark: Bookmark;
}

/**
 * A single bookmark row (PRD §4 / §5 收藏网址项).
 *
 * - 36px tall, 16px lazy-loaded favicon, ellipsised title.
 * - Click → open in current tab; Ctrl/Cmd+Click → open in a new tab.
 */
export function BookmarkItem({ bookmark }: Props) {
  const [iconError, setIconError] = useState(false);
  const fav = iconError ? null : faviconUrl(bookmark.url);
  const title = bookmark.title || bookmark.url;

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
        src={fav ?? FAVICON_FALLBACK}
        alt=""
        width={16}
        height={16}
        loading="lazy"
        onError={() => setIconError(true)}
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
