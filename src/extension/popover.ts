// Toolbar panel.
// GM: turn order (party, rolls, Start / Next / Previous, hold, click to select, HP) + connection details.
// Players: the turn order only (names and whose turn it is, never HP).

import OBR, { type Item } from "@owlbear-rodeo/sdk";
import type { Party, PartiesPayload } from "../shared/protocol";
import { applyHp, hpBand, parseHpInput } from "../shared/hp";
import {
  EMPTY_COMBAT,
  buildEntries,
  displayName,
  rollD20,
  rollMissing as rollMissingInit,
  step,
  type CombatState,
  type Entry,
  type PublicOrder,
} from "../shared/turns";
import {
  COMBAT_KEY,
  TOKEN_KEY,
  combatTokens,
  getLastParty,
  getPort,
  loadParties,
  openChannel,
  readCombat,
  readCreature,
  readOrder,
  setLastParty,
  setPort,
  type BridgeStatus,
  type ChannelMessage,
} from "./common";
import { followTheme } from "./theme";

const root = document.getElementById("app")!;
let role: "GM" | "PLAYER" = "PLAYER";
let status: BridgeStatus | null = null;
let parties: PartiesPayload | null = loadParties();
let partyError = "";
let state: CombatState = { ...EMPTY_COMBAT };
let items: Item[] = [];
let order: PublicOrder | null = null;
let formOpen: { editing: string | null } | null = null;
let confirmEnd = false;
let lastPartyApplied = false;
/** Entry whose HP box is open. */
let editingHp: string | null = null;
let hpError = "";

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const ICON = {
  eye: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.2M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M2 2l20 20"/></svg>`,
  dice: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M21 7l-9 5-9-5"/></svg>`,
};

// ------------------------------------------------------------ background messages

const channel = openChannel((msg: ChannelMessage) => {
  if (msg.type === "status") {
    status = msg.status;
    render();
  } else if (msg.type === "parties") {
    parties = msg.parties;
    partyError = msg.error ?? "";
    if (!msg.error && formOpen) formOpen = null;
    void syncPartyMembers();
    render();
  }
});

// ------------------------------------------------------------ state

const entries = (): Entry[] => {
  const { monsters, pcs } = combatTokens(items);
  return buildEntries(monsters, pcs, state);
};

async function save(next: Partial<CombatState>) {
  state = { ...state, ...next };
  await OBR.scene.setMetadata({ [COMBAT_KEY]: state });
  render();
}

const findParty = (name: string | null): Party | undefined => parties?.parties.find((p) => p.name === name);

/** Keep the scene's member list in step with an edited party; apply the remembered party once. */
async function syncPartyMembers() {
  if (role !== "GM") return;
  if (state.party) {
    const party = findParty(state.party);
    if (party && JSON.stringify(party.members) !== JSON.stringify(state.members)) await save({ members: party.members });
    return;
  }
  const last = getLastParty();
  if (!lastPartyApplied && last && findParty(last)) {
    lastPartyApplied = true;
    await choose(last);
  }
}

async function choose(partyName: string) {
  const party = findParty(partyName);
  setLastParty(party ? party.name : null);
  await save({ party: party?.name ?? null, members: party?.members ?? [] });
}

async function selectTokens(entry: Entry | undefined) {
  const ids = entry?.tokens.map((t) => t.id) ?? [];
  if (ids.length) await OBR.player.select(ids, true);
}

async function move(dir: 1 | -1) {
  const list = entries();
  const next = step(list, state, dir);
  await save(next);
  await selectTokens(list.find((e) => e.id === next.turn));
}

async function rollMissing() {
  await save({ init: rollMissingInit(entries(), state.init, rollD20) });
}

/** 0.2.0 kept one roll / hold per creature ("m:goblin"); move them onto each token. */
async function migrateGroupKeys() {
  if (role !== "GM") return;
  const legacy = (id: string) => id.startsWith("m:");
  if (!Object.keys(state.init).some(legacy) && !state.held.some(legacy)) return;
  const init: Record<string, number> = {};
  for (const [id, value] of Object.entries(state.init)) if (!legacy(id)) init[id] = value;
  const held = state.held.filter((id) => !legacy(id));
  for (const e of entries()) {
    if (e.kind !== "monster") continue;
    if (e.init !== null) init[e.id] = e.init;
    if (e.held && !held.includes(e.id)) held.push(e.id);
  }
  const turn = state.turn && legacy(state.turn) ? (entries().find((e) => e.group === state.turn)?.id ?? null) : state.turn;
  await save({ init, held, turn });
}

async function applyHpTo(entry: Entry, value: string) {
  const op = parseHpInput(value);
  if (!op) {
    hpError = "Try 7, +5, =20 or max 30";
    return false;
  }
  const ids = entry.tokens.map((t) => t.id);
  await OBR.scene.items.updateItems(ids, (drafts) => {
    for (const d of drafts) {
      const c = readCreature(d.metadata);
      if (c) d.metadata[TOKEN_KEY] = { ...c, ...applyHp(c, op) };
    }
  });
  hpError = "";
  return true;
}

// ------------------------------------------------------------ rendering

let renderQueued = false;

function render() {
  // Don't rebuild the list under the GM's fingers while they type a number.
  const active = document.activeElement as HTMLElement | null;
  if (active && root.contains(active) && active.tagName === "INPUT") {
    renderQueued = true;
    return;
  }
  renderQueued = false;
  root.innerHTML = role === "GM" ? gmHtml() : playerHtml();
  if (role === "GM") wireGm();
}

document.addEventListener("focusout", () => setTimeout(() => renderQueued && render(), 0));

function playerHtml(): string {
  const list = order?.entries ?? [];
  return `
    <header><h1>Initiative</h1>${order && order.round > 0 ? `<span class="round">Round ${order.round}</span>` : ""}</header>
    ${
      list.length
        ? `<ol class="public">${list.map((e) => `<li class="${e.active ? "active" : ""}">${esc(e.name)}</li>`).join("")}</ol>`
        : `<p class="help">No turn order yet.</p>`
    }`;
}

function connDot(): string {
  const s = status;
  const cls = !s ? "pending" : s.state === "connected" ? (s.error ? "warn" : "ok") : s.state === "offline" ? "fail" : "pending";
  const title =
    s?.state === "connected"
      ? `Connected to ${s.vault} · ${s.creatures ?? 0} creatures`
      : s?.state === "offline"
        ? `Not connected to Obsidian: ${s.error ?? ""}`
        : "Connecting to Obsidian…";
  return `<span class="conn ${cls}" title="${esc(title)}"></span>`;
}

function partyOptions(): string {
  const list = parties?.parties ?? [];
  const group = (label: string, src: Party["source"]) => {
    const opts = list.filter((p) => p.source === src);
    return opts.length
      ? `<optgroup label="${label}">${opts
          .map((p) => `<option value="${esc(p.name)}" ${p.name === state.party ? "selected" : ""}>${esc(p.name)}</option>`)
          .join("")}</optgroup>`
      : "";
  };
  return `<option value="" ${state.party ? "" : "selected"}>No party</option>${group("Initiative Tracker", "initiative-tracker")}${group("Made in Owlbear", "bridge")}`;
}

function rowHtml(e: Entry): string {
  const cls = [e.kind, e.id === state.turn && state.round > 0 ? "active" : "", e.held ? "held" : "", e.down ? "down" : ""]
    .filter(Boolean)
    .join(" ");
  const t = e.tokens[0];
  const hps =
    e.kind !== "monster"
      ? `<span class="tag">PC${e.tokens.length ? "" : " · no token"}</span>`
      : editingHp === e.id
        ? `<input class="hp-input" type="text" inputmode="numeric" placeholder="7 · +5 · =20" aria-label="Damage or heal ${esc(e.name)}">`
        : `<button class="chip ${hpBand({ hp: t.hp ?? 0, maxHp: t.maxHp ?? 1 })}" type="button" title="Damage or heal">${t.hp}/${t.maxHp}</button>`;
  return `
    <li class="${cls}" data-id="${esc(e.id)}">
      <input class="init" type="number" inputmode="numeric" value="${e.init ?? ""}" placeholder="–" aria-label="Initiative for ${esc(e.name)}">
      <button class="name" type="button" title="Select on the map">${esc(displayName(e))}</button>
      ${hps}
      ${e.kind === "monster" ? `<button class="icon reroll" type="button" title="Roll d20 ${e.mod >= 0 ? "+" : ""}${e.mod}">${ICON.dice}</button>` : `<span class="icon-spacer"></span>`}
      <button class="icon hold" type="button" title="${e.held ? "Not in combat yet: click to join" : "In combat: click to hold back"}">${e.held ? ICON.eyeOff : ICON.eye}</button>
    </li>`;
}

function gmHtml(): string {
  const list = entries();
  const started = state.round > 0;
  const party = findParty(state.party);
  const s = status;
  return `
    <header><h1>Turn order</h1>${connDot()}${started ? `<span class="round">Round ${state.round}</span>` : ""}</header>
    <div class="bar">
      <select id="party" aria-label="Party">${partyOptions()}</select>
      <button id="new-party" type="button" title="New party">New</button>
      ${party?.source === "bridge" ? `<button id="edit-party" type="button" title="Edit party">Edit</button>` : ""}
    </div>
    ${formOpen ? partyFormHtml() : ""}
    <div class="bar">
      <button id="roll" type="button" title="Roll for monsters without a number">Roll</button>
      ${started ? `<button id="prev" type="button" title="Previous turn">◀</button>` : ""}
      <button id="next" class="primary" type="button">${started ? "Next ▶" : "Start"}</button>
      ${started || Object.keys(state.init).length ? `<button id="end" type="button">${confirmEnd ? "End combat?" : "End"}</button>` : ""}
    </div>
    ${hpError ? `<div class="error">${esc(hpError)}</div>` : ""}
    ${
      list.length
        ? `<ol class="order">${list.map(rowHtml).join("")}</ol>`
        : `<p class="help">Link tokens (right-click → <b>Statblock &amp; HP</b>) or pick a party to build the order.</p>`
    }
    <details class="conn-details">
      <summary>Connection</summary>
      <p class="help">${
        s?.state === "connected"
          ? `Connected to “${esc(s.vault ?? "")}” · ${s.creatures ?? 0} creatures${s.syncedAt ? ` · synced ${new Date(s.syncedAt).toLocaleTimeString()}` : ""}${s.error ? `<br>${esc(s.error)}` : ""}${(s.protocol ?? 1) < 2 ? "<br>Update Owlbear Bestiary Bridge in Obsidian to use parties." : ""}`
          : s?.state === "offline"
            ? `Not connected: ${esc(s.error ?? "")}. Is Obsidian open with Owlbear Bestiary Bridge enabled?`
            : "Connecting…"
      }</p>
      <div class="bar">
        <button id="reconnect" type="button">Reconnect</button>
        <button id="refresh" type="button" ${s?.state === "connected" ? "" : "disabled"}>Refresh bestiary</button>
      </div>
      <label>Port <input id="port" type="number" min="1024" max="65535" value="${getPort()}"></label>
      <button id="save-port" type="button">Save port</button>
    </details>`;
}

function partyFormHtml(): string {
  const editing = formOpen?.editing ? findParty(formOpen.editing) : undefined;
  const members = new Set(editing?.members ?? []);
  const known = [...new Set([...(parties?.pcs ?? []), ...members])].sort((a, b) => a.localeCompare(b));
  return `
    <form id="party-form" class="party-form">
      <input id="party-name" type="text" placeholder="Party name" value="${esc(editing?.name ?? "")}" ${editing ? "readonly" : ""}>
      <div class="members">${
        known.length
          ? known
              .map(
                (n) =>
                  `<label class="member"><input type="checkbox" value="${esc(n)}" ${members.has(n) ? "checked" : ""}> ${esc(n)}</label>`,
              )
              .join("")
          : `<span class="help">No PCs known yet: add names below.</span>`
      }</div>
      <input id="party-extra" type="text" placeholder="More names, comma separated">
      ${partyError ? `<div class="error">${esc(partyError)}</div>` : ""}
      <div class="bar">
        <button type="submit" class="primary">Save</button>
        <button id="party-cancel" type="button">Cancel</button>
        ${editing ? `<button id="party-delete" type="button">Delete</button>` : ""}
      </div>
    </form>`;
}

// ------------------------------------------------------------ events

function wireGm() {
  const on = (id: string, fn: () => void) => document.getElementById(id)?.addEventListener("click", fn);

  document.getElementById("party")?.addEventListener("change", (e) => void choose((e.target as HTMLSelectElement).value));
  on("new-party", () => {
    formOpen = { editing: null };
    partyError = "";
    render();
  });
  on("edit-party", () => {
    formOpen = { editing: state.party };
    partyError = "";
    render();
  });
  on("party-cancel", () => {
    formOpen = null;
    render();
  });
  on("party-delete", () => {
    if (formOpen?.editing) channel.post({ type: "delete-party", name: formOpen.editing });
    void choose("");
  });
  document.getElementById("party-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (document.getElementById("party-name") as HTMLInputElement).value.trim();
    const checked = [...document.querySelectorAll<HTMLInputElement>(".member input:checked")].map((i) => i.value);
    const extra = (document.getElementById("party-extra") as HTMLInputElement).value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name) {
      partyError = "Give the party a name";
      render();
      return;
    }
    channel.post({ type: "save-party", name, members: [...checked, ...extra] });
    setLastParty(name);
    lastPartyApplied = false;
    void save({ party: name, members: [...new Set([...checked, ...extra])] });
  });

  on("roll", () => void rollMissing());
  on("next", () => void move(1));
  on("prev", () => void move(-1));
  on("end", () => {
    if (!confirmEnd) {
      confirmEnd = true;
      render();
      setTimeout(() => {
        confirmEnd = false;
        render();
      }, 4000);
      return;
    }
    confirmEnd = false;
    void save({ round: 0, turn: null, init: {}, held: [] });
  });

  const list = entries();
  root.querySelectorAll<HTMLLIElement>("ol.order li").forEach((li) => {
    const entry = list.find((e) => e.id === li.dataset.id);
    if (!entry) return;
    const input = li.querySelector<HTMLInputElement>("input.init")!;
    const commit = () => {
      const init = { ...state.init };
      const value = input.value.trim();
      if (value === "") delete init[entry.id];
      else if (Number.isFinite(Number(value))) init[entry.id] = Math.trunc(Number(value));
      else return;
      if (init[entry.id] !== state.init[entry.id]) void save({ init });
    };
    input.addEventListener("change", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
    });
    li.querySelector(".name")?.addEventListener("click", () => void selectTokens(entry));
    li.querySelector(".reroll")?.addEventListener("click", () => void save({ init: { ...state.init, [entry.id]: rollD20() + entry.mod } }));
    li.querySelector(".hold")?.addEventListener("click", () => {
      const held = entry.held ? state.held.filter((id) => id !== entry.id && id !== entry.group) : [...state.held, entry.id];
      void save({ held });
    });
    li.querySelector(".chip")?.addEventListener("click", () => {
      editingHp = entry.id;
      hpError = "";
      render();
      root.querySelector<HTMLInputElement>(`li[data-id="${CSS.escape(entry.id)}"] .hp-input`)?.focus();
    });
    const hpInput = li.querySelector<HTMLInputElement>(".hp-input");
    if (hpInput) {
      const close = () => {
        editingHp = null;
        hpInput.blur();
        render();
      };
      hpInput.addEventListener("keydown", async (e) => {
        if (e.key === "Escape") close();
        if (e.key !== "Enter") return;
        if (await applyHpTo(entry, hpInput.value)) close();
        else {
          hpInput.select();
          root.querySelector(".error")?.remove();
          root.querySelector("ol.order")?.insertAdjacentHTML("beforebegin", `<div class="error">${esc(hpError)}</div>`);
        }
      });
      hpInput.addEventListener("blur", () => {
        if (editingHp === entry.id) {
          editingHp = null;
          setTimeout(render, 0);
        }
      });
    }
  });

  on("reconnect", () => channel.post({ type: "reconnect" }));
  on("refresh", () => channel.post({ type: "refresh-bestiary" }));
  on("save-port", () => {
    const port = Number((document.getElementById("port") as HTMLInputElement).value);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) return;
    setPort(port);
    channel.post({ type: "reconnect" });
  });
}

// ------------------------------------------------------------ boot

render();
OBR.onReady(async () => {
  void followTheme();
  role = await OBR.player.getRole();
  // Installed copies may keep the manifest's old size; set it explicitly.
  void OBR.action.setWidth(360).catch(() => undefined);
  void OBR.action.setHeight(role === "GM" ? 560 : 320).catch(() => undefined);
  const load = async () => {
    const metadata = await OBR.scene.getMetadata();
    state = readCombat(metadata);
    order = readOrder(metadata);
    if (role === "GM") items = await OBR.scene.items.getItems();
    render();
  };
  OBR.scene.onMetadataChange((metadata) => {
    state = readCombat(metadata);
    order = readOrder(metadata);
    render();
  });
  OBR.scene.onReadyChange((ready) => ready && void load());
  if (role === "GM") {
    OBR.scene.items.onChange((next) => {
      items = next;
      render();
    });
    channel.post({ type: "get-status" });
    channel.post({ type: "get-parties" });
  }
  OBR.player.onChange((p) => {
    if (p.role !== role) {
      role = p.role;
      void load();
    }
  });
  if (await OBR.scene.isReady()) await load();
  await migrateGroupKeys();
  await syncPartyMembers();
});
