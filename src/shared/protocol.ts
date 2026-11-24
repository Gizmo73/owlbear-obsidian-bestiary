// Messages between the Owlbear extension ("Obsidian Bestiary") and the
// Obsidian plugin ("Owlbear Bestiary Bridge"), sent as JSON over a WebSocket
// on 127.0.0.1. Bump PROTOCOL_VERSION on any incompatible change.

import type { BestiaryEntry } from "./bestiary";

export const PROTOCOL_VERSION = 1;
export const DEFAULT_PORT = 27190;

/** Origins allowed to open the WebSocket (where the extension is hosted). */
export const EXTENSION_ORIGINS = ["https://gizmo73.github.io"];

// ------------------------------------------------------------ requests (extension -> plugin)

export type Request =
  | { kind: "hello"; protocol: number; player: string }
  | { kind: "getBestiary" }
  | { kind: "showCreature"; name: string };

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

export type ResponseFor<R extends Request> = R extends { kind: "hello" }
  ? Welcome
  : R extends { kind: "getBestiary" }
    ? BestiaryPayload
    : R extends { kind: "showCreature" }
      ? ShowResult
      : never;

export type ResponseEnvelope =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string };

// ------------------------------------------------------------ pushes (plugin -> extension, unprompted)

export type Push = { push: "bestiaryChanged"; version: string; creatureCount: number };
