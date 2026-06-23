# Collect — Chrome Bookmark Start Page

将 Chrome 原生收藏夹以 **Trello / Arc Browser / Notion** 风格的可视化看板展示在新标签页。

打开新标签页后，每个一级书签文件夹对应一个栏目（Column），所有栏目横向排列；超出宽度时可滚轮 / 触控板横向滚动。一眼定位、一键直达。

---

## 功能（首版）

- ✅ 接管 Chrome 新标签页（`chrome_url_overrides.newtab`）
- ✅ 自动读取全部收藏夹并按一级文件夹分列展示
- ✅ 横向布局 + 滚轮 / Shift+滚轮 / 触控板横向滚动
- ✅ 网站 favicon（懒加载，加载失败显示占位图标）
- ✅ 点击在当前标签打开；`Ctrl/Cmd + Click` 新标签打开
- ✅ 深色模式（自动跟随系统 `prefers-color-scheme`）
- ✅ 顶部搜索框，`Ctrl/Cmd + K` 唤起，`Esc` 清空
- ✅ 收藏夹变更实时刷新（onCreated / onRemoved / onChanged / onMoved）
- ✅ 超长栏目折叠（显示更多）以保持流畅

> 拖拽排序写回收藏夹、完整虚拟滚动、栏目折叠为后续版本规划。

## 技术栈

Chrome Extension MV3 · React 19 · TypeScript · Vite · TailwindCSS v4 ·
Zustand · Lucide。打包使用 [`@crxjs/vite-plugin`](https://github.com/crxjs/chrome-extension-tools)。

## 开发

```bash
npm install
npm run dev      # http://localhost:5173 ，支持热更新
```

开发时把项目根目录作为「已解压的扩展程序」加载（见下方），`@crxjs` 会接管 HMR。

## 在 Chrome 中加载

### 生产构建（推荐用于日常使用）

```bash
npm run build    # 产物输出到 dist/
```

1. 打开 `chrome://extensions`
2. 右上角开启 **开发者模式**
3. 点击 **加载已解压的扩展程序**，选择本项目的 **`dist`** 目录
4. 新开一个标签页 → 看到收藏夹看板

### 开发模式

把 **项目根目录**（含 `manifest.config.ts` 生成的开发态 manifest）作为已解压扩展加载，
然后 `npm run dev`，修改代码后新标签页会自动热更新。

> 首次加载扩展后，Chrome 会请求 **bookmarks** 权限用于读取收藏夹。

## 目录结构

```
collect/
├─ manifest.config.ts            # MV3 manifest（接管新标签页 + bookmarks 权限）
├─ vite.config.ts                # @crxjs + React + Tailwind v4
├─ src/
│  ├─ newtab.html                # 新标签页入口
│  ├─ main.tsx / App.tsx
│  ├─ styles/index.css           # Tailwind v4 + 明暗 CSS 变量
│  ├─ lib/
│  │  ├─ bookmarks.ts            # chrome.bookmarks 封装 + 树→栏目扁平化
│  │  ├─ favicon.ts              # favicon URL 解析 + 占位图标
│  │  └─ useTheme.ts             # 跟随系统深色模式
│  ├─ store/useBookmarksStore.ts # Zustand：加载 / 搜索过滤 / 实时刷新
│  └─ components/
│     ├─ Board.tsx               # 横向滚动看板 + 滚轮处理
│     ├─ Column.tsx              # 单栏目：标题 + 数量 + 书签列表
│     ├─ BookmarkItem.tsx        # 书签项：favicon + 名称 + 点击行为
│     └─ SearchBar.tsx           # 搜索框 + Cmd/Ctrl+K
```

## 使用提示

- **搜索**：`Ctrl/Cmd + K` 聚焦搜索框，输入即可过滤；命中栏目名则整列显示，命中书签名 / 网址则只显示匹配项。
- **新标签打开**：按住 `Ctrl`（Win）或 `Cmd`（Mac）再点击书签。
- **组织栏目**：栏目 = 你书签栏里的一级文件夹；在 Chrome 书签管理器里增删文件夹 / 书签，新标签页会实时更新。

## 许可

MIT
