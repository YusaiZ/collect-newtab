// Runs automatically before `npm run build` via the "prebuild" npm hook.
//
// Why this exists: @crxjs/vite-plugin injects dev-mode HMR (hardcoded
// http://localhost:5173 imports) into the build output when a `vite` dev
// server is still running. That produces a dist that Chrome rejects with
// "Service Worker (无效)" / "Failed to load the script". To prevent that, we
// (1) kill any process still listening on the dev server port, and
// (2) clear Vite's dependency cache so a stale .vite can't leak into output.
import { rmSync } from "node:fs";
import { execSync } from "node:child_process";

const PORT = 5173;

/** Find PIDs listening on PORT (cross-platform, no-op if none). */
function findPidsOnPort() {
  const cmd =
    process.platform === "win32"
      ? `netstat -ano | findstr ":${PORT} " | findstr "LISTENING"`
      : `lsof -ti tcp:${PORT} -sTCP:LISTEN`;
  try {
    const out = execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    if (!out) return [];
    if (process.platform === "win32") {
      // last column is the PID
      return [...new Set(out.split("\n").map((l) => l.trim().split(/\s+/).pop()))];
    }
    return [...new Set(out.split("\n").map((l) => l.trim()).filter(Boolean))];
  } catch {
    return []; // port not in use, or tool missing
  }
}

const pids = findPidsOnPort();
if (pids.length) {
  console.log(
    `\n⚠️  Found ${pids.length} process(es) on dev port ${PORT} (likely a leftover vite dev server).`,
  );
  console.log("   Killing to prevent dev-mode HMR from polluting the build...");
  try {
    const kill = process.platform === "win32" ? "taskkill /F /PID" : "kill";
    for (const pid of pids) execSync(`${kill} ${pid}`, { stdio: "ignore" });
    console.log("   ✓ killed:", pids.join(", "));
  } catch {
    console.log("   (could not kill automatically — stop it manually if the build looks wrong)");
  }
}

// Clear Vite's optimize-deps / cache so stale entries can't bleed into output.
try {
  rmSync("node_modules/.vite", { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log("✓ prebuild checks passed\n");
