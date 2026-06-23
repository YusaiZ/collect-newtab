/**
 * Bookmark tree flattening (PRD §2 / §3).
 *
 * Chrome's bookmark tree looks like:
 *
 *   根节点 (invisible, id "0")
 *   ├── 书签栏 (Bookmarks bar)   ← fixed root
 *   │   ├── 工具 (folder)        ← THIS is a Column
 *   │   ├── AI (folder)          ← THIS is a Column
 *   │   └── <loose bookmarks>    ← grouped into a catch-all column
 *   ├── 其他书签 (Other)         ← fixed root, same unwrapping
 *   └── 移动设备书签 (Mobile)    ← fixed root, same unwrapping
 *
 * So unlike a naive read, we must UNWRAP the three fixed roots and treat each
 * of their direct child *folders* as a Column. Any loose bookmarks sitting
 * directly under a fixed root (not inside a sub-folder) are preserved in a
 * catch-all column named after that root so nothing gets lost.
 */

export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
}

export interface Bookmark extends BookmarkNode {
  url: string;
}

export interface Column {
  id: string;
  title: string;
  bookmarks: Bookmark[];
}

/** Narrows a node to "is a bookmark URL" (vs. a folder) for control-flow typing. */
function isBookmark(
  node: chrome.bookmarks.BookmarkTreeNode,
): node is chrome.bookmarks.BookmarkTreeNode & { url: string } {
  return typeof node.url === "string" && node.url.length > 0;
}

/** Recursively collect every bookmark URL under a folder, in tree order. */
function collectBookmarks(
  node: chrome.bookmarks.BookmarkTreeNode,
  out: Bookmark[],
): void {
  for (const child of node.children ?? []) {
    if (isBookmark(child)) {
      out.push({ id: child.id, title: child.title || child.url!, url: child.url! });
    } else {
      // Descend into sub-folders so nested links still appear under their
      // enclosing top-level column.
      collectBookmarks(child, out);
    }
  }
}

/**
 * The three Chrome fixed roots (by id). Bookmarks stored directly on these
 * (rather than in a sub-folder) get a catch-all column each.
 *
 * ids: 书签栏="1", 其他书签="2", 移动设备书签="3".
 */
const FIXED_ROOT_IDS = new Set(["1", "2", "3"]);

/**
 * Convert the raw Chrome bookmark tree into the columns the board renders.
 *
 * For each fixed root (书签栏 / 其他书签 / 移动设备书签) we UNWRAP it: every
 * direct child folder becomes its own Column, and any loose direct bookmarks
 * are merged into a catch-all column named after the root. Empty sub-folders
 * are kept so the user's structure is faithfully reflected.
 */
export function treeToColumns(
  tree: chrome.bookmarks.BookmarkTreeNode[],
): Column[] {
  const columns: Column[] = [];

  // Collect the fixed-root nodes from the tree.
  const fixedRoots: chrome.bookmarks.BookmarkTreeNode[] = [];
  const walk = (nodes: chrome.bookmarks.BookmarkTreeNode[]): void => {
    for (const n of nodes) {
      if (FIXED_ROOT_IDS.has(n.id)) fixedRoots.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(tree);

  // Fall back: if the ids didn't match (unlikely), treat the whole tree as roots.
  const roots = fixedRoots.length ? fixedRoots : tree;

  for (const root of roots) {
    const loose: Bookmark[] = [];
    for (const child of root.children ?? []) {
      if (isBookmark(child)) {
        // A bookmark sitting directly under a fixed root — pool it.
            loose.push({ id: child.id, title: child.title || child.url, url: child.url });
      } else {
        // A sub-folder → becomes a Column.
        const bookmarks: Bookmark[] = [];
        collectBookmarks(child, bookmarks);
        columns.push({
          id: child.id,
          title: child.title || "未命名",
          bookmarks,
        });
      }
    }
    // Catch-all column for loose bookmarks under this root, so none vanish.
    if (loose.length) {
      columns.push({ id: `${root.id}-loose`, title: root.title || "书签", bookmarks: loose });
    }
  }

  return columns;
}

/** Promise wrapper around the callback-based chrome.bookmarks.getTree(). */
export function getBookmarkTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  return new Promise((resolve, reject) => {
    try {
      chrome.bookmarks.getTree((tree) => {
        const err = chrome.runtime.lastError;
        if (err) reject(new Error(err.message));
        else resolve(tree);
      });
    } catch (e) {
      reject(e as Error);
    }
  });
}
