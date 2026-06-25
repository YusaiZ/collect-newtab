import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useBookmarksStore } from "../store/useBookmarksStore";

/**
 * Top search bar (PRD §8 搜索框).
 *
 * - Cmd/Ctrl+K focuses and selects; Esc clears.
 * - Filter logic lives in the store (applyQuery) so the board reacts instantly.
 * - Minimal, borderless input that left-aligns with the first board column.
 */
export function SearchBar() {
  const ref = useRef<HTMLInputElement>(null);
  const query = useBookmarksStore((s) => s.query);
  const setQuery = useBookmarksStore((s) => s.setQuery);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
        ref.current?.select();
      } else if (e.key === "Escape" && document.activeElement === ref.current) {
        setQuery("");
        ref.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setQuery]);

  return (
    // Left-aligned; the wrapper's 16px left padding matches the board column's
    // 16px padding, so the search glyph lines up with the first column's text.
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 24px 16px 16px",
      }}
    >
      <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--muted)",
            pointerEvents: "none",
          }}
        />
        <input
          ref={ref}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索收藏夹或网址…  (⌘/Ctrl + K)"
          spellCheck={false}
          style={{
            // Minimal, borderless: no box, just an underline so the field
            // stays unobtrusive while remaining discoverable.
            width: "100%",
            height: 40,
            padding: "0 28px 0 24px",
            border: "none",
            borderBottom: "1px solid transparent",
            borderRadius: 0,
            background: "transparent",
            color: "var(--fg)",
            fontSize: 16,
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderBottomColor = "var(--fg)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderBottomColor = "transparent";
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="清除搜索"
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              display: "grid",
              placeItems: "center",
              width: 22,
              height: 22,
              border: "none",
              borderRadius: 6,
              background: "transparent",
              color: "var(--muted)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
