// The compact bestiary index the plugin sends to Owlbear: just what's needed
// to search, assign HP/AC and roll initiative. The full statblock stays in
// Obsidian and is shown in Fantasy Statblocks' Creature pane.

export interface BestiaryEntry {
  name: string;
  hp: number | null;
  ac: number | null;
  /** Initiative modifier (Dex modifier unless the statblock sets one). */
  init: number;
  cr: string;
  type: string;
}

const CR_FRACTIONS: Record<string, string> = { "0.125": "1/8", "0.25": "1/4", "0.5": "1/2" };

function leadingInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value !== "string") return null;
  const m = /-?\d+/.exec(value.replace(/[​-‎﻿]/g, ""));
  return m ? Number(m[0]) : null;
}

function signedInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value !== "string") return null;
  const m = /^\s*([+-]?\d+)/.exec(value);
  return m ? Number(m[1]) : null;
}

/** Turn a Fantasy Statblocks creature (extends already resolved) into an index entry. */
export function toEntry(creature: Record<string, unknown>): BestiaryEntry | null {
  const name = typeof creature.name === "string" ? creature.name.trim() : "";
  if (!name || creature.player === true) return null;

  const stats = Array.isArray(creature.stats) ? creature.stats : [];
  const dex = leadingInt(stats[1]);
  const init = signedInt(creature.initiative) ?? (dex === null ? 0 : Math.floor((dex - 10) / 2));

  const rawCr = creature.cr === undefined || creature.cr === null ? "" : String(creature.cr).trim();
  const cr = CR_FRACTIONS[rawCr] ?? rawCr;

  return {
    name,
    hp: leadingInt(creature.hp),
    ac: leadingInt(creature.ac),
    init,
    cr,
    type: typeof creature.type === "string" ? creature.type : "",
  };
}

/** Stable short fingerprint of an index, so clients can tell when to refetch. */
export function indexVersion(entries: BestiaryEntry[]): string {
  let h = 2166136261;
  const text = JSON.stringify(entries);
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${entries.length}-${(h >>> 0).toString(36)}`;
}
