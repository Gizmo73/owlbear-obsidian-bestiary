// Smoke test for the Obsidian plugin's Obsidian-facing code, which the other tests can't
// reach: the real plugin runs in headless Chromium with a fake Obsidian (test/obsidian-stub.ts)
// and a fake bridge server. Checks the Initiative Tracker import, `encounter` block rendering,
// Send to Owlbear, the cursor command, and "Add to Owlbear".
// Run: node test/plugin-smoke.mjs
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(root, "test", ".tmp");
await mkdir(tmp, { recursive: true });

// Fake server: records what the plugin would push to Owlbear.
await writeFile(
  join(tmp, "server-stub.ts"),
  `export function startBridgeServer() {
  return { listening: Promise.resolve(), broadcast: (m: unknown) => (window as any).__pushes.push(m), close: async () => {} };
}`,
);

const bundle = await build({
  entryPoints: [join(root, "src", "plugin", "main.ts")],
  bundle: true,
  format: "iife",
  globalName: "PluginModule",
  platform: "browser",
  write: false,
  logLevel: "warning",
  plugins: [
    {
      name: "stubs",
      setup(b) {
        b.onResolve({ filter: /^obsidian$/ }, () => ({ path: join(root, "test", "obsidian-stub.ts") }));
        b.onResolve({ filter: /^\.\/server$/ }, () => ({ path: join(tmp, "server-stub.ts") }));
      },
    },
  ],
});

let failures = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
  if (!ok) failures++;
};

const itData = await readFile(join(root, "Initiative Tracker", "data.json"), "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.setContent("<!doctype html><html><head></head><body></body></html>");
await page.evaluate(() => { window.__pushes = []; });
await page.addScriptTag({ content: bundle.outputFiles[0].text });

// A fake Obsidian app with Initiative Tracker's data.json on disk, Initiative Tracker disabled.
await page.evaluate(async (itJson) => {
  const headings = {
    "Castle Never.md": [{ heading: "2. Kitchen", level: 2, position: { start: { line: 10 } } }],
  };
  const shown = [];
  window.__shown = shown;
  const app = {
    vault: { getName: () => "Campaign Master", configDir: ".obsidian", adapter: { read: async (p) => (p.endsWith("initiative-tracker/data.json") ? itJson : Promise.reject(new Error("nope"))) } },
    metadataCache: { getCache: (p) => ({ headings: headings[p] ?? [] }) },
    workspace: { on: () => ({}), onLayoutReady: (fn) => fn(), getActiveViewOfType: () => null },
    plugins: {
      enabledPlugins: new Set(["obsidian-5e-statblocks"]),
      getPlugin: (id) => (id === "obsidian-5e-statblocks" ? { creature_view: { render: async (c) => shown.push(c?.name ?? c) } } : null),
    },
  };
  window.FantasyStatblocks = {
    isResolved: () => true,
    getBestiaryNames: () => ["Gargoyle", "Swarm of Bats", "Goblin"],
    getCreatureFromBestiary: (n) => ({ name: n, hp: 52, ac: 15, stats: [15, 11, 16, 6, 11, 7], cr: 2 }),
    getBestiary: () => new Map([["Gargoyle", { name: "Gargoyle" }], ["Goblin", { name: "Goblin" }]]),
  };
  const Plugin = window.PluginModule.default;
  const plugin = new Plugin(app, { id: "owlbear-bestiary-bridge", version: "test" });
  window.__plugin = plugin;
  await plugin.onload();
  await new Promise((r) => setTimeout(r, 50));
}, itData);

// ------------------------------------------------------------ import
let s = await page.evaluate(() => window.__plugin.settings);
check("first load imports Initiative Tracker's parties, players and saved encounters", s.parties.length === 4 && s.players.length >= 7 && s.encounters.length === 7 && s.importedFromInitiativeTracker > 0, `${s.parties.length} parties, ${s.players.length} players, ${s.encounters.length} encounters`);
check("...and says so", (await page.evaluate(() => window.__notices.some((n) => /imported from Initiative Tracker: 4 parties/.test(n)))));
await page.evaluate(() => window.__plugin.importFromInitiativeTracker(true));
s = await page.evaluate(() => window.__plugin.settings);
check("importing again adds nothing twice", s.parties.length === 4 && s.encounters.length === 7);
const parties = await page.evaluate(() => window.__plugin.parties());
check("parties now come from the plugin only", parties.parties.every((p) => p.source === "bridge") && parties.pcs.includes("Berald"));

// ------------------------------------------------------------ encounter blocks
check("takes over `encounter` blocks while Initiative Tracker is disabled", await page.evaluate(() => typeof window.__plugin.processors.encounter === "function" && window.__plugin.encounterBlocks));
const fileText = ["# Castle Never", "", "", "", "", "", "", "", "", "", "## 2. Kitchen", "", "```encounter", "creatures:", "  - 5:Gargoyle", "  - 3: Swarm of Bats", "  - 2: Mystery Beast, 30", "```", "", "```encounter", "creatures:", "  - Goblin", "```"].join("\n");
await page.evaluate((text) => {
  const render = (lineStart, source) => {
    const el = document.body.createDiv({ cls: `block-${lineStart}` });
    window.__plugin.processors.encounter(source, el, { sourcePath: "Castle Never.md", getSectionInfo: () => ({ text, lineStart, lineEnd: lineStart + 4 }) });
  };
  render(12, "creatures:\n  - 5:Gargoyle\n  - 3: Swarm of Bats\n  - 2: Mystery Beast, 30\n");
  render(19, "creatures:\n  - Goblin\n");
}, fileText);
const first = await page.locator(".block-12").innerText();
check("unnamed block titled by note › heading, creatures listed", /Castle Never › 2\. Kitchen/.test(first) && /5 ×\s*Gargoyle/.test(first) && /3 ×\s*Swarm of Bats/.test(first) && /Mystery Beast/.test(first) && /HP 30/.test(first), first.replace(/\s+/g, " "));
check("second unnamed block under the same heading gets its own name", /Castle Never › 2\. Kitchen \(2\)/.test(await page.locator(".block-19").innerText()));
check("unknown creature marked as such", (await page.locator(".block-12 .obb-unknown").innerText()) === "Mystery Beast");
await page.locator(".block-12 a", { hasText: "Gargoyle" }).click();
check("clicking a creature shows it in the Creature pane", (await page.evaluate(() => window.__shown.at(-1))) === "Gargoyle");

await page.locator(".block-12 button", { hasText: "Send to Owlbear" }).click();
await page.waitForTimeout(50);
s = await page.evaluate(() => window.__plugin.settings);
const sent = s.encounters.find((e) => e.name === "Castle Never › 2. Kitchen");
check("Send to Owlbear stores the encounter in the vault", sent && sent.creatures.length === 3 && sent.creatures[2].hp === 30 && sent.from === "Castle Never");
check("...tells Owlbear the list changed", await page.evaluate(() => window.__pushes.some((p) => p.push === "encountersChanged")));
check("...and the block now offers Update / Remove", /In Owlbear's list/.test(await page.locator(".block-12").innerText()));
await page.locator(".block-12 button", { hasText: "Remove" }).click();
await page.waitForTimeout(50);
check("Remove takes it off the list", !(await page.evaluate(() => window.__plugin.settings.encounters.some((e) => e.name === "Castle Never › 2. Kitchen"))));

// ------------------------------------------------------------ command (block inside a callout, cursor inside it)
const result = await page.evaluate(() => {
  const lines = ["## Ambush", "> [!danger] Fight", "> ```encounter", "> name: Roadside Ambush", "> creatures:", ">   - 4: Goblin", "> ```"];
  const editor = { getCursor: () => ({ line: 5 }), getLine: (i) => lines[i], lineCount: () => lines.length, getValue: () => lines.join("\n") };
  const cmd = window.__plugin.commands.find((c) => c.id === "send-encounter-under-cursor");
  const available = cmd.editorCheckCallback(true, editor, { file: { path: "Road.md" } });
  cmd.editorCheckCallback(false, editor, { file: { path: "Road.md" } });
  return available;
});
await page.waitForTimeout(50);
const road = await page.evaluate(() => window.__plugin.settings.encounters.find((e) => e.name === "Roadside Ambush"));
check("command sends the block under the cursor, even inside a callout", result === true && road?.creatures?.[0]?.count === 4);

// ------------------------------------------------------------ Add to Owlbear
await page.evaluate(() => window.OwlbearBridge.addToOwlbear({ name: "goblin" }));
check("Add to Owlbear without Owlbear connected explains why", await page.evaluate(() => /Owlbear isn't connected/.test(window.__notices.at(-1))));
await page.evaluate(() => { window.__plugin.clients = 1; window.OwlbearBridge.addToOwlbear({ name: "goblin" }); });
check("Add to Owlbear pushes the creature by its bestiary name", await page.evaluate(() => JSON.stringify(window.__pushes.at(-1)) === '{"push":"addCreature","name":"Goblin"}'));

// ------------------------------------------------------------ Initiative Tracker still on
const coexist = await page.evaluate(async () => {
  const Plugin = window.PluginModule.default;
  const app = { ...window.__plugin.app, plugins: { ...window.__plugin.app.plugins, enabledPlugins: new Set(["initiative-tracker"]) } };
  const p = new Plugin(app, { id: "x", version: "t" });
  p.data = { importedFromInitiativeTracker: 1 };
  await p.onload();
  return { processor: !!p.processors.encounter, command: p.commands.some((c) => c.id === "send-encounter-under-cursor") };
});
check("leaves `encounter` blocks to Initiative Tracker while it's enabled; command still works", !coexist.processor && coexist.command);

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
