import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useBookmarksStore } from "../store/useBookmarksStore";

/**
 * Top search bar (PRD §8 搜索框).
 *
 * - Cmd/Ctrl+K focuses and selects; Esc clears.
 * - Filter logic lives in the store (applyQuery) so the board reacts instantly.
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 24px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
        }}
      >
        <Search
          size={16}
          style={{
            position: "absolute",
            left: 12,
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
            width: "100%",
            height: 40,
            padding: "0 36px 0 34px",
            borderRadius: 10,
            border: "1px solid var(--input-border)",
            background: "var(--input-bg)",
            color: "var(--fg)",
            fontSize: 14,
            outline: "none",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--fg)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--input-border)")}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="清除搜索"
            style={{
              position: "absolute",
              right: 8,
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
