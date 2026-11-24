// Unit checks for the shared logic, using real data where the repo has it:
// - creatures saved in Fantasy Statblocks' data.json (the copy in this repo)
// - every creature name in the vault's Campaign/Statblocks folder, if the vault is checked out next to this repo
import { build } from "esbuild";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(root, "test", ".tmp");
await mkdir(tmp, { recursive: true });
await build({
  stdin: {
    contents: `export * from "../src/shared/names.ts"; export * from "../src/shared/hp.ts";
export * from "../src/shared/search.ts"; export * from "../src/shared/bestiary.ts";`,
    resolveDir: join(root, "test"),
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: join(tmp, "unit-harness.cjs"),
  logLevel: "warning",
});
const S = require(join(tmp, "unit-harness.cjs"));

let failures = 0;
const eq = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`);
  if (!ok) failures++;
};

// ------------------------------------------------------------ names
eq("suffixes stripped", ["Goblin 2", "Goblin A", "Goblin A1", "Goblin #3", "Goblin (3)"].map(S.stripTokenSuffix), Array(5).fill("Goblin"));
eq("names without suffix untouched", ["Adult Red Dragon", "Ogre", "Kuo-Toa"].map(S.stripTokenSuffix), ["Adult Red Dragon", "Ogre", "Kuo-Toa"]);
eq("loose key", [S.matchKey("Kuo Toa"), S.matchKey("Kuo-Toa"), S.matchKey("Yelena, Hand of the Withering")], ["kuotoa", "kuotoa", "yelenahandofthewithering"]);
eq("label tried before name", S.nameCandidates({ name: "Goblin", label: "Boss 1" }), ["Boss 1", "Boss", "Goblin"]);

// ------------------------------------------------------------ HP
const st = { hp: 10, maxHp: 20 };
eq("parse", ["7", "-7", "+5", "=12", "= -3", "max 30", "m25", "", "abc", "+"].map(S.parseHpInput), [
  { kind: "damage", amount: 7 }, { kind: "damage", amount: 7 }, { kind: "heal", amount: 5 }, { kind: "set", amount: 12 },
  { kind: "set", amount: -3 }, { kind: "max", amount: 30 }, { kind: "max", amount: 25 }, null, null, null,
]);
eq("damage below 0", S.applyHp(st, { kind: "damage", amount: 15 }), { hp: -5, maxHp: 20 });
eq("heal capped at max", S.applyHp(st, { kind: "heal", amount: 50 }), { hp: 20, maxHp: 20 });
eq("heal from negative starts at 0", S.applyHp({ hp: -4, maxHp: 20 }, { kind: "heal", amount: 3 }), { hp: 3, maxHp: 20 });
eq("max keeps damage taken", S.applyHp(st, { kind: "max", amount: 30 }), { hp: 20, maxHp: 30 });
eq("bands", [S.hpBand({ hp: 11, maxHp: 20 }), S.hpBand({ hp: 10, maxHp: 20 }), S.hpBand({ hp: 0, maxHp: 20 })], ["healthy", "bloodied", "down"]);

// ------------------------------------------------------------ index entries
eq("entry from strings", S.toEntry({ name: "Goblin Boss", hp: "21 (6d6)", ac: "17 (chain shirt)", stats: [10, 14, 10, 10, 8, 10], cr: 1, type: "humanoid" }), {
  name: "Goblin Boss", hp: 21, ac: 17, init: 2, cr: "1", type: "humanoid",
});
eq("fractional CR + explicit initiative", S.toEntry({ name: "X", hp: 5, ac: 10, stats: [10, 18], cr: 0.125, initiative: "+7" }).cr + "/" + S.toEntry({ name: "X", stats: [10, 18], initiative: "+7" }).init, "1/8/7");
eq("players skipped", S.toEntry({ name: "Berald", player: true }), null);

const fsData = JSON.parse(await readFile(join(root, "Fantasy Statblocks", "data.json"), "utf8"));
const saved = fsData.monsters.map(([, m]) => S.toEntry(m)).filter(Boolean);
eq(`all ${fsData.monsters.length} saved Fantasy Statblocks creatures index with numeric HP/AC`, saved.every((e) => Number.isInteger(e.hp) && Number.isInteger(e.ac)), true);

// ------------------------------------------------------------ search on real vault names
const vault = join(root, "..", "campaign-master", "Campaign", "Statblocks");
if (existsSync(vault)) {
  const names = (await readdir(vault)).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));
  const search = new S.BestiarySearch(names.map((name) => ({ name, hp: 1, ac: 10, init: 0, cr: "1", type: "" })));
  const top = (q) => search.search(q, 3).map((e) => e.name)[0];
  eq(`"Kuo Toa" finds Kuo-Toa (${names.length} vault creatures)`, top("Kuo Toa"), "Kuo-Toa");
  eq('"ghoul" finds Ghoul', top("ghoul"), "Ghoul");
  eq('"adult red" finds Adult Red Dragon', top("adult red"), "Adult Red Dragon");
  eq('"flame skull" finds Flameskull', top("flame skull"), "Flameskull");
  eq("find() is exact on the loose key", search.find("kuo toa")?.name, "Kuo-Toa");
} else {
  console.log("SKIP  vault search checks (campaign-master not checked out next to this repo)");
}

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
