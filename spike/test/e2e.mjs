// Local end-to-end check of the connection test, without Owlbear or Obsidian.
// - Starts the real bridge server (as the plugin would).
// - Serves a stand-in "owlbear.rodeo" page in headless Chromium that iframes
//   the extension (Obsidian-served copy and GitHub Pages copy).
// - Drives route B through the real relay code, using page.evaluate in place
//   of the web viewer's executeJavaScript.
// Run from spike/: npm run build && node test/e2e.mjs
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(root, "test", ".tmp");
await mkdir(tmp, { recursive: true });

await build({
  stdin: {
    contents: `export * from "../plugin/src/server.ts"; export * from "../plugin/src/relay.ts";
export { EXTENSION_FILES } from "../plugin/src/embedded.gen.ts"; export * from "../shared.ts";`,
    resolveDir: join(root, "test"),
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: join(tmp, "harness.cjs"),
  external: ["bufferutil", "utf-8-validate"],
  logLevel: "warning",
});
const H = require(join(tmp, "harness.cjs"));

let failures = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
  if (!ok) failures++;
};

// ------------------------------------------------------------ server
const received = [];
const server = H.startBridgeServer({
  port: H.BRIDGE_PORT,
  allowedOrigins: H.EXTENSION_ORIGINS,
  files: H.EXTENSION_FILES,
  version: "test",
  onLog: () => undefined,
  onMessage: (msg, reply) => {
    received.push(msg);
    if (msg.type === "hello")
      reply({ type: "welcome", route: msg.route, vaultName: "TestVault", statblocks: true, creatures: 3 });
    if (msg.type === "ping") reply({ type: "pong", route: msg.route, t: msg.t });
  },
});
await server.listening;

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: H.BRIDGE_PORT, path, headers: { host: `127.0.0.1:${H.BRIDGE_PORT}`, ...headers } },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

let r = await get("/ping", { origin: "https://gizmo73.github.io" });
check("ping from allowed origin", r.status === 200 && r.headers["access-control-allow-origin"] === "https://gizmo73.github.io");
r = await get("/ping", { origin: "https://evil.example" });
check("ping from other origin rejected", r.status === 403);
r = await get("/ping", { host: "attacker.example:27190" });
check("wrong Host header rejected", r.status === 421);
r = await get("/ext/manifest.json");
const man = JSON.parse(r.body);
check("local manifest served", r.status === 200 && man.action.popover === "http://127.0.0.1:27190/ext/index.html");

// ------------------------------------------------------------ browser
const docs = join(root, "..", "docs", "spike");
const types = { ".js": "text/javascript", ".html": "text/html", ".svg": "image/svg+xml", ".json": "application/json" };
const browser = await chromium.launch();

async function scenario(label, iframeSrc) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route("https://www.owlbear.rodeo/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><title>stand-in owlbear</title><iframe src="${iframeSrc}" width="400" height="600"></iframe>`,
    }),
  );
  await page.route("https://gizmo73.github.io/owlbear-obsidian-bestiary/spike/**", async (route) => {
    const name = new URL(route.request().url()).pathname.split("/").pop() || "index.html";
    const ext = name.slice(name.lastIndexOf("."));
    route.fulfill({ contentType: types[ext] ?? "text/plain", body: await readFile(join(docs, name)) });
  });

  const relayStatus = [];
  const relay = new H.WebviewRelay({
    extensionOrigins: H.EXTENSION_ORIGINS,
    msgKey: H.MSG_KEY,
    findWebviews: () => [{ getURL: () => page.url(), executeJavaScript: (code) => page.evaluate(code) }],
    onMessage: (msg, reply) => {
      received.push(msg);
      if (msg.type === "hello") {
        reply({ type: "welcome", route: "inject", vaultName: "TestVault", statblocks: true, creatures: 3 });
        reply({ type: "shown", route: "inject", creature: "Goblin", tried: ["Goblin 2", "Goblin"] });
      }
    },
    onStatus: (s) => relayStatus.push(s),
    intervalMs: 300,
  });

  await page.goto("https://www.owlbear.rodeo/room/test");
  relay.start();
  await page.waitForTimeout(7000);
  relay.stop();

  const frame = page.frames().find((f) => f.url().includes("index.html"));
  const summary = frame ? await frame.locator("#summary").inputValue() : "(extension frame missing)";
  console.log(`\n--- ${label} ---\n${summary}\n`);
  await context.close();
  return summary;
}

let s = await scenario("GitHub Pages copy", "https://gizmo73.github.io/owlbear-obsidian-bestiary/spike/index.html");
check("GitHub Pages copy: B injection relays both ways", /B · Obsidian web viewer injection: OK/.test(s));
check("GitHub Pages copy: Creature pane reply arrives over B", /Creature pane: OK - showing "Goblin" \(via inject\)/.test(s));
const a1 = /A1 · HTTP to Obsidian: OK/.test(s);
const a2 = /A2 · WebSocket to Obsidian: OK/.test(s);
console.log(`INFO  Chromium ${browser.version()}, GitHub Pages copy: A1 ${a1 ? "ok" : "blocked"}, A2 ${a2 ? "ok" : "blocked"}`);

s = await scenario("Obsidian-served copy", "http://127.0.0.1:27190/ext/index.html");
console.log(`INFO  Chromium ${browser.version()}, Obsidian-served copy: ${s.startsWith("(extension frame missing)") ? "iframe blocked from loading" : "loaded"}`);

const H2 = H;
check("token suffixes stripped", ["Goblin 2", "Goblin A", "Goblin A1", "Goblin #3", "Goblin (3)"].every((n) => H2.stripTokenSuffix(n) === "Goblin"));
check("plain names untouched", H2.stripTokenSuffix("Adult Red Dragon") === "Adult Red Dragon" && H2.stripTokenSuffix("Ogre") === "Ogre");
check("loose match ignores hyphens/case", H2.matchKey("Kuo Toa") === H2.matchKey("Kuo-Toa") && H2.matchKey("kuo-toa") === "kuotoa");
check("label tried before name", JSON.stringify(H2.nameCandidates({ name: "Goblin", label: "Boss 1" })) === JSON.stringify(["Boss 1", "Boss", "Goblin"]));

await browser.close();
await server.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
