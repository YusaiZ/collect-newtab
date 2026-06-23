import { create } from "zustand";
import {
  getBookmarkTree,
  treeToColumns,
  type Column,
} from "../lib/bookmarks";

/**
 * Demo data shown ONLY when the chrome.bookmarks API is absent — i.e. when the
 * page is opened outside the extension (e.g. `npm run dev` in a plain tab) so
 * the layout/visuals can be previewed. In the real extension this is never used.
 */
function demoColumns(): Column[] {
  const col = (title: string, items: [string, string][]): Column => ({
    id: title,
    title,
    bookmarks: items.map(([t, u], i) => ({
      id: `${title}-${i}`,
      title: t,
      url: u,
    })),
  });
  return [
    col("开发工具", [
      ["GitHub", "https://github.com"],
      ["Cursor", "https://cursor.com"],
      ["Vercel", "https://vercel.com"],
      ["Stack Overflow", "https://stackoverflow.com"],
      ["MDN Web Docs", "https://developer.mozilla.org"],
    ]),
    col("AI", [
      ["ChatGPT", "https://chat.openai.com"],
      ["Claude", "https://claude.ai"],
      ["Gemini", "https://gemini.google.com"],
      ["Hugging Face", "https://huggingface.co"],
    ]),
    col("投资", [
      ["TradingView", "https://tradingview.com"],
      ["Binance", "https://binance.com"],
      ["DeBank", "https://debank.com"],
      ["CoinGecko", "https://coingecko.com"],
    ]),
    col("资讯", [
      ["Hacker News", "https://news.ycombinator.com"],
      ["V2EX", "https://v2ex.com"],
      ["少数派", "https://sspai.com"],
      ["TechCrunch", "https://techcrunch.com"],
    ]),
    col("购物", [
      ["京东", "https://jd.com"],
      ["淘宝", "https://taobao.com"],
      ["Amazon", "https://amazon.com"],
    ]),
  ];
}

type Status = "idle" | "loading" | "ready" | "error";

interface BookmarksState {
  columns: Column[];
  status: Status;
  error: string | null;
  /** Search query for the top bar (PRD §8 搜索框). */
  query: string;
  /** Columns after applying `query` filtering. */
  visibleColumns: Column[];

  load: () => Promise<void>;
  setQuery: (q: string) => void;
}

let subscribed = false;
let reloadTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Refresh from the live Chrome bookmark tree, with a small debounce so a burst
 * of events (e.g. importing bookmarks) doesn't trigger many reloads.
 */
function scheduleReload(load: () => Promise<void>): void {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    reloadTimer = null;
    void load();
  }, 150);
}

/** Match a column or its bookmarks against the (case-insensitive) query. */
function applyQuery(columns: Column[], rawQuery: string): Column[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return columns;

  const result: Column[] = [];
  for (const col of columns) {
    const colMatches = col.title.toLowerCase().includes(q);
    if (colMatches) {
      // Match the whole column → keep all its bookmarks.
      result.push(col);
      continue;
    }
    const hits = col.bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q),
    );
    if (hits.length) result.push({ ...col, bookmarks: hits });
  }
  return result;
}

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  columns: [],
  status: "idle",
  error: null,
  query: "",
  visibleColumns: [],

  load: async () => {
    set({ status: "loading", error: null });
    try {
      // Outside the extension (plain dev tab) there's no chrome.bookmarks API;
      // fall back to demo data so the UI can be previewed.
      if (!chrome?.bookmarks) {
        const columns = demoColumns();
        set({
          columns,
          visibleColumns: applyQuery(columns, get().query),
          status: "ready",
        });
        return;
      }
      const tree = await getBookmarkTree();
      const columns = treeToColumns(tree);
      const query = get().query;
      set({
        columns,
        visibleColumns: applyQuery(columns, query),
        status: "ready",
      });

      // Subscribe to live bookmark changes exactly once (PRD §6).
      if (!subscribed && chrome.bookmarks) {
        subscribed = true;
        const handler = () => scheduleReload(get().load);
        chrome.bookmarks.onCreated.addListener(handler);
        chrome.bookmarks.onRemoved.addListener(handler);
        chrome.bookmarks.onChanged.addListener(handler);
        chrome.bookmarks.onMoved.addListener(handler);
      }
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },

  setQuery: (q) => {
    const columns = get().columns;
    set({ query: q, visibleColumns: applyQuery(columns, q) });
  },
}));
