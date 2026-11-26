// Encounters: reading Initiative Tracker-style `encounter` blocks, and importing
// Initiative Tracker's saved data (players, parties, saved encounters) once.

export interface CreatureSpec {
  name: string;
  count: number;
  /** Overrides from the block ("- 2: Goblin, 10, 15, 2"). */
  hp?: number;
  ac?: number;
  mod?: number;
  hidden?: boolean;
  ally?: boolean;
}

export interface StagedEncounter {
  /** Stable per source, so re-sending a block updates its entry. */
  id: string;
  name: string;
  /** Where it came from, for the panel ("Castle Never › 2. Kitchen" or "Initiative Tracker"). */
  from: string;
  party?: string;
  creatures: CreatureSpec[];
  addedAt: number;
}

const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
};

const FLAG_HIDDEN = /^hidden$/i;
const FLAG_ALLY = /^(friend|friendly|ally)$/i;

/**
 * One creature line, in any form Initiative Tracker accepts:
 *   "3: Goblin"  "Goblin"  "3: Goblin, 10, 15, 2"  "Goblin, hidden"  "2: Wolf, ally"
 *   ["Goblin", 10, 15]   { 3: "Goblin" }   { 3: ["Goblin", 10] }
 *   { creature: "Goblin", hp: 10, ac: 15, mod: 2, hidden: true }
 * Dice counts ("1d4") aren't rolled here; they count as 1.
 */
export function parseCreature(raw: unknown): CreatureSpec | null {
  if (raw === null || raw === undefined || raw === "") return null;
  let count: unknown = 1;
  let body: unknown = raw;

  if (typeof raw === "string") {
    const m = /^\s*(\d+)\s*:\s*(.*)$/.exec(raw);
    if (m) {
      count = Number(m[1]);
      body = m[2];
    } else {
      body = raw.replace(/^\s*:\s*/, "");
    }
  } else if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.creature === "string") {
      return finish(obj.creature, 1, [obj.hp, obj.ac, obj.mod], !!obj.hidden, !!(obj.friend || obj.ally));
    }
    const [k, v] = Object.entries(obj)[0] ?? [];
    count = k;
    body = v;
  }

  const n = num(count);
  const c = n === undefined ? 1 : Math.max(0, Math.trunc(n));

  if (typeof body === "string") {
    const parts = body.split(",").map((p) => p.trim());
    const name = parts.shift() ?? "";
    const hidden = parts.some((p) => FLAG_HIDDEN.test(p));
    const ally = parts.some((p) => FLAG_ALLY.test(p));
    const nums = parts.filter((p) => !FLAG_HIDDEN.test(p) && !FLAG_ALLY.test(p));
    return finish(name, c, nums, hidden, ally);
  }
  if (Array.isArray(body)) {
    const [first, ...rest] = body;
    const name = Array.isArray(first) ? String(first[0] ?? "") : String(first ?? "");
    const flags = rest.map((r) => String(r));
    return finish(
      name,
      c,
      rest.filter((r) => !FLAG_HIDDEN.test(String(r)) && !FLAG_ALLY.test(String(r))),
      flags.some((f) => FLAG_HIDDEN.test(f)),
      flags.some((f) => FLAG_ALLY.test(f)),
    );
  }
  return null;
}

function finish(name: string, count: number, nums: unknown[], hidden: boolean, ally: boolean): CreatureSpec | null {
  const clean = name.trim();
  if (!clean || count < 1) return null;
  const [hp, ac, mod] = nums.map(num);
  const spec: CreatureSpec = { name: clean, count };
  if (hp !== undefined) spec.hp = hp;
  if (ac !== undefined) spec.ac = ac;
  if (mod !== undefined) spec.mod = mod;
  if (hidden) spec.hidden = true;
  if (ally) spec.ally = true;
  return spec;
}

/** Same creature with the same overrides listed twice adds up ("- 2: Goblin" + "- Goblin" = 3). */
export function mergeCreatures(specs: CreatureSpec[]): CreatureSpec[] {
  const out: CreatureSpec[] = [];
  for (const s of specs) {
    const same = out.find(
      (o) => o.name === s.name && o.hp === s.hp && o.ac === s.ac && o.mod === s.mod && !!o.hidden === !!s.hidden && !!o.ally === !!s.ally,
    );
    if (same) same.count += s.count;
    else out.push({ ...s });
  }
  return out;
}

/** A parsed `encounter` block (already YAML-decoded). */
export function parseEncounterBlock(data: unknown): { name?: string; party?: string; creatures: CreatureSpec[] } {
  const d = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const list = Array.isArray(d.creatures) ? d.creatures : d.creatures ? [d.creatures] : [];
  const creatures = mergeCreatures(list.map(parseCreature).filter((c): c is CreatureSpec => c !== null));
  const name = typeof d.name === "string" && d.name.trim() ? d.name.trim() : undefined;
  const party = typeof d.party === "string" && d.party.trim() ? d.party.trim() : undefined;
  return { name, party, creatures };
}

/** "Goblin ×12, Hobgoblin Regular ×4, Iron Chaplain" */
export function summarize(creatures: CreatureSpec[]): string {
  return creatures.map((c) => (c.count > 1 ? `${c.name} ×${c.count}` : c.name)).join(", ");
}

// ------------------------------------------------------------ Initiative Tracker import

export interface InitiativeTrackerData {
  players?: { name?: string; player?: boolean; note?: string; path?: string }[];
  parties?: { name?: string; players?: string[] }[];
  encounters?: Record<string, { name?: string; creatures?: { name?: string; player?: boolean; display?: string }[] }>;
}

export interface Player {
  name: string;
  /** Note for the character, if Initiative Tracker knew it. */
  note?: string;
}

export interface ImportResult {
  players: Player[];
  parties: { name: string; members: string[] }[];
  encounters: StagedEncounter[];
}

export function importInitiativeTracker(it: InitiativeTrackerData, now = Date.now()): ImportResult {
  const players: Player[] = (it.players ?? [])
    .filter((p) => p.name && p.player !== false)
    .map((p) => ({ name: p.name!, ...(p.path || p.note ? { note: p.path ?? p.note } : {}) }));
  const parties = (it.parties ?? [])
    .filter((p) => p.name)
    .map((p) => ({ name: p.name!, members: [...new Set((p.players ?? []).filter(Boolean))] }));
  const encounters: StagedEncounter[] = Object.entries(it.encounters ?? {}).map(([key, e]) => {
    const monsters = (e.creatures ?? []).filter((c) => c.name && !c.player).map((c) => ({ name: c.name!, count: 1 }));
    return {
      id: `it:${key}`,
      name: e.name || key,
      from: "Initiative Tracker",
      creatures: mergeCreatures(monsters),
      addedAt: now,
    };
  });
  return { players, parties, encounters: encounters.filter((e) => e.creatures.length) };
}
