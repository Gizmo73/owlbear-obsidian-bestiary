// End-to-end check without real Owlbear or Obsidian:
// - the real bridge server (src/plugin/server.ts) answers like the plugin, from a fixture bestiary;
// - headless Chromium loads a fake Owlbear host that speaks the SDK protocol and
//   iframes the built extension pages from docs/ (as GitHub Pages would serve them).
// Run: npm run build && node test/e2e.mjs   (screenshots go to test/.tmp/)
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(root, "test", ".tmp");
await mkdir(tmp, { recursive: true });

await build({
  stdin: {
    contents: `export * from "../src/plugin/server.ts"; export * from "../src/shared/bestiary.ts";
export * from "../src/shared/protocol.ts"; export * from "../src/shared/names.ts";`,
    resolveDir: join(root, "test"),
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: join(tmp, "e2e-harness.cjs"),
  external: ["bufferutil", "utf-8-validate"],
  logLevel: "warning",
});
const H = require(join(tmp, "e2e-harness.cjs"));

let failures = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
  if (!ok) failures++;
};

// ------------------------------------------------------------ fake plugin
const fixtures = [
  { name: "Goblin", hp: 7, ac: 15, stats: [8, 14, 10, 10, 8, 8], cr: "1/4" },
  { name: "Goblin Boss", hp: "21 (6d6)", ac: "17 (chain shirt)", stats: [10, 14, 10, 10, 8, 10], cr: 1 },
  { name: "Hobgoblin", hp: 11, ac: 18, stats: [13, 12, 12, 10, 10, 9], cr: 0.5 },
  { name: "Kuo-Toa", hp: 18, ac: 13, stats: [13, 10, 11, 11, 10, 8], cr: 0.25 },
  { name: "Kuo-Toa Whip", hp: 65, ac: 11, stats: [14, 10, 14, 12, 14, 11], cr: 1 },
  { name: "Adult Red Dragon", hp: 256, ac: 19, stats: [27, 10, 25, 16, 13, 21], cr: 17 },
];
let entries = fixtures.map(H.toEntry);
let version = H.indexVersion(entries);
const shown = [];
const byKey = () => new Map(entries.map((e) => [H.matchKey(e.name), e.name]));

const server = H.startBridgeServer({
  port: H.DEFAULT_PORT,
  allowedOrigins: H.EXTENSION_ORIGINS,
  version: "test",
  onLog: () => undefined,
  onMessage: async (msg, reply) => {
    const ok = (result) => reply({ id: msg.id, ok: true, result });
    if (msg.kind === "hello")
      ok({ protocol: H.PROTOCOL_VERSION, vault: "TestVault", bestiaryVersion: version, creatureCount: entries.length, statblocksPlugin: true });
    else if (msg.kind === "getBestiary") ok({ version, vault: "TestVault", creatures: entries });
    else if (msg.kind === "showCreature") {
      const exact = byKey().get(H.matchKey(msg.name)) ?? null;
      if (exact) shown.push(exact);
      ok({ shown: exact });
    } else reply({ id: msg.id, ok: false, error: "unknown" });
  },
});
await server.listening;

// ------------------------------------------------------------ browser + fake Owlbear
const EXT = "https://gizmo73.github.io/owlbear-obsidian-bestiary/";
const types = { ".js": "text/javascript", ".html": "text/html", ".svg": "image/svg+xml", ".json": "application/json", ".css": "text/css" };
// Obsidian 1.13.7 (Chromium 150) allowed this; newer stock Chromium blocks public -> loopback, so relax it here.
const browser = await chromium.launch({ args: ["--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWebSockets"] });
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
page.on("pageerror", (e) => console.log("pageerror:", e.message));
page.on("console", (m) => m.type() === "error" && console.log("console error:", m.text()));
await page.route("https://www.owlbear.rodeo/**", async (route) =>
  route.fulfill({ contentType: "text/html", body: await readFile(join(root, "test", "fake-owlbear.html")) }),
);
await page.route(`${EXT}**`, async (route) => {
  const name = new URL(route.request().url()).pathname.replace("/owlbear-obsidian-bestiary/", "") || "index.html";
  const ext = name.slice(name.lastIndexOf("."));
  try {
    route.fulfill({ contentType: types[ext] ?? "text/plain", body: await readFile(join(root, "docs", name)) });
  } catch {
    route.fulfill({ status: 404, body: "not found" });
  }
});

await page.goto(`https://www.owlbear.rodeo/room/test?ext=${encodeURIComponent(EXT)}`);
await page.evaluate(() => {
  host.addToken("kuo", "Kuo Toa B", 300, 300);
  host.addToken("g1", "Goblin 2", 600, 300);
  host.addToken("g2", "Goblin 3", 750, 300);
  host.addToken("map", "Goblin Camp", 0, 0);
  host.state.items.find((i) => i.id === "map").layer = "MAP";
});
await page.evaluate(() => host.open("background", "background.html", 0, 0));
await page.evaluate(() => host.open("popover", "popover.html", 340, 380));
const frame = (name) => page.frame({ name });

// 1. connection + bestiary sync
await frame("popover").waitForSelector(".status.ok", { timeout: 15000 }).catch(() => undefined);
const statusText = await frame("popover").locator(".status").innerText();
check("popover shows connected + creature count", /Connected to “TestVault”/.test(statusText) && /6 creatures/.test(statusText), statusText.replace(/\s+/g, " "));
await frame("popover").locator("body").screenshot({ path: join(tmp, "popover.png") });

// 2. context menu registered with absolute URLs
const menu = await page.evaluate(() => Object.values(host.state.menus)[0]);
check("context menu registered for GM characters", menu?.icons?.[0]?.filter?.roles?.[0] === "GM" && menu.icons[0].filter.every[0].value === "CHARACTER");
check("menu embed + icon use absolute Pages URLs", menu?.embed?.url === `${EXT}menu.html` && menu.icons[0].icon === `${EXT}icon.svg`, menu?.embed?.url);

// 3. selecting an unlinked token whose name matches opens it in the Creature pane
await page.evaluate(() => host.select(["kuo"]));
await page.waitForTimeout(500);
check('select "Kuo Toa B" -> Creature pane shows Kuo-Toa', shown.at(-1) === "Kuo-Toa", shown.join(","));
await page.evaluate(() => host.select(["map"]));
await page.waitForTimeout(300);
check("selecting a map item does nothing", shown.length === 1);

// 4. assign both goblins from the right-click menu
await page.evaluate(() => host.select(["g1", "g2"]));
await page.evaluate(() => host.open("menu", "menu.html", 240, 230));
const m = () => frame("menu");
await m().waitForSelector("#q");
check("search prefilled from token name", (await m().locator("#q").inputValue()) === "Goblin");
const first = await m().locator("#results li").first().innerText();
check("best match listed first", first.startsWith("Goblin") && /HP 7/.test(first), first.replace(/\s+/g, " "));
await m().locator("#results").screenshot({ path: join(tmp, "menu-assign.png") });
await m().locator("#q").press("Enter");
await m().waitForSelector("#hp");
const meta = await page.evaluate(() => host.state.items.filter((i) => i.id.startsWith("g")).map((i) => i.metadata["com.gizmo73.obsidian-bestiary/creature"]));
check("both goblins linked with their own HP", meta.length === 2 && meta.every((c) => c?.name === "Goblin" && c.hp === 7 && c.maxHp === 7 && c.ac === 15 && c.init === 2), JSON.stringify(meta[0]));
check("assigning opens the creature in Obsidian", shown.at(-1) === "Goblin");

// 5. HP maths from the menu, applied to the whole selection
const hpOf = () => page.evaluate(() => host.state.items.filter((i) => i.id.startsWith("g")).map((i) => i.metadata["com.gizmo73.obsidian-bestiary/creature"]?.hp));
const type = async (text) => {
  await m().locator("#hp").fill(text);
  await m().locator("#hp").press("Enter");
  await page.waitForTimeout(250);
};
await type("5");
check("'5' deals 5 damage to both", JSON.stringify(await hpOf()) === "[2,2]");
await type("+10");
check("'+10' heals but stops at max", JSON.stringify(await hpOf()) === "[7,7]");
await type("-9");
check("'-9' can take HP below 0", JSON.stringify(await hpOf()) === "[-2,-2]");
await page.waitForTimeout(300);
const labels = await page.evaluate(() => host.state.local.map((l) => ({ for: l.attachedTo, text: l.text.plainText, bg: l.style.backgroundColor, y: l.position.y })));
check("GM-only HP labels drawn under each goblin", labels.length === 2 && labels.every((l) => l.text === "-2/7" && l.bg === "#b71c1c" && l.y === 375), JSON.stringify(labels));
await m().locator("body").screenshot({ path: join(tmp, "menu-hp.png") });
await type("+3");
check("healing from below 0 starts at 0", JSON.stringify(await hpOf()) === "[3,3]");
await type("max 10");
check("'max 10' raises max, keeps damage taken", JSON.stringify(await page.evaluate(() => host.state.items.filter((i) => i.id.startsWith("g")).map((i) => { const c = i.metadata["com.gizmo73.obsidian-bestiary/creature"]; return `${c.hp}/${c.maxHp}`; }))) === '["6/10","6/10"]');
await type("lots");
check("bad input explains the syntax", /Try 7, \+5, =20/.test(await m().locator("#msg").innerText()));

// 6. change statblock, then unlink
await m().locator("#change").click();
await m().locator("#q").fill("hob");
await m().locator("#q").press("Enter");
await m().waitForSelector("#hp");
check("change statblock resets HP to the new creature", JSON.stringify(await hpOf()) === "[11,11]");
await m().locator("#unlink").click();
await page.waitForTimeout(400);
check("unlink removes link and labels", JSON.stringify(await hpOf()) === "[null,null]" && (await page.evaluate(() => host.state.local.length)) === 0);

// 7. bestiary edits in Obsidian reach Owlbear
entries = [...entries, H.toEntry({ name: "Bugbear", hp: 27, ac: 16, stats: [15, 14, 13, 8, 11, 9], cr: 1 })];
version = H.indexVersion(entries);
server.broadcast({ push: "bestiaryChanged", version, creatureCount: entries.length });
await page.waitForTimeout(800);
check("pushed bestiary change refetched", /7 creatures/.test(await frame("popover").locator(".status").innerText()));

// 8. players get nothing
await page.evaluate(() => { host.state.role = "PLAYER"; host.state.local = []; });
await page.evaluate(() => host.open("background", "background.html", 0, 0));
await page.evaluate(() => host.open("popover", "popover.html", 340, 380));
await page.waitForTimeout(800);
check("player sees 'GM only' and gets no labels", /GM only/.test(await frame("popover").locator("body").innerText()) && (await page.evaluate(() => host.state.local.length)) === 0);

const unhandled = await page.evaluate(() => host.state.log.filter((l) => l.startsWith("UNHANDLED")));
if (unhandled.length) console.log("INFO  unhandled SDK calls:", [...new Set(unhandled)].join(", "));

await browser.close();
await server.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
