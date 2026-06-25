import { useEffect, useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useBookmarksStore } from "../store/useBookmarksStore";
import { Column } from "./Column";

/** Number of columns shown per page — overflow paginates vertically. */
const COLUMNS_PER_PAGE = 4;

/**
 * The bookmark board (PRD §4 / §5).
 *
 * Columns are laid out in a 4-wide grid; when there are more than four they
 * paginate page-by-page rather than scrolling horizontally. The pager
 * (▲ / ▼) sits in the top-right corner and only appears when needed.
 */
export function Board() {
  const columns = useBookmarksStore((s) => s.visibleColumns);
  const status = useBookmarksStore((s) => s.status);

  const pageCount = Math.ceil(columns.length / COLUMNS_PER_PAGE) || 1;
  const [page, setPage] = useState(0);

  // Keep the active page in range as columns change (search/filter, edits…).
  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  const visible = useMemo(
    () =>
      columns.slice(
        page * COLUMNS_PER_PAGE,
        page * COLUMNS_PER_PAGE + COLUMNS_PER_PAGE,
      ),
    [columns, page],
  );

  const canPrev = page > 0;
  const canNext = page < pageCount - 1;

  if (status === "ready" && columns.length === 0) {
    return (
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}
      >
        <div>
          <p style={{ fontSize: 16, marginBottom: 6 }}>没有可显示的收藏夹</p>
          <p style={{ fontSize: 13 }}>
            在 Chrome 书签栏里添加一些文件夹与书签，回到新标签页即可看到。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      {/* Pager, top-right corner. Only rendered when there is more than one page. */}
      {pageCount > 1 && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            background: "var(--bg)",
            borderRadius: 10,
            padding: 4,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <PagerButton
            active={canPrev}
            label="上一页"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronUp size={18} />
          </PagerButton>
          <span
            style={{
              fontSize: 11,
              color: "var(--muted)",
              textAlign: "center",
              lineHeight: 1,
              padding: "2px 0",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {page + 1}/{pageCount}
          </span>
          <PagerButton
            active={canNext}
            label="下一页"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            <ChevronDown size={18} />
          </PagerButton>
        </div>
      )}

      {/* 4-column grid page. Fills the available width so columns share space
          evenly instead of overflowing horizontally. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(visible.length, COLUMNS_PER_PAGE)}, minmax(0, 1fr))`,
        }}
      >
        {visible.map((col, i) => (
          <Column
            key={col.id}
            column={col}
            showDivider={i < visible.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

/** A circular pager button that dims to "disabled" when `active` is false. */
function PagerButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      disabled={!active}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        display: "grid",
        placeItems: "center",
        border: "none",
        borderRadius: 8,
        background: "transparent",
        color: active ? "var(--fg)" : "var(--muted)",
        opacity: active ? 1 : 0.35,
        cursor: active ? "pointer" : "default",
        transition: "background 0.12s ease",
      }}
      onMouseEnter={(e) => {
        if (active) e.currentTarget.style.background = "var(--hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
