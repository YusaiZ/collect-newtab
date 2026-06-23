// Minimal CDP driver using Node's global WebSocket.
// Usage: node cdp.cjs <cmd> [arg]
const HTTP = process.env.CDP_PORT ? `http://localhost:${process.env.CDP_PORT}` : "http://localhost:9222";

async function list() {
  const r = await fetch(`${HTTP}/json`);
  return r.json();
}

async function findPage() {
  const a = await list();
  return a.find((t) => t.type === "page") || a[0];
}

function rpc(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1e9);
    const onMsg = (raw) => {
      let m;
      try {
        m = JSON.parse(raw);
      } catch {
        return;
      }
      if (m.id === id) {
        ws.removeEventListener("message", onMsg);
        if (m.error) reject(new Error(JSON.stringify(m.error)));
        else resolve(m.result);
      }
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function waitEvent(ws, name, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout " + name)), timeout);
    const onMsg = (raw) => {
      let m;
      try {
        m = JSON.parse(raw);
      } catch {
        return;
      }
      if (m.method === name) {
        clearTimeout(t);
        ws.removeEventListener("message", onMsg);
        resolve(m.params);
      }
    };
    ws.addEventListener("message", onMsg);
  });
}

async function evalJS(ws, expr) {
  const r = await rpc(ws, "Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

const cmd = process.argv[2];
(async () => {
  if (cmd === "extensions") {
    const page = await findPage();
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    await rpc(ws, "Page.enable");
    await rpc(ws, "Page.navigate", { url: "chrome://extensions" });
    await waitEvent(ws, "Page.loadEventFired");
    await new Promise((r) => setTimeout(r, 1200));
    const text = await evalJS(ws, "document.body.innerText");
    console.log(text);
    ws.close();
  } else if (cmd === "screenshot") {
    const url = process.argv[3];
    const out = process.argv[4] || "/tmp/shot.png";
    const page = await findPage();
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    await rpc(ws, "Page.enable");
    await rpc(ws, "Page.navigate", { url });
    await waitEvent(ws, "Page.loadEventFired");
    // let favicons & React mount settle
    await new Promise((r) => setTimeout(r, 4000));
    const { data } = await rpc(ws, "Page.captureScreenshot", { format: "png" });
    require("fs").writeFileSync(out, Buffer.from(data, "base64"));
    console.log("saved", out);
    ws.close();
  } else if (cmd === "eval") {
    const expr = process.argv[3];
    const page = await findPage();
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    console.log(await evalJS(ws, expr));
    ws.close();
  } else if (cmd === "navigate-eval") {
    const url = process.argv[3];
    const expr = process.argv[4];
    const page = await findPage();
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    await rpc(ws, "Page.enable");
    await rpc(ws, "Page.navigate", { url });
    await waitEvent(ws, "Page.loadEventFired");
    await new Promise((r) => setTimeout(r, 4000));
    console.log(await evalJS(ws, expr));
    ws.close();
  } else {
    console.error("unknown cmd");
    process.exit(1);
  }
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
