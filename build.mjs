// Builds both halves:
//   docs/                        -> Owlbear extension "Obsidian Bestiary" (served by GitHub Pages)
//   dist/owlbear-bestiary-bridge/ -> Obsidian plugin to copy into <vault>/.obsidian/plugins/
import { build } from "esbuild";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const BASE = process.env.EXTENSION_BASE ?? "https://gizmo73.github.io/owlbear-obsidian-bestiary/";
const docs = join(root, "docs");
const pluginOut = join(root, "dist", "owlbear-bestiary-bridge");

// ------------------------------------------------------------ Owlbear extension
await mkdir(docs, { recursive: true });
await build({
  entryPoints: ["background", "menu", "popover"].map((n) => join(root, "src", "extension", `${n}.ts`)),
  outdir: docs,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  logLevel: "warning",
});
for (const file of ["background.html", "menu.html", "popover.html", "style.css", "icon.svg"]) {
  await copyFile(join(root, "src", "extension", "pages", file), join(docs, file));
}
await writeFile(
  join(docs, "manifest.json"),
  JSON.stringify(
    {
      name: "Obsidian Bestiary",
      version: pkg.version,
      manifest_version: 1,
      action: {
        title: "Obsidian Bestiary",
        icon: `${BASE}icon.svg`,
        popover: `${BASE}popover.html`,
        width: 340,
        height: 380,
      },
      icon: `${BASE}icon.svg`,
      background_url: `${BASE}background.html`,
      author: "Gizmo73",
      homepage_url: "https://github.com/Gizmo73/owlbear-obsidian-bestiary",
      description:
        "Link tokens to statblocks in your Obsidian vault, track HP, and open statblocks in Obsidian's Creature pane.",
    },
    null,
    2,
  ),
);
await writeFile(join(docs, ".nojekyll"), "");

// ------------------------------------------------------------ Obsidian plugin
await mkdir(pluginOut, { recursive: true });
await build({
  entryPoints: [join(root, "src", "plugin", "main.ts")],
  outfile: join(pluginOut, "main.js"),
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "es2020",
  external: ["obsidian", "electron", "bufferutil", "utf-8-validate"],
  logLevel: "warning",
});
const manifest = JSON.parse(await readFile(join(root, "src", "plugin", "manifest.json"), "utf8"));
manifest.version = pkg.version;
await writeFile(join(pluginOut, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(`built docs/ (extension at ${BASE}manifest.json) and dist/owlbear-bestiary-bridge/`);
