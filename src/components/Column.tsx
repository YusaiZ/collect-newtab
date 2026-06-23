import { useMemo, useState } from "react";
import type { Column as ColumnData } from "../lib/bookmarks";
import { BookmarkItem } from "./BookmarkItem";

interface Props {
  column: ColumnData;
}

/** How many bookmarks to show before collapsing with a "show more" affordance. */
const COLLAPSED_LIMIT = 40;

/**
 * One board column (PRD §3 / §5 收藏夹列).
 *
 * - Fixed 260px width, vertical divider on the right, 18px/600 title.
 * - Bookmarks render lazily; very long folders collapse after
 *   COLLAPSED_LIMIT entries with an expand toggle (a lightweight, pragmatic
 *   alternative to full virtual scrolling — see PRD §7 渲染策略).
 */
export function Column({ column }: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = column.bookmarks.length;
  const overLimit = total > COLLAPSED_LIMIT;
  const visible = useMemo(
    () => (expanded || !overLimit ? column.bookmarks : column.bookmarks.slice(0, COLLAPSED_LIMIT)),
    [column.bookmarks, expanded, overLimit],
  );

  return (
    <section
      style={{
        width: 260,
        flex: "0 0 260px",
        padding: "24px 16px",
        borderRight: "1px solid var(--divider)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <header style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: "var(--fg)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {column.title}
        </h2>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>({total})</span>
      </header>

      <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {visible.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted)", padding: "6px 8px" }}>
            空
          </div>
        ) : (
          visible.map((b) => <BookmarkItem key={b.id} bookmark={b} />)
        )}
      </nav>

      {overLimit && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            fontSize: 13,
            color: "var(--muted)",
            borderRadius: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          {expanded ? "收起" : `显示更多 ${total - COLLAPSED_LIMIT}…`}
        </button>
      )}
    </section>
  );
}
