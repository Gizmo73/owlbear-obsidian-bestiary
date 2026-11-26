// Turn order, independent of Owlbear: grouping tokens into entries, sorting,
// stepping turns and deciding what players may see.
//
// - Monsters of the same creature share one roll and act as one entry ("Goblin ×3").
// - PCs come from the chosen party (plus any token linked to a PC); the GM types their rolls.
// - Held entries ("not in combat yet") and downed monsters are skipped and hidden from players.
// - Players only ever get names and whose turn it is: never HP.

import { matchKey } from "./names";

export interface CombatState {
  /** 0 = combat not started. */
  round: number;
  /** Entry id whose turn it is. */
  turn: string | null;
  party: string | null;
  /** PC names in the chosen party. */
  members: string[];
  /** Entry id -> initiative total. */
  init: Record<string, number>;
  /** Entry ids that haven't joined the combat yet. */
  held: string[];
}

export const EMPTY_COMBAT: CombatState = { round: 0, turn: null, party: null, members: [], init: {}, held: [] };

export interface PublicOrder {
  round: number;
  entries: { name: string; active: boolean }[];
}

export interface MonsterToken {
  id: string;
  creature: string;
  /** Initiative modifier. */
  mod: number;
  hp: number;
  maxHp: number;
  /** Visible to players on the map. */
  visible: boolean;
}

export interface PcToken {
  id: string;
  pc: string;
  visible: boolean;
}

export interface EntryToken {
  id: string;
  hp?: number;
  maxHp?: number;
  visible: boolean;
}

export interface Entry {
  id: string;
  kind: "monster" | "pc";
  name: string;
  mod: number;
  init: number | null;
  held: boolean;
  /** Monster entry whose tokens are all at 0 HP or below. */
  down: boolean;
  tokens: EntryToken[];
}

export const monsterId = (creature: string) => `m:${matchKey(creature)}`;
export const pcId = (name: string) => `p:${matchKey(name)}`;

export function buildEntries(monsters: MonsterToken[], pcTokens: PcToken[], state: CombatState): Entry[] {
  const byId = new Map<string, Entry>();
  const held = new Set(state.held);
  const make = (id: string, kind: Entry["kind"], name: string, mod: number): Entry => ({
    id,
    kind,
    name,
    mod,
    init: typeof state.init[id] === "number" ? state.init[id] : null,
    held: held.has(id),
    down: false,
    tokens: [],
  });

  for (const t of monsters) {
    const id = monsterId(t.creature);
    const entry = byId.get(id) ?? make(id, "monster", t.creature, t.mod);
    entry.tokens.push({ id: t.id, hp: t.hp, maxHp: t.maxHp, visible: t.visible });
    byId.set(id, entry);
  }
  for (const e of byId.values()) e.down = e.tokens.every((t) => (t.hp ?? 1) <= 0);

  for (const name of state.members) {
    const id = pcId(name);
    if (!byId.has(id)) byId.set(id, make(id, "pc", name, 0));
  }
  for (const t of pcTokens) {
    const id = pcId(t.pc);
    const entry = byId.get(id) ?? make(id, "pc", t.pc, 0);
    entry.tokens.push({ id: t.id, visible: t.visible });
    byId.set(id, entry);
  }

  return [...byId.values()].sort(compareEntries);
}

/** Highest initiative first; unrolled last; ties: monsters first, then higher modifier, then name. */
export function compareEntries(a: Entry, b: Entry): number {
  if (a.init === null || b.init === null) {
    if (a.init !== b.init) return a.init === null ? 1 : -1;
  } else if (a.init !== b.init) return b.init - a.init;
  if (a.kind !== b.kind) return a.kind === "monster" ? -1 : 1;
  if (a.mod !== b.mod) return b.mod - a.mod;
  return a.name.localeCompare(b.name);
}

/** Entries that take turns: rolled, not held, not down. */
export function acting(entries: Entry[]): Entry[] {
  return entries.filter((e) => e.init !== null && !e.held && !e.down);
}

/**
 * Move the turn forward (+1) or back (-1). Starts combat if it hasn't started.
 * If the current entry has stopped acting (held, downed, removed), moves relative
 * to where it sat in the order.
 */
export function step(entries: Entry[], state: CombatState, dir: 1 | -1): Pick<CombatState, "turn" | "round"> {
  const order = acting(entries);
  if (!order.length) return { turn: null, round: state.round };
  if (state.round === 0 || state.turn === null) return { turn: order[0].id, round: 1 };

  let idx = order.findIndex((e) => e.id === state.turn);
  if (idx === -1) {
    // Current entry no longer acts: find its old slot among all entries.
    const all = entries.findIndex((e) => e.id === state.turn);
    const after = all === -1 ? -1 : order.findIndex((e) => entries.indexOf(e) > all);
    if (dir === 1) {
      if (after === -1) return { turn: order[0].id, round: state.round + 1 };
      return { turn: order[after].id, round: state.round };
    }
    idx = after === -1 ? order.length : after;
  }

  let next = idx + dir;
  let round = state.round;
  if (next >= order.length) {
    next = 0;
    round++;
  } else if (next < 0) {
    next = order.length - 1;
    round = Math.max(1, round - 1);
  }
  return { turn: order[next].id, round };
}

export function displayName(e: Entry): string {
  return e.kind === "monster" && e.tokens.length > 1 ? `${e.name} ×${e.tokens.length}` : e.name;
}

/** What players see: rolled entries that are in the fight and visible on the map. No HP. */
export function publicOrder(entries: Entry[], state: CombatState): PublicOrder {
  return {
    round: state.round,
    entries: entries
      .filter((e) => e.init !== null && !e.held && !e.down)
      .filter((e) => e.kind === "pc" || e.tokens.some((t) => t.visible))
      .map((e) => ({ name: displayName(e), active: e.id === state.turn })),
  };
}

export function rollD20(random: () => number = Math.random): number {
  return 1 + Math.floor(random() * 20);
}
