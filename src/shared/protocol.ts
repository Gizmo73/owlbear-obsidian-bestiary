// Messages between the Owlbear extension ("Obsidian Bestiary") and the
// Obsidian plugin ("Owlbear Bestiary Bridge"), sent as JSON over a WebSocket
// on 127.0.0.1. Bump PROTOCOL_VERSION on any incompatible change.

import type { BestiaryEntry } from "./bestiary";
import type { StagedEncounter } from "./encounter";

export const PROTOCOL_VERSION = 4;
/** Oldest plugin protocol the extension still works with (parties need 2, saved party tokens 3, encounters 4). */
export const MIN_PROTOCOL_VERSION = 1;
export const DEFAULT_PORT = 27190;

/** Origins allowed to open the WebSocket (where the extension is hosted). */
export const EXTENSION_ORIGINS = ["https://gizmo73.github.io"];

// ------------------------------------------------------------ requests (extension -> plugin)

export type Request =
  | { kind: "hello"; protocol: number; player: string }
  | { kind: "getBestiary" }
  | { kind: "showCreature"; name: string }
  | { kind: "getParties" }
  | { kind: "saveParty"; name: string; members: string[] }
  | { kind: "deleteParty"; name: string }
  /** Remember (or with null, forget) which Owlbear image is each PC's token. */
  | { kind: "saveTokenArt"; art: Record<string, TokenArt | null> }
  | { kind: "getEncounters" }
  | { kind: "removeEncounter"; encounterId: string }
  /** Remember (or with null, forget) which Owlbear image is each creature's token. */
  | { kind: "saveCreatureArt"; art: Record<string, TokenArt | null> };

/** `id` matches the reply to the request, so request fields must never be called `id`. */
export type RequestEnvelope = { id: number } & Request;

// ------------------------------------------------------------ responses (plugin -> extension)

export interface Welcome {
  protocol: number;
  vault: string;
  bestiaryVersion: string;
  creatureCount: number;
  statblocksPlugin: boolean;
}

export interface BestiaryPayload {
  version: string;
  vault: string;
  creatures: BestiaryEntry[];
}

export interface ShowResult {
  shown: string | null;
}

export interface Party {
  name: string;
  members: string[];
  /** Parties from Initiative Tracker are read-only; the bridge's own can be edited. */
  source: "initiative-tracker" | "bridge";
}

/**
 * An image from the GM's Owlbear library, as the asset picker returns it: enough to place
 * the token again later. Stored by the plugin in the vault, keyed by PC name.
 */
export interface TokenArt {
  name: string;
  image: { url: string; mime: string; width: number; height: number };
  grid: { dpi: number; offset: { x: number; y: number } };
  scale: { x: number; y: number };
  rotation: number;
  text?: unknown;
  textItemType?: string;
  description?: string;
}

export interface PartiesPayload {
  parties: Party[];
  /** Every PC name known (Initiative Tracker players + party members), for linking PC tokens. */
  pcs: string[];
  /** Saved token images by PC name (protocol 3+). */
  art?: Record<string, TokenArt>;
}

export interface EncountersPayload {
  /** Encounters sent from Obsidian (or imported), newest first. */
  encounters: StagedEncounter[];
  /** Saved token images by creature name. */
  art: Record<string, TokenArt>;
}

export type ResponseFor<R extends Request> = R extends { kind: "hello" }
  ? Welcome
  : R extends { kind: "getBestiary" }
    ? BestiaryPayload
    : R extends { kind: "showCreature" }
      ? ShowResult
      : R extends { kind: "getParties" | "saveParty" | "deleteParty" | "saveTokenArt" }
        ? PartiesPayload
        : R extends { kind: "getEncounters" | "removeEncounter" | "saveCreatureArt" }
          ? EncountersPayload
          : never;

export type ResponseEnvelope =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string };

// ------------------------------------------------------------ pushes (plugin -> extension, unprompted)

export type Push =
  | { push: "bestiaryChanged"; version: string; creatureCount: number }
  | { push: "partiesChanged" }
  | { push: "encountersChanged" }
  /** "Add to Owlbear" from a statblock: put one hidden, linked token of this creature on the map. */
  | { push: "addCreature"; name: string };
