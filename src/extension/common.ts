// Shared bits for the extension's pages (background, context-menu embed, popover).

import type { BestiaryEntry } from "../shared/bestiary";
import { DEFAULT_PORT } from "../shared/protocol";

export const EXT_ID = "com.gizmo73.obsidian-bestiary";
/** Token metadata: the linked creature and its HP. */
export const TOKEN_KEY = `${EXT_ID}/creature`;
/** Local (GM-only) label items carry this metadata. */
export const LABEL_KEY = `${EXT_ID}/hp-label`;
export const MENU_ID = `${EXT_ID}/menu`;

/** Absolute URL of a file next to the current page (the SDK resolves relative paths against the site root). */
export const asset = (file: string) => new URL(file, location.href).href;

export interface TokenCreature {
  name: string;
  hp: number;
  maxHp: number;
  ac: number | null;
  init: number;
}

export function readCreature(metadata: Record<string, unknown>): TokenCreature | null {
  const c = metadata[TOKEN_KEY] as TokenCreature | undefined;
  return c && typeof c.name === "string" ? c : null;
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
  | { type: "index"; index: CachedIndex | null };

/** Same-origin channel between this extension's iframes in this browser tab. */
export function openChannel(onMessage: (msg: ChannelMessage) => void) {
  const channel = new BroadcastChannel("obsidian-bestiary");
  channel.onmessage = (e) => onMessage(e.data as ChannelMessage);
  return {
    post: (msg: ChannelMessage) => channel.postMessage(msg),
    close: () => channel.close(),
  };
}
