// Putting creatures on the map: "Insert encounter" in the panel and "Add to Owlbear"
// from a statblock. Tokens arrive hidden (not in the fight yet), linked and numbered,
// one row per creature at the centre of the view. Creatures not in the bestiary are
// placed as plain, unlinked tokens.

import OBR, { isImage, type Item } from "@owlbear-rodeo/sdk";
import type { CreatureSpec } from "../shared/encounter";
import type { TokenArt } from "../shared/protocol";
import type { BestiarySearch } from "../shared/search";
import { nextNumbers } from "../shared/turns";
import { artFromItem, buildToken, pickImages, toArt, tokenSize, viewCentre } from "./assets";
import { TOKEN_KEY, creatureFromEntry, readCreature, usedNumbers, type TokenCreature } from "./common";

export interface InsertOptions {
  search: BestiarySearch | null;
  /** Saved images by creature name. */
  art: Record<string, TokenArt>;
  /** Persist newly learned / picked images (to the vault, through the plugin). */
  saveArt: (art: Record<string, TokenArt>) => void;
  hidden: boolean;
}

export interface InsertResult {
  /** "Goblin ×5", per creature placed. */
  placed: { name: string; count: number; linked: boolean }[];
  /** Creatures left out because no image was picked. */
  skipped: string[];
  pickerError?: string;
  ids: string[];
}

export async function insertCreatures(specs: CreatureSpec[], opts: InsertOptions): Promise<InsertResult> {
  const result: InsertResult = { placed: [], skipped: [], ids: [] };
  const items = await OBR.scene.items.getItems();
  const art = { ...opts.art };
  const learned: Record<string, TokenArt> = {};

  // Each creature by its bestiary name (or as written, if unknown).
  const rows = specs
    .filter((s) => s.count > 0)
    .map((s) => {
      const entry = opts.search?.find(s.name) ?? null;
      return { spec: s, entry, key: entry?.name ?? s.name };
    });

  // Tokens of these creatures already on the map teach us their image.
  for (const item of items) {
    const c = readCreature(item.metadata);
    if (c && !art[c.name] && isImage(item) && item.image?.url) learned[c.name] = art[c.name] = artFromItem(item);
  }

  // Anything still without an image: ask once per creature, searched by its name.
  for (const { key } of rows) {
    if (art[key] || result.pickerError !== undefined) continue;
    const { picks, error } = await pickImages(key, false);
    if (error) result.pickerError = error;
    else if (picks[0]) {
      learned[key] = art[key] = toArt(picks[0]);
    }
  }
  if (Object.keys(learned).length) opts.saveArt(learned);

  const placeable = rows.filter((r) => art[r.key]);
  result.skipped = rows.filter((r) => !art[r.key]).map((r) => r.key);
  if (!placeable.length) return result;

  // One row per creature, the block centred on the view, snapped to the grid.
  const dpi = await OBR.scene.grid.getDpi();
  const centre = await viewCentre();
  const sizes = await Promise.all(placeable.map((r) => tokenSize(art[r.key])));
  const rowHeights = sizes.map((s) => Math.max(dpi, s));
  const total = rowHeights.reduce((a, b) => a + b, 0);
  let y = centre.y - total / 2;

  const tokens: Item[] = [];
  for (const [i, { spec, entry, key }] of placeable.entries()) {
    const spacing = rowHeights[i];
    const rowY = y + spacing / 2;
    y += spacing;
    const numbers = entry ? nextNumbers(usedNumbers(items, entry.name), spec.count) : [];
    for (let k = 0; k < spec.count; k++) {
      const x = centre.x + (k - (spec.count - 1) / 2) * spacing;
      const position = await OBR.scene.grid.snapPosition({ x, y: rowY });
      let metadata: Record<string, unknown> = {};
      if (entry) {
        const base = creatureFromEntry(entry);
        const maxHp = spec.hp ?? base.maxHp;
        const creature: TokenCreature = {
          ...base,
          hp: maxHp,
          maxHp,
          ac: spec.ac ?? base.ac,
          init: spec.mod ?? base.init,
          n: numbers[k],
        };
        metadata = { [TOKEN_KEY]: creature };
      }
      tokens.push(buildToken(art[key], position, metadata, !opts.hidden));
    }
    result.placed.push({ name: key, count: spec.count, linked: !!entry });
  }
  await OBR.scene.items.addItems(tokens);
  result.ids = tokens.map((t) => t.id);
  return result;
}

/** "Added Goblin ×5, Hobgoblin (hidden); Mystery Beast unlinked (not in your bestiary)" */
export function describeInsert(r: InsertResult, hidden: boolean): string {
  const parts: string[] = [];
  const linked = r.placed.filter((p) => p.linked);
  const unlinked = r.placed.filter((p) => !p.linked);
  const list = (ps: InsertResult["placed"]) => ps.map((p) => (p.count > 1 ? `${p.name} ×${p.count}` : p.name)).join(", ");
  if (linked.length) parts.push(`Added ${list(linked)}${hidden ? " (hidden)" : ""}`);
  if (unlinked.length) parts.push(`${list(unlinked)} placed unlinked (not in your bestiary)`);
  if (r.pickerError) parts.push(`Owlbear's token picker didn't open (${r.pickerError}); drag one ${r.skipped.join(", ")} onto the map and try again`);
  else if (r.skipped.length) parts.push(`no token picked for ${r.skipped.join(", ")}`);
  return parts.length ? `${parts.join("; ")}.` : "Nothing to add.";
}
