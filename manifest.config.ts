import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "Collect — Bookmark Start Page",
  version: pkg.version,
  description: pkg.description,
  // Take over the New Tab Page and render bookmarks as a Trello/Arc-style board.
  chrome_url_overrides: {
    newtab: "src/newtab.html",
  },
  action: {
    default_title: "Open a new tab to see your bookmarks",
  },
  // "storage" lets us cache favicon data URLs locally so icons still render
  // when Google S2 is unreachable; the host permission covers the S2 fetch.
  permissions: ["bookmarks", "storage"],
  host_permissions: ["https://www.google.com/*"],
});
