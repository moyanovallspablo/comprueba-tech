// Auditoría de desbordamiento horizontal en móvil vía Chrome DevTools Protocol (sin dependencias).
//
// Recorre las pantallas principales a 320, 360 y 375 px y detecta:
//   - elementos que se salen del viewport sin que ningún ancestro los recorte;
//   - contenido (texto o hijos) que desborda su caja con overflow visible.
//
// Uso (con la app servida, p. ej. `npm run build && npm start`):
//   node scripts/overflow-audit.mjs [baseUrl] [carpetaCapturas]
//   baseUrl por defecto: $BASE_URL o http://localhost:3000. Sin carpeta, no guarda capturas.
//   Navegador: $CHROME_PATH o la instalación estándar de Chrome / Edge / Chromium.
// Sale con código 1 si encuentra algún desbordamiento.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.argv[3];
const PORT = 9333;
const WIDTHS = [320, 360, 375];
const SHOTS = new Set(["/@320", "results@320", "wizard-3@320", "/comparar/dell-u2724de-vs-lg-27gr83q@320"]);

const SETUP = (extra) =>
  JSON.stringify({
    profile: "gaming", budget: 500, dispositivo: "sobremesa", gpu: "media", monitorActualId: "24-1080-60",
    mesaFondo: "", mesaAncho: "", completed: false, gpuAutoAdjusted: true, ...extra,
  });

const SCENARIOS = [
  { name: "/", path: "/" },
  { name: "/asesor", path: "/asesor" },
  { name: "/monitores?preset", path: "/monitores?perfil=gaming&hz=144" },
  { name: "wizard-3", path: "/asesor", storage: SETUP({ completed: false }), clicks: ["Continuar", "Continuar"] },
  { name: "results", path: "/asesor", storage: SETUP({ completed: true }) },
  { name: "/monitores", path: "/monitores" },
  { name: "/comparar", path: "/comparar" },
  { name: "/comparar/dell-u2724de-vs-lg-27gr83q", path: "/comparar/dell-u2724de-vs-lg-27gr83q" },
  { name: "/monitor/dell-u2724de", path: "/monitor/dell-u2724de" },
  { name: "/monitor/lg-27gr83q", path: "/monitor/lg-27gr83q" },
  ...["/sobre-nosotros", "/pautas-editoriales", "/aviso-legal", "/privacidad", "/terminos", "/cookies"].map((path) => ({
    name: path,
    path,
  })),
];

// Se ejecuta en la página: elementos fuera del viewport y contenido que desborda su caja (overflow visible).
const CHECK = `(() => {
  const vw = document.documentElement.clientWidth;
  const desc = (el) => {
    const t = (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40);
    return el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 4).join(".") : "") + (t ? " «" + t + "»" : "");
  };
  const skip = (el) => !!el.closest('[aria-hidden="true"], [aria-hidden=""], .sr-only, [role="dialog"]');
  const visible = (el) => { const cs = getComputedStyle(el); return cs.display !== "none" && cs.visibility !== "hidden"; };
  const issues = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el) || skip(el)) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.position === "fixed") continue;
    // ¿Algún ancestro recorta (overflow hidden/auto/clip) dentro del viewport? Entonces no se ve fuera.
    if (r.right > vw + 1 || r.left < -1) {
      let clipped = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const pc = getComputedStyle(p);
        if (pc.overflowX !== "visible") { const pr = p.getBoundingClientRect(); if (pr.right <= vw + 1 && pr.left >= -1) { clipped = true; break; } }
      }
      if (!clipped) issues.push({ kind: "fuera-de-pantalla", el: desc(el), left: Math.round(r.left), right: Math.round(r.right), vw });
    }
    if (cs.overflowX === "visible" && cs.display !== "inline" && !(el instanceof SVGElement)) {
      for (const n of el.childNodes) {
        let cr;
        if (n.nodeType === 3 && n.textContent.trim()) { const rg = document.createRange(); rg.selectNodeContents(n); cr = rg.getBoundingClientRect(); }
        else if (n.nodeType === 1 && visible(n) && !skip(n)) { const nc = getComputedStyle(n); if (nc.position === "absolute" || nc.position === "fixed") continue; cr = n.getBoundingClientRect(); }
        if (cr && cr.width && cr.right > r.right + 1.5) { issues.push({ kind: "texto-desborda", el: desc(el), sobra: Math.round(cr.right - r.right) }); break; }
      }
    }
  }
  return { vw, scrollW: document.documentElement.scrollWidth, issues: issues.slice(0, 15) };
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findBrowser() {
  const candidates = {
    win32: [
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    ],
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ],
    linux: ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"],
  }[process.platform] ?? [];
  const found = [process.env.CHROME_PATH, ...candidates].find((p) => p && existsSync(p));
  if (!found) throw new Error("No se encuentra Chrome/Edge/Chromium. Indica la ruta con CHROME_PATH.");
  return found;
}

async function main() {
  if (OUT) mkdirSync(OUT, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), "comprueba-audit-"));
  const chrome = spawn(findBrowser(), [
    "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    "--no-first-run", "--disable-gpu", "about:blank",
  ]);
  let ws;
  let failures = 0;
  try {
    let target;
    for (let i = 0; i < 150 && !target; i++) {
      try {
        target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === "page");
      } catch {
        // el navegador aún está arrancando
      }
      if (!target) await sleep(200);
    }
    if (!target) throw new Error("El navegador headless no ha expuesto el puerto de depuración.");
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));
    let id = 0;
    const pending = new Map();
    const waiters = [];
    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
      if (msg.method) for (const w of [...waiters]) if (w.method === msg.method) { waiters.splice(waiters.indexOf(w), 1); w.resolve(msg); }
    });
    const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
    const waitFor = (method) => new Promise((resolve) => waiters.push({ method, resolve }));
    const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
    const navigate = async (url) => { const loaded = waitFor("Page.loadEventFired"); await send("Page.navigate", { url }); await loaded; await sleep(900); };

    await send("Page.enable");
    await send("Runtime.enable");
    const report = [];
    for (const width of WIDTHS) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 2, mobile: true });
      for (const s of SCENARIOS) {
        await navigate(BASE + "/");
        await evaluate(s.storage ? `localStorage.setItem("comprueba.setup.v1", ${JSON.stringify(s.storage)})` : `localStorage.clear()`);
        await navigate(BASE + s.path);
        for (const label of s.clicks ?? []) {
          await evaluate(`[...document.querySelectorAll("button")].find((b) => b.textContent.includes(${JSON.stringify(label)}))?.click()`);
          await sleep(700);
        }
        const res = await evaluate(CHECK);
        report.push({ scenario: s.name, width, ...res });
        if (OUT && SHOTS.has(`${s.name}@${width}`)) {
          const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: 1800, scale: 1 } });
          writeFileSync(join(OUT, `${s.name.replace(/[^\w-]+/g, "_")}-${width}.png`), Buffer.from(shot.result.data, "base64"));
        }
      }
    }
    for (const r of report) {
      const bad = r.issues.length > 0 || r.scrollW > r.vw;
      if (bad) failures++;
      console.log(`${bad ? "✗" : "✓"} ${String(r.width).padEnd(4)} ${r.scenario.padEnd(40)} scrollWidth=${r.scrollW} issues=${r.issues.length}`);
      for (const i of r.issues) console.log("     ", JSON.stringify(i));
    }
    console.log(failures ? `\n${failures} pantalla(s) con desbordamiento.` : `\nSin desbordamientos en ${report.length} combinaciones.`);
  } finally {
    ws?.close();
    chrome.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
  process.exitCode = failures ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
