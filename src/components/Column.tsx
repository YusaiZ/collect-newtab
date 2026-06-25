import { useMemo, useState } from "react";
import type { Column as ColumnData } from "../lib/bookmarks";
import { BookmarkItem } from "./BookmarkItem";

interface Props {
  column: ColumnData;
  /** Show the right-hand vertical divider. Omit/hide it on the last column. */
  showDivider?: boolean;
}

/** How many bookmarks to show before collapsing with a "show more" affordance. */
const COLLAPSED_LIMIT = 40;

/**
 * One board column (PRD §3 / §5 收藏夹列).
 *
 * - Fills its grid cell, vertical divider on the right (unless last), title in
 *   the system Song typeface at 22px/600.
 * - Bookmarks render lazily; very long folders collapse after
 *   COLLAPSED_LIMIT entries with an expand toggle (a lightweight, pragmatic
 *   alternative to full virtual scrolling — see PRD §7 渲染策略).
 */
export function Column({ column, showDivider = true }: Props) {
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
        height: "100%",
        padding: "24px 16px 16px",
        borderRight: showDivider ? "1px solid var(--divider)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        // Keep the column within the board viewport so the bookmark list can
        // scroll on its own instead of overflowing and getting clipped.
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          flex: "0 0 auto",
        }}
      >
        <h2
          style={{
            margin: 0,
            // Bumped 18→22px and rendered in the system Song (宋体) typeface.
            fontFamily: '"Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", serif',
            fontSize: 22,
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

      <nav
        className="board-scroll"
        data-col-scroll=""
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
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
            flex: "0 0 auto",
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
