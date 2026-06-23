import { useEffect, useRef } from "react";
import { useBookmarksStore } from "../store/useBookmarksStore";
import { Column } from "./Column";

/**
 * The horizontally-scrolling board (PRD §4 / §5 横向布局 / §5 超出宽度时横向滚动).
 *
 * Wheel handling: a plain vertical mouse wheel scrolls the board horizontally
 * (since the content only overflows on x). Shift+wheel is already horizontal in
 * most browsers but we normalise it too; touchpads pan natively.
 */
export function Board() {
  const ref = useRef<HTMLDivElement>(null);
  const columns = useBookmarksStore((s) => s.visibleColumns);
  const status = useBookmarksStore((s) => s.status);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Let the browser handle genuine horizontal input (shift+wheel, touchpad).
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      // Only translate vertical→horizontal when there's horizontal overflow.
      if (el.scrollWidth <= el.clientWidth) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };

    // `passive: false` so we can preventDefault the vertical scroll.
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

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
    <div
      ref={ref}
      className="board-scroll"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "row",
        overflowX: "auto",
        overflowY: "hidden",
      }}
    >
      {columns.map((col) => (
        <Column key={col.id} column={col} />
      ))}
    </div>
  );
}
