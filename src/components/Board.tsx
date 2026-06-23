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

      // If the cursor is over a scrollable column, let that column scroll
      // vertically first; only translate to board-panning when it can't.
      const target = e.target as Element | null;
      const scrollable = target?.closest("[data-col-scroll]") as HTMLElement | null;
      if (scrollable) {
        const atTop = scrollable.scrollTop <= 0;
        const atBottom =
          scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
        const goingUp = e.deltaY < 0;
        const goingDown = e.deltaY > 0;
        const canScrollCol = (goingUp && !atTop) || (goingDown && !atBottom);
        if (canScrollCol) return; // let the column handle it
      }

      // No vertical scroll available under the cursor → pan the board horizontally.
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
