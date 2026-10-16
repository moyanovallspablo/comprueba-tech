// Comprueba que con prefers-reduced-motion las animaciones de Motion saltan a su estado final.
//
// Recorre el wizard hasta "Ver mi recomendación" y registra, fotograma a fotograma, la opacidad y el
// transform de la barra de búsqueda de resultados (entrada fade-up de 16 px):
//   - sin preferencia: debe haber fotogramas intermedios;
//   - con "reduce": solo el estado inicial y el final, sin desplazamiento.
//
// Uso (con la app servida, p. ej. `npm run build && npm start`):
//   node scripts/rm-check.mjs [baseUrl]
//   baseUrl por defecto: $BASE_URL o http://localhost:3000.
//   Navegador: $CHROME_PATH o la instalación estándar de Chrome / Edge / Chromium.
// Sale con código 1 si el movimiento reducido no se respeta.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
const PORT = 9334;

const SETUP = JSON.stringify({
  profile: "gaming", budget: 500, dispositivo: "sobremesa", gpu: "media", monitorActualId: "none",
  mesaFondo: "", mesaAncho: "", completed: false, gpuAutoAdjusted: false,
});

// Muestreo por requestAnimationFrame durante 9 s desde la carga de cada documento.
const SAMPLER = `window.__s = []; const t0 = performance.now(); const tick = () => {
  const g = document.querySelector("[role=radiogroup][aria-label=Perfil]");
  const el = g && g.closest("div[style]");
  if (el) { const cs = getComputedStyle(el); window.__s.push(cs.opacity + "|" + cs.transform); }
  if (performance.now() - t0 < 9000) requestAnimationFrame(tick);
}; requestAnimationFrame(tick);`;

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
  const profile = mkdtempSync(join(tmpdir(), "comprueba-rm-"));
  const chrome = spawn(findBrowser(), [
    "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "about:blank",
  ]);
  let ws;
  const results = {};
  try {
    let target;
    for (let i = 0; i < 150 && !target; i++) {
      try {
        target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((x) => x.type === "page");
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
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      pending.get(m.id)?.(m);
    });
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.result?.value;
    const click = (label) => evaluate(`[...document.querySelectorAll("button")].find((b) => b.textContent.includes(${JSON.stringify(label)}))?.click()`);

    await send("Page.enable");
    await send("Page.addScriptToEvaluateOnNewDocument", { source: SAMPLER });

    for (const value of ["no-preference", "reduce"]) {
      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value }] });
      // Setup sin completar → el wizard arranca en el paso 1; tres clics llevan a los resultados.
      await send("Page.navigate", { url: BASE + "/" });
      await sleep(1500);
      await evaluate(`localStorage.setItem("comprueba.setup.v1", ${JSON.stringify(SETUP)})`);
      await send("Page.navigate", { url: BASE + "/" });
      await sleep(1500);
      for (const label of ["Continuar", "Continuar", "Ver mi recomendación"]) {
        await click(label);
        await sleep(800);
      }
      await sleep(2500);
      const s = (await evaluate("window.__s")) ?? [];
      const distinct = [...new Set(s)];
      results[value] = { frames: s.length, distinct, moved: distinct.some((v) => !v.endsWith("|none")) };
      console.log(value.padEnd(14), `frames=${s.length}  valores distintos=${distinct.length}  primero=${s[0]}  último=${s.at(-1)}`);
    }
  } finally {
    ws?.close();
    chrome.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }

  const normal = results["no-preference"];
  const reduced = results.reduce;
  const ok = normal && reduced && normal.distinct.length > 2 && reduced.distinct.length <= 2 && !reduced.moved;
  console.log(
    ok
      ? "\n✓ Movimiento reducido respetado: la entrada salta al estado final sin desplazamiento."
      : "\n✗ Movimiento reducido NO respetado (o no se ha podido medir la animación de referencia).",
  );
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
