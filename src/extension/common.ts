// Shared bits for the extension's pages (background, context-menu embed, popover).

import type { Item } from "@owlbear-rodeo/sdk";
import type { BestiaryEntry } from "../shared/bestiary";
import { DEFAULT_PORT, type EncountersPayload, type PartiesPayload, type TokenArt } from "../shared/protocol";
import { EMPTY_COMBAT, type CombatState, type MonsterToken, type PcToken, type PublicOrder } from "../shared/turns";

export const EXT_ID = "com.gizmo73.obsidian-bestiary";
/** Token metadata: the linked creature and its HP. */
export const TOKEN_KEY = `${EXT_ID}/creature`;
/** Local (GM-only) label items carry this metadata. */
export const LABEL_KEY = `${EXT_ID}/hp-label`;
export const MENU_ID = `${EXT_ID}/menu`;
/** Token metadata: the token is this PC (initiative only, no HP). */
export const PC_KEY = `${EXT_ID}/pc`;
/** Scene metadata: turn-order state, written by the GM's panel. */
export const COMBAT_KEY = `${EXT_ID}/combat`;
/** Scene metadata: the order players see (names only), written by the GM's background page. */
export const ORDER_KEY = `${EXT_ID}/order`;
/** Local (GM-only) ring around whoever's turn it is. */
export const RING_KEY = `${EXT_ID}/turn-ring`;

/** Absolute URL of a file next to the current page (the SDK resolves relative paths against the site root). */
export const asset = (file: string) => new URL(file, location.href).href;

export interface TokenCreature {
  name: string;
  hp: number;
  maxHp: number;
  ac: number | null;
  init: number;
  /** Per-creature number in the scene ("Goblin 2"). */
  n?: number;
}

export function readCreature(metadata: Record<string, unknown>): TokenCreature | null {
  const c = metadata[TOKEN_KEY] as TokenCreature | undefined;
  return c && typeof c.name === "string" ? c : null;
}

export function readPc(metadata: Record<string, unknown>): string | null {
  const pc = metadata[PC_KEY] as { name?: string } | undefined;
  return pc && typeof pc.name === "string" ? pc.name : null;
}

export function readCombat(metadata: Record<string, unknown>): CombatState {
  const c = metadata[COMBAT_KEY] as Partial<CombatState> | undefined;
  return { ...EMPTY_COMBAT, ...(c ?? {}) };
}

export function readOrder(metadata: Record<string, unknown>): PublicOrder | null {
  return (metadata[ORDER_KEY] as PublicOrder | undefined) ?? null;
}

/** Linked monster tokens and PC tokens in the scene, in the shape the turn logic wants. */
export function combatTokens(items: Item[]): { monsters: MonsterToken[]; pcs: PcToken[] } {
  const monsters: MonsterToken[] = [];
  const pcs: PcToken[] = [];
  for (const item of items) {
    const c = readCreature(item.metadata);
    if (c) {
      monsters.push({ id: item.id, creature: c.name, n: c.n, mod: c.init, hp: c.hp, maxHp: c.maxHp, visible: item.visible });
      continue;
    }
    const pc = readPc(item.metadata);
    if (pc) pcs.push({ id: item.id, pc, visible: item.visible });
  }
  return { monsters, pcs };
}

/** Numbers already used by tokens of `creature` (skipping `except`). */
export function usedNumbers(items: Item[], creature: string, except: Set<string> = new Set()): number[] {
  const out: number[] = [];
  for (const item of items) {
    if (except.has(item.id)) continue;
    const c = readCreature(item.metadata);
    if (c && c.name === creature && c.n) out.push(c.n);
  }
  return out;
}

export function creatureFromEntry(entry: BestiaryEntry): TokenCreature {
  const max = entry.hp ?? 1;
  return { name: entry.name, hp: max, maxHp: max, ac: entry.ac, init: entry.init };
}

// ------------------------------------------------------------ local storage (per browser, per extension origin)

export interface CachedIndex {
  version: string;
  vault: string;
  savedAt: number;
  creatures: BestiaryEntry[];
}

const INDEX_KEY = "obsidian-bestiary:index";
const PORT_KEY = "obsidian-bestiary:port";
const PARTIES_KEY = "obsidian-bestiary:parties";
const ENCOUNTERS_KEY = "obsidian-bestiary:encounters";

export function loadEncounters(): EncountersPayload | null {
  try {
    const raw = localStorage.getItem(ENCOUNTERS_KEY);
    return raw ? (JSON.parse(raw) as EncountersPayload) : null;
  } catch {
    return null;
  }
}

export function saveEncounters(payload: EncountersPayload) {
  try {
    localStorage.setItem(ENCOUNTERS_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}
const LAST_PARTY_KEY = "obsidian-bestiary:last-party";

export function loadParties(): PartiesPayload | null {
  try {
    const raw = localStorage.getItem(PARTIES_KEY);
    return raw ? (JSON.parse(raw) as PartiesPayload) : null;
  } catch {
    return null;
  }
}

export function saveParties(parties: PartiesPayload) {
  try {
    localStorage.setItem(PARTIES_KEY, JSON.stringify(parties));
  } catch {
    /* ignore */
  }
}

export function getLastParty(): string | null {
  try {
    return localStorage.getItem(LAST_PARTY_KEY);
  } catch {
    return null;
  }
}

export function setLastParty(name: string | null) {
  try {
    if (name) localStorage.setItem(LAST_PARTY_KEY, name);
    else localStorage.removeItem(LAST_PARTY_KEY);
  } catch {
    /* ignore */
  }
}

export function loadIndex(): CachedIndex | null {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as CachedIndex) : null;
  } catch {
    return null;
  }
}

export function saveIndex(index: CachedIndex) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    /* storage unavailable: the background keeps it in memory */
  }
}

export function getPort(): number {
  try {
    const p = Number(localStorage.getItem(PORT_KEY));
    return Number.isInteger(p) && p > 0 ? p : DEFAULT_PORT;
  } catch {
    return DEFAULT_PORT;
  }
}

export function setPort(port: number) {
  try {
    localStorage.setItem(PORT_KEY, String(port));
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------ page <-> background messages

export interface BridgeStatus {
  state: "connected" | "connecting" | "offline" | "player";
  port: number;
  /** Plugin protocol version once connected (parties need 2). */
  protocol?: number;
  vault?: string;
  creatures?: number;
  syncedAt?: number;
  error?: string;
}

export type ChannelMessage =
  | { type: "status"; status: BridgeStatus }
  | { type: "index-updated"; version: string }
  | { type: "get-status" }
  | { type: "reconnect" }
  | { type: "refresh-bestiary" }
  | { type: "show"; name: string }
  | { type: "get-index" }
  | { type: "index"; index: CachedIndex | null }
  | { type: "get-parties" }
  | { type: "parties"; parties: PartiesPayload | null; error?: string }
  | { type: "save-party"; name: string; members: string[] }
  | { type: "delete-party"; name: string }
  | { type: "save-art"; art: Record<string, TokenArt | null> }
  | { type: "get-encounters" }
  | { type: "encounters"; payload: EncountersPayload | null; error?: string }
  | { type: "remove-encounter"; id: string }
  | { type: "save-creature-art"; art: Record<string, TokenArt | null> };

/** Same-origin channel between this extension's iframes in this browser tab. */
export function openChannel(onMessage: (msg: ChannelMessage) => void) {
  const channel = new BroadcastChannel("obsidian-bestiary");
  channel.onmessage = (e) => onMessage(e.data as ChannelMessage);
  return {
    post: (msg: ChannelMessage) => channel.postMessage(msg),
    close: () => channel.close(),
  };
}
