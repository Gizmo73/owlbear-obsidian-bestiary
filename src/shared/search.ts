// Ranking bestiary entries for the "Assign statblock" search box.

import type { BestiaryEntry } from "./bestiary";
import { matchKey } from "./names";

interface Indexed {
  entry: BestiaryEntry;
  key: string;
  words: string[];
}

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

export class BestiarySearch {
  private readonly items: Indexed[];

  constructor(entries: BestiaryEntry[]) {
    this.items = entries
      .map((entry) => ({ entry, key: matchKey(entry.name), words: words(entry.name) }))
      .sort((a, b) => a.entry.name.localeCompare(b.entry.name));
  }

  get size() {
    return this.items.length;
  }

  /** Exact match on the loose key ("Kuo Toa" finds "Kuo-Toa"). */
  find(name: string): BestiaryEntry | null {
    const key = matchKey(name);
    return this.items.find((i) => i.key === key)?.entry ?? null;
  }

  search(query: string, limit = 8): BestiaryEntry[] {
    const q = matchKey(query);
    if (!q) return this.items.slice(0, limit).map((i) => i.entry);
    const qWords = words(query);
    const scored: { item: Indexed; score: number }[] = [];
    for (const item of this.items) {
      let score: number;
      if (item.key === q) score = 0;
      else if (item.key.startsWith(q)) score = 1;
      else if (qWords.length && qWords.every((w) => item.words.some((nw) => nw.startsWith(w)))) score = 2;
      else if (item.key.includes(q)) score = 3;
      else if (isSubsequence(q, item.key)) score = 4;
      else continue;
      scored.push({ item, score });
    }
    scored.sort(
      (a, b) =>
        a.score - b.score ||
        a.item.entry.name.length - b.item.entry.name.length ||
        a.item.entry.name.localeCompare(b.item.entry.name),
    );
    return scored.slice(0, limit).map((s) => s.item.entry);
  }
}

function isSubsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) if (hay[j] === needle[i]) i++;
  return i === needle.length;
}
