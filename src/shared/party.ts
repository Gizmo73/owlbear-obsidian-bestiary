// Inserting a party's tokens: matching picked images to PCs, and laying them out.

import { matchKey } from "./names";

export interface Pick {
  name: string;
  label?: string;
}

/**
 * Match picked images to party members by name. Exact (loose) matches first, then a name
 * that starts with the other ("Berald Barclay" <-> "Berald"); each member and image is used
 * once, and ambiguous prefixes are left unmatched rather than guessed.
 */
export function matchPicks(picks: Pick[], members: string[]): { matched: Map<string, number>; unmatched: number[] } {
  const matched = new Map<string, number>();
  const used = new Set<number>();
  const keysOf = (p: Pick) => [p.name, p.label ?? ""].map(matchKey).filter(Boolean);

  for (const member of members) {
    const key = matchKey(member);
    const i = picks.findIndex((p, idx) => !used.has(idx) && keysOf(p).includes(key));
    if (i !== -1) {
      matched.set(member, i);
      used.add(i);
    }
  }
  for (const member of members) {
    if (matched.has(member)) continue;
    const key = matchKey(member);
    const candidates = picks
      .map((p, idx) => ({ idx, keys: keysOf(p) }))
      .filter(({ idx, keys }) => !used.has(idx) && keys.some((k) => k.startsWith(key) || key.startsWith(k)));
    if (candidates.length === 1) {
      matched.set(member, candidates[0].idx);
      used.add(candidates[0].idx);
    }
  }
  const unmatched = picks.map((_, i) => i).filter((i) => !used.has(i));
  return { matched, unmatched };
}

/** Centres of `count` slots in a row around `center`, `spacing` apart. */
export function rowPositions(center: { x: number; y: number }, count: number, spacing: number) {
  return Array.from({ length: count }, (_, i) => ({ x: center.x + (i - (count - 1) / 2) * spacing, y: center.y }));
}
