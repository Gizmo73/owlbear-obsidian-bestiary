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
let ownParties = [];
const partiesPayload = () => ({
  parties: [{ name: "LiS", members: ["Berald", "Dogg"], source: "initiative-tracker" }, ...ownParties.map((p) => ({ ...p, source: "bridge" }))],
  pcs: ["Berald", "Dogg", "Malakyr", ...ownParties.flatMap((p) => p.members)],
});

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
    } else if (msg.kind === "getParties") ok(partiesPayload());
    else if (msg.kind === "saveParty") {
      ownParties = [...ownParties.filter((p) => p.name !== msg.name), { name: msg.name, members: msg.members }];
      ok(partiesPayload());
    } else if (msg.kind === "deleteParty") {
      ownParties = ownParties.filter((p) => p.name !== msg.name);
      ok(partiesPayload());
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
await page.evaluate(() => host.open("popover", "popover.html", 360, 560));
const frame = (name) => page.frame({ name });
const connText = () => frame("popover").locator(".conn-details .help").first().textContent();

// 1. connection + bestiary sync
await frame("popover").waitForSelector(".conn.ok", { timeout: 15000 }).catch(() => undefined);
const statusText = (await connText()) ?? "";
check("panel shows connected + creature count", /Connected to “TestVault”/.test(statusText) && /6 creatures/.test(statusText), statusText.replace(/\s+/g, " "));

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
check("both goblins linked with their own HP, numbered 1 and 2", meta.length === 2 && meta.every((c) => c?.name === "Goblin" && c.hp === 7 && c.maxHp === 7 && c.ac === 15 && c.init === 2) && meta.map((c) => c.n).join() === "1,2", JSON.stringify(meta[0]));
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
const labels = await page.evaluate(() => host.state.local.map((l) => ({ for: l.attachedTo, type: l.type, text: l.text.plainText, fill: l.text.style.fillColor, size: l.text.style.fontSize, top: l.position.y, bottom: l.position.y + l.text.height, noScale: (l.disableAttachmentBehavior ?? []).includes("SCALE") })));
// Tokens are 150 wide at y=300, so their top edge is y=225.
check("GM-only HP text above each goblin, 24pt map text", labels.length === 2 && labels.every((l) => l.type === "TEXT" && /^#[12] -2\/7$/.test(l.text) && l.fill === "#ff6b6b" && l.size === 24 && l.bottom === 225 && l.noScale), JSON.stringify(labels[0]));
await page.evaluate(() => {
  host.state.items.find((i) => i.id === "g1").scale = { x: 2, y: 2 };
  host.select(["g1", "g2"]);
});
// "0" damage rewrites the link, which fires the change event that re-checks labels.
await m().locator("#hp").fill("0");
await m().locator("#hp").press("Enter");
await page.waitForTimeout(400);
const resized = await page.evaluate(() => host.state.local.filter((l) => l.attachedTo === "g1").map((l) => l.metadata["com.gizmo73.obsidian-bestiary/hp-label"].fit));
check("resized token gets its HP text re-placed", JSON.stringify(resized) === '["2,2"]', JSON.stringify(resized));
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
check("pushed bestiary change refetched", /7 creatures/.test((await connText()) ?? ""));

// ------------------------------------------------------------ 8. turn order
const P = () => frame("popover");
const sceneMeta = (key) => page.evaluate((k) => host.state.sceneMeta[`com.gizmo73.obsidian-bestiary/${k}`], key);
const rows = () => P().locator("ol.order li").evaluateAll((lis) => lis.map((li) => ({ id: li.dataset.id, cls: li.className, name: li.querySelector(".name").textContent, init: li.querySelector("input.init").value })));
const ringsOn = () => page.evaluate(() => host.state.local.filter((l) => l.metadata["com.gizmo73.obsidian-bestiary/turn-ring"]).map((l) => l.attachedTo).sort());

// link goblins and the Kuo-Toa again, and a PC token through the same menu
const link = async (tokenIds, query) => {
  await page.evaluate((ids) => host.select(ids), tokenIds);
  await page.evaluate(() => host.open("menu", "menu.html", 240, 230));
  await m().waitForSelector("#q");
  await m().locator("#q").fill(query);
  await m().locator("#q").press("Enter");
  await m().waitForSelector(".hp");
  page.evaluate(() => host.close("menu"));
};
await page.evaluate(() => host.addToken("pc1", "Berald token", 450, 600));
await link(["g1", "g2"], "goblin");
await link(["kuo"], "kuo toa");
await link(["pc1"], "Ber");
check("PC token linked through the menu search", (await page.evaluate(() => host.state.items.find((i) => i.id === "pc1").metadata["com.gizmo73.obsidian-bestiary/pc"]?.name)) === "Berald");

await P().waitForSelector("#party option[value='LiS']", { state: "attached" });
await P().locator("#party").selectOption("LiS");
await page.waitForTimeout(300);
check("choosing a party puts its PCs in the order", JSON.stringify((await sceneMeta("combat")).members) === '["Berald","Dogg"]');
let r = await rows();
check("order lists each token and the PCs", JSON.stringify(r.map((x) => x.name).sort()) === JSON.stringify(["Berald", "Dogg", "Goblin 1", "Goblin 2", "Kuo-Toa"]), r.map((x) => x.name).join(", "));

await P().evaluate(() => { Math.random = () => 0.5; }); // d20 -> 11
await P().locator("#roll").click();
await page.waitForTimeout(300);
let init = (await sceneMeta("combat")).init;
check("Roll: goblins share one roll (d20 + Dex), Kuo-Toa its own", init["t:g1"] === 13 && init["t:g2"] === 13 && init["t:kuo"] === 11 && init["p:berald"] === undefined, JSON.stringify(init));
const setInit = async (id, value) => {
  const input = P().locator(`li[data-id='${id}'] input.init`);
  await input.fill(String(value));
  await input.press("Enter");
  await page.waitForTimeout(200);
};
await setInit("p:berald", 20);
await setInit("p:dogg", 13);
r = await rows();
check("sorted high to low, ties go to monsters", JSON.stringify(r.map((x) => x.id)) === '["p:berald","t:g1","t:g2","p:dogg","t:kuo"]', r.map((x) => x.id).join(","));

await P().locator("li[data-id='t:kuo'] .hold").click();
await page.waitForTimeout(200);
check("hold marks Kuo-Toa as not in combat yet", (await sceneMeta("combat")).held.includes("t:kuo") && (await rows()).find((x) => x.id === "t:kuo").cls.includes("held"));

await P().locator("#next").click(); // Start
await page.waitForTimeout(500);
let c = await sceneMeta("combat");
check("Start: round 1, Berald first, his token selected + ringed", c.round === 1 && c.turn === "p:berald" && JSON.stringify(await page.evaluate(() => host.state.selection)) === '["pc1"]' && JSON.stringify(await ringsOn()) === '["pc1"]');
await P().locator("body").screenshot({ path: join(tmp, "panel-gm.png") });

await P().locator("#next").click();
await page.waitForTimeout(500);
c = await sceneMeta("combat");
check("Next: Goblin 1 alone, selected + ringed, statblock opened", c.turn === "t:g1" && JSON.stringify(await page.evaluate(() => host.state.selection)) === '["g1"]' && JSON.stringify(await ringsOn()) === '["g1"]' && shown.at(-1) === "Goblin");
await P().locator("#next").click();
await page.waitForTimeout(400);
c = await sceneMeta("combat");
check("Next: then Goblin 2", c.turn === "t:g2" && JSON.stringify(await page.evaluate(() => host.state.selection)) === '["g2"]' && JSON.stringify(await ringsOn()) === '["g2"]');

await P().locator("#next").click();
await page.waitForTimeout(300);
c = await sceneMeta("combat");
check("Next: Dogg (held Kuo-Toa will be skipped after him)", c.turn === "p:dogg" && JSON.stringify(await ringsOn()) === "[]");
await P().locator("#next").click();
await page.waitForTimeout(300);
c = await sceneMeta("combat");
check("Next skips held Kuo-Toa and wraps to round 2", c.turn === "p:berald" && c.round === 2);
await P().locator("#prev").click();
await page.waitForTimeout(300);
c = await sceneMeta("combat");
check("Previous goes back a round", c.turn === "p:dogg" && c.round === 1);

await P().locator("li[data-id='t:g2'] .name").click();
await page.waitForTimeout(300);
check("clicking a row selects its token (and opens the statblock)", JSON.stringify(await page.evaluate(() => host.state.selection)) === '["g2"]' && shown.at(-1) === "Goblin");

// damage and healing from the panel
const tokenHp = (id) => page.evaluate((i) => host.state.items.find((x) => x.id === i).metadata["com.gizmo73.obsidian-bestiary/creature"].hp, id);
const panelHp = async (id, text) => {
  await P().locator(`li[data-id='${id}'] .chip`).click();
  await P().locator(`li[data-id='${id}'] .hp-input`).fill(text);
  await P().locator(`li[data-id='${id}'] .hp-input`).press("Enter");
  await page.waitForTimeout(300);
};
await panelHp("t:g1", "4");
check("panel: '4' damages just Goblin 1", (await tokenHp("g1")) === 3 && (await tokenHp("g2")) === 7);
await panelHp("t:g1", "+2");
check("panel: '+2' heals", (await tokenHp("g1")) === 5 && (await P().locator("li[data-id='t:g1'] .chip").textContent()) === "5/7");
await P().locator("li[data-id='t:g1'] .chip").click();
await P().locator("li[data-id='t:g1'] .hp-input").fill("lots");
await P().locator("li[data-id='t:g1'] .hp-input").press("Enter");
await page.waitForTimeout(200);
check("panel: bad input explains the syntax", /Try 7, \+5, =20/.test(await P().locator(".error").first().innerText()));
await P().locator("li[data-id='t:g1'] .hp-input").press("Escape");
await panelHp("t:g1", "=0");
await panelHp("t:g2", "9");
check("downed goblins greyed in the GM list", (await rows()).filter((x) => x.id.startsWith("t:g")).every((x) => x.cls.includes("down")));
await P().locator("body").screenshot({ path: join(tmp, "panel-gm-hp.png") });
await P().locator("#next").click(); // Dogg -> wraps to Berald (round 2)
await page.waitForTimeout(300);
await P().locator("#next").click(); // Berald -> skips goblins -> Dogg
await page.waitForTimeout(300);
c = await sceneMeta("combat");
check("Next skips downed monsters", c.turn === "p:dogg" && c.round === 2, JSON.stringify({ turn: c.turn, round: c.round }));

// what players get
let order = await sceneMeta("order");
check("player order: names only, no held/downed, active marked", JSON.stringify(order) === JSON.stringify({ round: 2, entries: [{ name: "Berald", active: false }, { name: "Dogg", active: true }] }), JSON.stringify(order));
await P().locator("li[data-id='t:kuo'] .hold").click(); // Kuo-Toa joins...
await page.evaluate(() => host.editItems((items) => { items.find((i) => i.id === "kuo").visible = false; })); // ...but is invisible on the map
await page.waitForTimeout(400);
order = await sceneMeta("order");
check("monsters hidden on the map stay out of the players' list", !order.entries.some((e) => /Kuo/.test(e.name)));
await page.evaluate(() => host.editItems((items) => { items.find((i) => i.id === "kuo").visible = true; }));
await page.waitForTimeout(400);
order = await sceneMeta("order");
check("...and appear once visible", order.entries.some((e) => e.name === "Kuo-Toa"));

// a copy-pasted goblin carries Goblin 1's number; it gets the next free one
await page.evaluate(() => host.editItems((items) => {
  const g1 = items.find((i) => i.id === "g1");
  items.push({ ...JSON.parse(JSON.stringify(g1)), id: "g3", zIndex: 5, position: { x: 900, y: 300 } });
}));
await page.waitForTimeout(500);
check("copy-pasted token renumbered as Goblin 3", (await page.evaluate(() => host.state.items.find((i) => i.id === "g3").metadata["com.gizmo73.obsidian-bestiary/creature"].n)) === 3 && (await rows()).some((x) => x.name === "Goblin 3"));

// make a party in Owlbear (saved by the plugin)
await P().locator("#new-party").click();
await P().locator("#party-name").fill("Skirmish");
await P().locator(".member input[value='Malakyr']").check();
await P().locator("#party-extra").fill("Zed");
await P().locator("#party-form button[type=submit]").click();
await page.waitForTimeout(500);
check("new party saved through the plugin and applied", JSON.stringify(ownParties) === '[{"name":"Skirmish","members":["Malakyr","Zed"]}]' && (await sceneMeta("combat")).party === "Skirmish");
check("panel offers it under 'Made in Owlbear' with Edit", (await P().locator("#party optgroup[label='Made in Owlbear'] option").allTextContents()).includes("Skirmish") && (await P().locator("#edit-party").count()) === 1);

await P().locator("#end").click();
await P().locator("#end").click();
await page.waitForTimeout(300);
c = await sceneMeta("combat");
check("End (twice to confirm) clears rolls and round", c.round === 0 && Object.keys(c.init).length === 0 && JSON.stringify(await ringsOn()) === "[]");
await P().locator("#party").selectOption("LiS");
await page.waitForTimeout(300);
await P().locator("#roll").click();
await setInit("p:berald", 20);
await P().locator("#next").click();
await page.waitForTimeout(400);

// ------------------------------------------------------------ 9. players
await page.evaluate(() => { host.state.role = "PLAYER"; host.state.local = []; });
await page.evaluate(() => host.open("background", "background.html", 0, 0));
await page.evaluate(() => host.open("popover", "popover.html", 360, 320));
await page.waitForTimeout(800);
const playerText = await P().locator("body").innerText();
check("player panel shows the order without HP", /Initiative/.test(playerText) && /Berald/.test(playerText) && !/\d+\/\d+/.test(playerText) && (await P().locator(".hps, input, select, button").count()) === 0, playerText.replace(/\s+/g, " "));
check("player gets no local labels or rings", (await page.evaluate(() => host.state.local.length)) === 0);
await P().locator("body").screenshot({ path: join(tmp, "panel-player.png") });

const unhandled = await page.evaluate(() => host.state.log.filter((l) => l.startsWith("UNHANDLED")));
if (unhandled.length) console.log("INFO  unhandled SDK calls:", [...new Set(unhandled)].join(", "));

await browser.close();
await server.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
