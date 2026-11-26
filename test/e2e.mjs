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
let tokenArt = {};
let creatureArt = {};
let staged = [
  {
    id: "block:Castle Never.md::Foyer Gargoyles",
    name: "Foyer Gargoyles",
    from: "Castle Never",
    creatures: [{ name: "Goblin", count: 3 }, { name: "Hobgoblin", count: 1, hp: 20 }, { name: "Mystery Beast", count: 1 }],
    addedAt: 2,
  },
  { id: "it:Orcs and Giant", name: "Orcs and Giant", from: "Initiative Tracker", creatures: [{ name: "Bugbear", count: 2 }], addedAt: 1 },
];
const encountersPayload = () => ({ encounters: [...staged].sort((a, b) => b.addedAt - a.addedAt), art: creatureArt });
const partiesPayload = () => ({
  art: tokenArt,
  parties: [{ name: "LiS", members: ["Berald", "Dogg"], source: "bridge" }, ...ownParties.map((p) => ({ ...p, source: "bridge" }))],
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
    } else if (msg.kind === "saveTokenArt") {
      for (const [name, art] of Object.entries(msg.art)) {
        if (art) tokenArt[name] = art;
        else delete tokenArt[name];
      }
      ok(partiesPayload());
    } else if (msg.kind === "getEncounters") ok(encountersPayload());
    else if (msg.kind === "removeEncounter") {
      staged = staged.filter((e) => e.id !== msg.encounterId);
      ok(encountersPayload());
    } else if (msg.kind === "saveCreatureArt") {
      for (const [name, art] of Object.entries(msg.art)) {
        if (art) creatureArt[name] = art;
        else delete creatureArt[name];
      }
      ok(encountersPayload());
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
entries = [
  ...entries,
  H.toEntry({ name: "Bugbear", hp: 27, ac: 16, stats: [15, 14, 13, 8, 11, 9], cr: 1 }),
  // a creature note that shares a PC's name (like "Selestia" in the vault)
  H.toEntry({ name: "Malakyr", hp: 4, ac: 10, stats: [10, 10, 10, 10, 10, 10], cr: 0 }),
];
version = H.indexVersion(entries);
server.broadcast({ push: "bestiaryChanged", version, creatureCount: entries.length });
await page.waitForTimeout(800);
check("pushed bestiary change refetched", /8 creatures/.test((await connText()) ?? ""));
await page.evaluate(() => host.addToken("pc2", "Malakyr", 600, 600));
const shownBefore = shown.length;
await page.evaluate(() => host.select(["pc2"]));
await page.waitForTimeout(400);
check("a token named after a PC never opens the Creature pane", shown.length === shownBefore, shown.slice(shownBefore).join(","));

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
const kuoVisible = () => page.evaluate(() => host.state.items.find((i) => i.id === "kuo").visible);
check("panel eye on a monster hides its token from players (and holds it)", (await kuoVisible()) === false && !(await sceneMeta("combat")).held.includes("t:kuo") && (await rows()).find((x) => x.id === "t:kuo").cls.includes("held"));

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
await P().locator("li[data-id='t:kuo'] .hold").click(); // reveal Kuo-Toa from the panel
await page.waitForTimeout(400);
order = await sceneMeta("order");
check("panel eye again reveals the token, and players see it in the list", (await kuoVisible()) === true && order.entries.some((e) => e.name === "Kuo-Toa") && !(await rows()).find((x) => x.id === "t:kuo").cls.includes("held"));
await page.evaluate(() => host.editItems((items) => { items.find((i) => i.id === "kuo").visible = false; })); // hidden with Owlbear's own hide
await page.waitForTimeout(400);
order = await sceneMeta("order");
check("hiding the token on the map greys it in the panel and drops it from the players' list", !order.entries.some((e) => /Kuo/.test(e.name)) && (await rows()).find((x) => x.id === "t:kuo").cls.includes("held"));
c = await sceneMeta("combat");
const fromDogg = await page.evaluate(() => host.state.sceneMeta["com.gizmo73.obsidian-bestiary/combat"].turn);
await P().locator("#next").click();
await page.waitForTimeout(300);
check("...and Next skips it", (await sceneMeta("combat")).turn !== "t:kuo", `${fromDogg} -> ${(await sceneMeta("combat")).turn}`);
await page.evaluate(() => host.editItems((items) => { items.find((i) => i.id === "kuo").visible = true; }));
await page.waitForTimeout(400);
order = await sceneMeta("order");
check("unhiding on the map brings it back everywhere", order.entries.some((e) => e.name === "Kuo-Toa") && !(await rows()).find((x) => x.id === "t:kuo").cls.includes("held"));

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
check("panel lists it with the other parties, with Edit", (await P().locator("#party option").allTextContents()).includes("Skirmish") && (await P().locator("#edit-party").count()) === 1);

// insert the party: Malakyr's token is already on the map (named, unlinked); Zed's image is picked
const asset = (name) => ({
  name,
  image: { url: `https://assets.example/${name}.png`, mime: "image/png", width: 300, height: 300 },
  grid: { dpi: 300, offset: { x: 150, y: 150 } },
  scale: { x: 1, y: 1 },
  rotation: 0,
  text: { type: "PLAIN", plainText: "", richText: [{ type: "paragraph", children: [{ text: "" }] }], style: {}, width: "AUTO", height: "AUTO" },
  textItemType: "LABEL",
  visible: true,
  locked: false,
  type: "CHARACTER",
});
const pcOf = (id) => page.evaluate((i) => host.state.items.find((x) => x.id === i)?.metadata["com.gizmo73.obsidian-bestiary/pc"]?.name ?? null, id);
const byImage = (name) => page.evaluate((n) => host.state.items.filter((i) => i.image?.url?.endsWith(`/${n}.png`)), name);
await page.evaluate((picks) => { host.state.nextPicks = picks; }, [asset("Zed"), asset("Owl Familiar")]);
await P().locator("#insert-party").click();
await page.waitForTimeout(700);
let pickerCalls = await page.evaluate(() => host.state.pickerCalls);
check("Insert party opens the picker only for PCs without a token, searched by name", pickerCalls.length === 1 && pickerCalls[0].defaultSearch === "Zed" && pickerCalls[0].multiple === true, JSON.stringify(pickerCalls));
check("a token already named after a PC gets linked, not duplicated", (await pcOf("pc2")) === "Malakyr" && (await page.evaluate(() => host.state.items.filter((i) => i.name === "Malakyr").length)) === 1);
const zed = await byImage("Zed");
const owl = await byImage("Owl Familiar");
check("picked token placed on the map, linked to the matching PC", zed.length === 1 && zed[0].layer === "CHARACTER" && zed[0].metadata["com.gizmo73.obsidian-bestiary/pc"]?.name === "Zed");
check("a picked image matching nobody is placed unlinked", owl.length === 1 && !owl[0].metadata["com.gizmo73.obsidian-bestiary/pc"]);
check("placed in a row at the view centre, snapped to the grid", zed[0].position.y === 375 && owl[0].position.y === 375 && zed[0].position.x !== owl[0].position.x, JSON.stringify([zed[0].position, owl[0].position]));
check("the link is saved in the vault (plugin), only for the matched PC", Object.keys(tokenArt).join() === "Zed" && tokenArt.Zed.image.url.endsWith("/Zed.png"));
check("panel says what happened", /Added Zed/.test(await P().locator(".notice").innerText()) && /Malakyr/.test(await P().locator(".notice").innerText()) && /Owl Familiar/.test(await P().locator(".notice").innerText()));
await P().locator("body").screenshot({ path: join(tmp, "panel-insert.png") });

// next time: no picker, straight from the saved link
await page.evaluate(() => host.editItems((items) => { const i = items.findIndex((x) => x.image?.url?.endsWith("/Zed.png")); items.splice(i, 1); }));
await page.waitForTimeout(300);
await P().locator("#insert-party").click();
await page.waitForTimeout(600);
pickerCalls = await page.evaluate(() => host.state.pickerCalls);
check("second Insert party uses the saved token, no picker", pickerCalls.length === 1 && (await byImage("Zed")).length === 1 && (await byImage("Zed"))[0].metadata["com.gizmo73.obsidian-bestiary/pc"]?.name === "Zed");
await P().locator("#insert-party").click();
await page.waitForTimeout(400);
check("nothing duplicated when everyone is already on the map", (await byImage("Zed")).length === 1 && /already on the map/.test(await P().locator(".notice").innerText()));
await P().locator("#repick").click();
await page.waitForTimeout(400);
pickerCalls = await page.evaluate(() => host.state.pickerCalls);
check("Re-pick opens the picker for the whole party", pickerCalls.length === 2 && !pickerCalls[1].defaultSearch);

// when Owlbear refuses the picker: say why, and learn tokens from the map instead
await P().locator("#party").selectOption("LiS"); // Berald (on the map) + Dogg (no token yet)
await page.waitForTimeout(300);
await page.evaluate(() => { host.state.pickerError = { code: "ASSETS_UNAVAILABLE" }; });
await P().locator("#insert-party").click();
await page.waitForTimeout(600);
let notice = await P().locator(".notice").innerText();
pickerCalls = await page.evaluate(() => host.state.pickerCalls);
check("picker failure shows Owlbear's actual error, after plainer retries", /ASSETS_UNAVAILABLE/.test(notice) && !/undefined/.test(notice) && pickerCalls.length === 5, notice);
check("...and says how to get going without it", /Drag Dogg onto the map/.test(notice));
await page.evaluate((a) => {
  host.state.pickerError = null;
  host.addToken("dogg", "Dogg", 900, 600);
  Object.assign(host.state.items.find((i) => i.id === "dogg"), { image: a.image, grid: a.grid });
}, asset("Dogg"));
await P().locator("#insert-party").click();
await page.waitForTimeout(500);
check("dragged-in token gets linked and its image remembered in the vault", (await pcOf("dogg")) === "Dogg" && tokenArt.Dogg?.image?.url.endsWith("/Dogg.png"));
await page.evaluate(() => host.editItems((items) => items.splice(items.findIndex((i) => i.id === "dogg"), 1)));
await page.waitForTimeout(300);
await P().locator("#insert-party").click();
await page.waitForTimeout(500);
check("next Insert party recreates it from the remembered image, no picker", (await byImage("Dogg")).length === 1 && (await byImage("Dogg"))[0].metadata["com.gizmo73.obsidian-bestiary/pc"]?.name === "Dogg" && (await page.evaluate(() => host.state.pickerCalls.length)) === 5);

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

// ------------------------------------------------------------ 9. encounters
const goblinsOnMap = () => page.evaluate(() => host.state.items.filter((i) => i.metadata["com.gizmo73.obsidian-bestiary/creature"]?.name === "Goblin"));
const opts = await P().locator("#encounter option").allTextContents();
check("panel lists the encounters sent from Obsidian, newest first", JSON.stringify(opts) === '["Foyer Gargoyles","Orcs and Giant"]', JSON.stringify(opts));
const summary = await P().locator(".enc-summary").innerText();
check("shows what's in it and which creatures still need a token", /Goblin ×3, Hobgoblin, Mystery Beast/.test(summary) && /Castle Never/.test(summary) && /pick a token for Goblin, Hobgoblin, Mystery Beast/.test(summary), summary.replace(/\s+/g, " "));
const before = (await goblinsOnMap()).map((g) => g.metadata["com.gizmo73.obsidian-bestiary/creature"].n).sort((a, b) => a - b);
await page.evaluate((q) => { host.state.pickQueue = q; }, [[asset("Goblin Token")], [asset("Hobgoblin")], [asset("Strange Thing")]]);
const callsBefore = (await page.evaluate(() => host.state.pickerCalls)).length;
await P().locator("#insert-encounter").click();
await page.waitForTimeout(900);
const calls = (await page.evaluate(() => host.state.pickerCalls)).slice(callsBefore);
check("first insert: one picker per creature, searched by name, single pick", JSON.stringify(calls.map((c) => [c.defaultSearch, c.multiple])) === '[["Goblin",false],["Hobgoblin",false],["Mystery Beast",false]]', JSON.stringify(calls));
const newGoblins = (await goblinsOnMap()).filter((g) => g.image?.url?.endsWith("/Goblin Token.png"));
check("monsters arrive hidden, linked and numbered after those already there", newGoblins.length === 3 && newGoblins.every((g) => g.visible === false) && JSON.stringify(newGoblins.map((g) => g.metadata["com.gizmo73.obsidian-bestiary/creature"].n).sort((a, b) => a - b)) === JSON.stringify([1, 2, 3].map((k) => Math.max(...before) + k)), JSON.stringify({ before, now: newGoblins.map((g) => g.metadata["com.gizmo73.obsidian-bestiary/creature"].n) }));
const hob = (await byImage("Hobgoblin"))[0];
check("block's HP override used", hob?.metadata["com.gizmo73.obsidian-bestiary/creature"]?.maxHp === 20 && hob.visible === false);
const beast = (await byImage("Strange Thing"))[0];
check("creature not in the bestiary placed hidden and unlinked", beast && !beast.metadata["com.gizmo73.obsidian-bestiary/creature"] && beast.visible === false);
const ys = [...new Set([...newGoblins, hob, beast].map((i) => i.position.y))];
check("one row per creature at the view centre", ys.length === 3 && new Set(newGoblins.map((g) => g.position.y)).size === 1, JSON.stringify(ys));
check("token images saved to the vault per creature", JSON.stringify(Object.keys(creatureArt).sort()) === '["Goblin","Hobgoblin","Mystery Beast"]');
const encNotice = await P().locator(".notice").last().innerText();
check("panel reports what was added", /Added Goblin ×3, Hobgoblin \(hidden\)/.test(encNotice) && /Mystery Beast placed unlinked/.test(encNotice), encNotice);
check("hidden newcomers sit greyed in the turn order", (await rows()).filter((x) => x.id.startsWith("t:") && newGoblins.some((g) => x.id === `t:${g.id}`)).every((x) => x.cls.includes("held")));
await P().locator("#insert-encounter").click();
await page.waitForTimeout(600);
check("inserting again uses the saved images, no picker", (await page.evaluate(() => host.state.pickerCalls)).length === callsBefore + 3 && (await byImage("Goblin Token")).length === 6);
await P().locator("body").screenshot({ path: join(tmp, "panel-encounters.png") });
await P().locator("#remove-encounter").click();
await page.waitForTimeout(400);
const optsAfter = await P().locator("#encounter option").allTextContents();
check("✕ removes it from the list (kept in the vault until then)", staged.length === 1 && JSON.stringify(optsAfter) === '["Orcs and Giant"]', JSON.stringify({ staged: staged.length, optsAfter }));

// "Add to Owlbear" from a statblock in Obsidian
const goblinCount = (await goblinsOnMap()).length;
server.broadcast({ push: "addCreature", name: "Goblin" });
await page.waitForTimeout(700);
const all = await goblinsOnMap();
const added = all.filter((g) => !newGoblins.some((n) => n.id === g.id)).at(-1);
check("Add to Owlbear: one hidden, linked, numbered goblin from the saved image", all.length === goblinCount + 1 && added.visible === false && added.image?.url?.endsWith("/Goblin Token.png") && added.metadata["com.gizmo73.obsidian-bestiary/creature"].n === Math.max(...all.map((g) => g.metadata["com.gizmo73.obsidian-bestiary/creature"].n)));
check("Owlbear shows a notification", /Added Goblin \(hidden\)/.test((await page.evaluate(() => host.state.notifications.at(-1)?.message)) ?? ""));

// ------------------------------------------------------------ 10. players
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
