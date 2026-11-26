// Background page: runs for everyone in the room, but only does work for the GM.
// - keeps the connection to Obsidian, the cached bestiary index and parties
// - registers the right-click menu
// - draws GM-only HP labels and the turn ring
// - publishes the player-visible turn order (names only)
// - sends selected tokens to Obsidian's Creature pane

import OBR, { isImage, type Item } from "@owlbear-rodeo/sdk";
import { BestiarySearch } from "../shared/search";
import { nameCandidates } from "../shared/names";
import type { PartiesPayload } from "../shared/protocol";
import { buildEntries, publicOrder } from "../shared/turns";
import { BridgeClient } from "./bridge";
import { startLabels } from "./labels";
import { showRings } from "./rings";
import {
  MENU_ID,
  ORDER_KEY,
  asset,
  combatTokens,
  getPort,
  loadIndex,
  loadParties,
  openChannel,
  readCombat,
  readCreature,
  readOrder,
  readPc,
  saveIndex,
  saveParties,
  type BridgeStatus,
  type CachedIndex,
  type ChannelMessage,
} from "./common";

let status: BridgeStatus = { state: "connecting", port: getPort() };
let index: CachedIndex | null = loadIndex();
let search = index ? new BestiarySearch(index.creatures) : null;
let parties: PartiesPayload | null = loadParties();
let bridge: BridgeClient | null = null;
let playerName = "";
let gmStarted = false;

const channel = openChannel(onChannel);

function setStatus(next: Partial<BridgeStatus>) {
  status = { ...status, ...next, port: getPort() };
  channel.post({ type: "status", status });
}

function onChannel(msg: ChannelMessage) {
  switch (msg.type) {
    case "get-status":
      channel.post({ type: "status", status });
      break;
    case "get-index":
      channel.post({ type: "index", index });
      break;
    case "reconnect":
      bridge?.reconnect();
      break;
    case "refresh-bestiary":
      void fetchBestiary();
      break;
    case "show":
      void showInObsidian(msg.name);
      break;
    case "get-parties":
      channel.post({ type: "parties", parties });
      void fetchParties();
      break;
    case "save-party":
      void partyRequest({ kind: "saveParty", name: msg.name, members: msg.members });
      break;
    case "delete-party":
      void partyRequest({ kind: "deleteParty", name: msg.name });
      break;
    default:
      break;
  }
}

// ------------------------------------------------------------ Obsidian requests

async function fetchBestiary() {
  if (!bridge?.connected) return;
  try {
    const payload = await bridge.request({ kind: "getBestiary" }, 30000);
    index = { version: payload.version, vault: payload.vault, savedAt: Date.now(), creatures: payload.creatures };
    search = new BestiarySearch(index.creatures);
    saveIndex(index);
    channel.post({ type: "index-updated", version: index.version });
    setStatus({ creatures: index.creatures.length, syncedAt: index.savedAt });
  } catch (err) {
    setStatus({ error: `could not load bestiary: ${(err as Error).message}` });
  }
}

const partiesSupported = () => !!bridge?.connected && (status.protocol ?? 1) >= 2;

async function fetchParties() {
  if (!partiesSupported()) return;
  try {
    parties = await bridge!.request({ kind: "getParties" });
    saveParties(parties);
    channel.post({ type: "parties", parties });
  } catch {
    /* keep the cached list */
  }
}

async function partyRequest(req: { kind: "saveParty"; name: string; members: string[] } | { kind: "deleteParty"; name: string }) {
  if (!partiesSupported()) {
    channel.post({
      type: "parties",
      parties,
      error: bridge?.connected ? "Update Owlbear Bestiary Bridge in Obsidian to save parties" : "Connect to Obsidian to save parties",
    });
    return;
  }
  try {
    parties = await bridge!.request(req);
    saveParties(parties);
    channel.post({ type: "parties", parties });
  } catch (err) {
    channel.post({ type: "parties", parties, error: (err as Error).message });
  }
}

async function showInObsidian(name: string) {
  if (!bridge?.connected) return;
  try {
    await bridge.request({ kind: "showCreature", name });
  } catch {
    /* Obsidian busy or gone; nothing useful to tell the GM mid-click */
  }
}

// ------------------------------------------------------------ selection -> Creature pane

let lastSelection = "";

async function onSelection(ids: string[] | undefined) {
  const key = (ids ?? []).join(",");
  if (key === lastSelection) return;
  lastSelection = key;
  if (!ids?.length) return;
  const items = await OBR.scene.items.getItems(ids);
  const name = creatureNameFor(items);
  if (name) await showInObsidian(name);
}

/** Linked token wins; otherwise a single unlinked character token whose name matches a creature. */
function creatureNameFor(items: Item[]): string | null {
  for (const item of items) {
    const c = readCreature(item.metadata);
    if (c) return c.name;
  }
  const only = items.length === 1 ? items[0] : null;
  if (!only || only.layer !== "CHARACTER" || !search || readPc(only.metadata)) return null;
  const label = isImage(only) ? (only.text?.plainText ?? "") : "";
  for (const candidate of nameCandidates({ name: only.name, label })) {
    const hit = search.find(candidate);
    if (hit) return hit.name;
  }
  return null;
}

// ------------------------------------------------------------ turn order: public list + ring

let combatQueued = false;

function queueCombatUpdate() {
  if (combatQueued) return;
  combatQueued = true;
  setTimeout(() => {
    combatQueued = false;
    void updateCombat().catch((err) => console.warn("[obsidian-bestiary] turn order update failed", err));
  }, 80);
}

async function updateCombat() {
  if (!(await OBR.scene.isReady())) return;
  const metadata = await OBR.scene.getMetadata();
  const state = readCombat(metadata);
  const { monsters, pcs } = combatTokens(await OBR.scene.items.getItems());
  const entries = buildEntries(monsters, pcs, state);

  const order = publicOrder(entries, state);
  if (JSON.stringify(order) !== JSON.stringify(readOrder(metadata))) {
    await OBR.scene.setMetadata({ [ORDER_KEY]: order });
  }

  const active = state.round > 0 ? entries.find((e) => e.id === state.turn) : undefined;
  await showRings(active ? active.tokens.map((t) => t.id) : []);
}

// ------------------------------------------------------------ startup

async function createMenu() {
  await OBR.contextMenu.create({
    id: MENU_ID,
    icons: [
      {
        icon: asset("icon.svg"),
        label: "Statblock & HP",
        filter: { roles: ["GM"], every: [{ key: "layer", value: "CHARACTER" }] },
      },
    ],
    embed: { url: asset("menu.html"), height: 230 },
  });
}

function startGm() {
  if (gmStarted) return;
  gmStarted = true;
  bridge = new BridgeClient(getPort, () => playerName, {
    onConnecting: () => setStatus({ state: "connecting", error: undefined }),
    onConnected: (welcome) => {
      setStatus({
        state: "connected",
        protocol: welcome.protocol,
        vault: welcome.vault,
        creatures: index?.creatures.length ?? welcome.creatureCount,
        syncedAt: index?.savedAt,
        error: welcome.statblocksPlugin ? undefined : "Fantasy Statblocks isn't enabled in Obsidian",
      });
      if (!index || index.version !== welcome.bestiaryVersion || index.vault !== welcome.vault) void fetchBestiary();
      void fetchParties();
    },
    onDisconnected: (error) => setStatus({ state: "offline", error }),
    onPush: (push) => {
      if (push.push === "bestiaryChanged" && push.version !== index?.version) void fetchBestiary();
      if (push.push === "partiesChanged") void fetchParties();
    },
  });
  bridge.start();
  startLabels();
  OBR.player.onChange((player) => void onSelection(player.selection));
  void OBR.player.getSelection().then(onSelection);
  OBR.scene.items.onChange(queueCombatUpdate);
  OBR.scene.onMetadataChange(queueCombatUpdate);
  OBR.scene.onReadyChange((ready) => ready && queueCombatUpdate());
  queueCombatUpdate();
}

OBR.onReady(async () => {
  playerName = await OBR.player.getName();
  await createMenu();
  if ((await OBR.player.getRole()) === "GM") startGm();
  else setStatus({ state: "player" });
  // A player promoted to GM mid-session picks it up without a reload.
  OBR.player.onChange((player) => {
    if (player.role === "GM") startGm();
  });
});
