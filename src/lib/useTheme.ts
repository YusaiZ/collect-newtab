import { useEffect } from "react";

/**
 * Sync the `.dark` class on <html> with the OS color-scheme preference.
 *
 * PRD §8 深色模式: auto-follow the system. The CSS variables in index.css are
 * themed under `.dark`, so flipping this class re-skins the whole board.
 */
export function useTheme(): void {
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (e: MediaQueryListEvent | MediaQueryList) => {
      document.documentElement.classList.toggle("dark", "matches" in e ? e.matches : mql.matches);
    };
    apply(mql);
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);
}
