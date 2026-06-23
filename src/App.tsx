import { useEffect } from "react";
import { useBookmarksStore } from "./store/useBookmarksStore";
import { useTheme } from "./lib/useTheme";
import { SearchBar } from "./components/SearchBar";
import { Board } from "./components/Board";

export default function App() {
  const load = useBookmarksStore((s) => s.load);
  const status = useBookmarksStore((s) => s.status);

  useTheme();

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div
      style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}
    >
      <SearchBar />
      <main style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {status === "loading" && (
          <div className="absolute inset-0 grid place-items-center" style={{ color: "var(--muted)" }}>
            加载收藏夹…
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 grid place-items-center" style={{ color: "var(--muted)" }}>
            无法读取收藏夹（请确认已授予 bookmarks 权限）。
          </div>
        )}
        <Board />
      </main>
    </div>
  );
}
