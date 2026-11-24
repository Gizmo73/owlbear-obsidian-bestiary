// Constants shared by the spike Owlbear extension and the spike Obsidian plugin.

/** Port the Obsidian plugin listens on (127.0.0.1 only). */
export const BRIDGE_PORT = 27190;

/** Where the GitHub Pages copy of the test extension lives. */
export const PAGES_BASE = "https://gizmo73.github.io/owlbear-obsidian-bestiary/spike/";

/** Where the Obsidian plugin serves its own copy of the test extension. */
export const LOCAL_BASE = `http://127.0.0.1:${BRIDGE_PORT}/ext/`;

/** Origins allowed to talk to the bridge (the two copies of the extension). */
export const EXTENSION_ORIGINS = [
  "https://gizmo73.github.io",
  `http://127.0.0.1:${BRIDGE_PORT}`,
  `http://localhost:${BRIDGE_PORT}`,
];

/** Origins Owlbear Rodeo itself is served from. */
export const OWLBEAR_ORIGINS = ["https://www.owlbear.rodeo", "https://owlbear.rodeo"];

/** Marker key on every postMessage that belongs to the bridge. */
export const MSG_KEY = "__obsidianBridge";

export type Route = "websocket" | "inject";

export type BridgeMessage =
  | { type: "hello"; route: Route; variant: string; role?: string; player?: string }
  | { type: "welcome"; route: Route; vaultName: string; statblocks: boolean; creatures: number }
  | { type: "selection"; route: Route; tokens: { name: string; label: string }[] }
  | { type: "shown"; route: Route; creature: string | null; tried: string[] }
  | { type: "ping"; route: Route; t: number }
  | { type: "pong"; route: Route; t: number };

/** "Goblin 2", "Goblin A", "Goblin A1", "Goblin #3", "Goblin (3)" -> "Goblin". */
export function stripTokenSuffix(name: string): string {
  return name.trim().replace(/\s+(?:#?\d+|\(\d+\)|[A-Z]\d*)$/, "").trim();
}

/** Names to try against the bestiary for a token, most specific first. */
export function nameCandidates(token: { name: string; label: string }): string[] {
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

/** Loose key for matching token names to bestiary names: "Kuo Toa" == "Kuo-Toa" == "kuo-toa". */
export function matchKey(name: string): string {
  return name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
}
