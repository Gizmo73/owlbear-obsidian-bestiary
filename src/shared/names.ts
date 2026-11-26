// Matching Owlbear token names against bestiary names.

/** Loose key: "Kuo Toa" == "Kuo-Toa" == "kuo-toa" -> "kuotoa". */
export function matchKey(name: string): string {
  return name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** "Goblin 2", "Goblin A", "Goblin A1", "Goblin #3", "Goblin (3)" -> "Goblin". */
export function stripTokenSuffix(name: string): string {
  return name.trim().replace(/\s+(?:#?\d+|\(\d+\)|[A-Z]\d*)$/, "").trim();
}

/** Names to try for a token, most specific first: label, then item name, each with and without suffix. */
export function nameCandidates(token: { name?: string; label?: string }): string[] {
  const out: string[] = [];
  for (const raw of [token.label, token.name]) {
    const s = (raw ?? "").trim();
    if (!s) continue;
    out.push(s);
    const stripped = stripTokenSuffix(s);
    if (stripped && stripped !== s) out.push(stripped);
  }
  return [...new Set(out)];
}
