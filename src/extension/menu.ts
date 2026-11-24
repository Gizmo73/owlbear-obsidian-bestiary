// Right-click menu embed ("Statblock & HP"), GM only.
// - Unlinked tokens: search the bestiary and link every selected token at once.
// - Linked tokens: type damage / healing for every selected token; change or unlink.

import OBR, { isImage, type Item } from "@owlbear-rodeo/sdk";
import type { BestiaryEntry } from "../shared/bestiary";
import { applyHp, describeHpOp, hpBand, parseHpInput } from "../shared/hp";
import { stripTokenSuffix } from "../shared/names";
import { BestiarySearch } from "../shared/search";
import {
  TOKEN_KEY,
  creatureFromEntry,
  loadIndex,
  openChannel,
  readCreature,
  type CachedIndex,
  type ChannelMessage,
} from "./common";
import { followTheme } from "./theme";

const root = document.getElementById("app")!;
let ids: string[] = [];
let items: Item[] = [];
let search: BestiarySearch | null = null;
let mode: "assign" | "hp" = "assign";
let message = "";

// ------------------------------------------------------------ bestiary index

let indexWaiters: ((i: CachedIndex | null) => void)[] = [];
const channel = openChannel((msg: ChannelMessage) => {
  if (msg.type === "index") {
    indexWaiters.forEach((w) => w(msg.index));
    indexWaiters = [];
  } else if (msg.type === "index-updated") {
    const fresh = loadIndex();
    if (fresh) {
      search = new BestiarySearch(fresh.creatures);
      if (mode === "assign") renderResults();
    }
  }
});

async function getIndex(): Promise<CachedIndex | null> {
  const local = loadIndex();
  if (local) return local;
  // Storage unavailable: ask the background page for its copy.
  return new Promise((resolve) => {
    indexWaiters.push(resolve);
    channel.post({ type: "get-index" });
    setTimeout(() => resolve(null), 1500);
  });
}

// ------------------------------------------------------------ helpers

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function tokenLabel(item: Item) {
  const text = isImage(item) ? (item.text?.plainText ?? "") : "";
  return text || item.name || "token";
}

async function refreshItems() {
  items = ids.length ? await OBR.scene.items.getItems(ids) : [];
}

const linked = () => items.map((i) => readCreature(i.metadata)).filter((c) => c !== null);

// ------------------------------------------------------------ assign mode

let results: BestiaryEntry[] = [];
let highlighted = 0;

function renderAssign(prefill: string) {
  const count = items.length;
  root.innerHTML = `
    <div class="assign">
      <input id="q" type="search" placeholder="Search bestiary…" autocomplete="off" spellcheck="false" value="${esc(prefill)}">
      <ul id="results" role="listbox"></ul>
      <div class="hint">${
        search
          ? `Enter links ${count === 1 ? "this token" : `all ${count} tokens`}`
          : "No bestiary yet: open Obsidian with Owlbear Bestiary Bridge enabled"
      }</div>
    </div>`;
  const input = document.getElementById("q") as HTMLInputElement;
  input.addEventListener("input", () => {
    highlighted = 0;
    renderResults();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      highlighted = Math.min(highlighted + 1, results.length - 1);
      renderResults();
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      highlighted = Math.max(highlighted - 1, 0);
      renderResults();
      e.preventDefault();
    } else if (e.key === "Enter" && results[highlighted]) {
      void assign(results[highlighted]);
    }
  });
  renderResults();
  input.focus();
  input.select();
}

function renderResults() {
  const list = document.getElementById("results");
  const input = document.getElementById("q") as HTMLInputElement | null;
  if (!list || !input) return;
  results = search ? search.search(input.value, 20) : [];
  list.innerHTML = results.length
    ? results
        .map(
          (r, i) => `
      <li role="option" data-i="${i}" class="${i === highlighted ? "on" : ""}">
        <span class="name">${esc(r.name)}</span>
        <span class="meta">${[r.cr ? `CR ${esc(r.cr)}` : "", r.hp !== null ? `HP ${r.hp}` : "", r.ac !== null ? `AC ${r.ac}` : ""]
          .filter(Boolean)
          .join(" · ")}</span>
      </li>`,
        )
        .join("")
    : search
      ? `<li class="empty">No match</li>`
      : "";
  list.querySelectorAll<HTMLLIElement>("li[data-i]").forEach((li) =>
    li.addEventListener("click", () => void assign(results[Number(li.dataset.i)])),
  );
  list.querySelector("li.on")?.scrollIntoView({ block: "nearest" });
}

async function assign(entry: BestiaryEntry) {
  const creature = creatureFromEntry(entry);
  await OBR.scene.items.updateItems(ids, (drafts) => {
    for (const d of drafts) d.metadata[TOKEN_KEY] = { ...creature };
  });
  channel.post({ type: "show", name: entry.name });
  message = `Linked ${items.length === 1 ? "" : `${items.length} tokens `}to ${entry.name}`;
  await refreshItems();
  mode = "hp";
  render();
}

// ------------------------------------------------------------ HP mode

function renderHp() {
  const creatures = linked();
  const rows = items
    .map((item) => ({ item, c: readCreature(item.metadata) }))
    .filter((r) => r.c)
    .slice(0, 4)
    .map(
      ({ item, c }) => `
      <div class="row ${hpBand(c!)}">
        <span class="name">${esc(items.length === 1 ? c!.name : tokenLabel(item))}</span>
        <span class="hpv">${c!.hp}/${c!.maxHp}</span>
      </div>`,
    )
    .join("");
  const more = items.length > 4 ? `<div class="more">+${items.length - 4} more</div>` : "";
  const single = creatures.length === 1 ? creatures[0] : null;
  root.innerHTML = `
    <div class="hp">
      ${single ? `<div class="sub">${esc(single.name)}${single.ac !== null ? ` · AC ${single.ac}` : ""}</div>` : `<div class="sub">${items.length} tokens</div>`}
      <div class="rows">${rows}${more}</div>
      <input id="hp" type="text" inputmode="numeric" placeholder="7 dmg · +5 heal · =20 set" autocomplete="off">
      <div class="msg" id="msg">${esc(message)}</div>
      <div class="actions">
        <button id="change" type="button">Change</button>
        <button id="unlink" type="button">Unlink</button>
      </div>
    </div>`;
  const input = document.getElementById("hp") as HTMLInputElement;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void applyInput(input.value);
  });
  document.getElementById("change")!.addEventListener("click", () => {
    mode = "assign";
    message = "";
    render();
  });
  document.getElementById("unlink")!.addEventListener("click", () => void unlink());
  input.focus();
}

async function applyInput(value: string) {
  const op = parseHpInput(value);
  if (!op) {
    message = "Try 7, +5, =20 or max 30";
    render();
    return;
  }
  await OBR.scene.items.updateItems(ids, (drafts) => {
    for (const d of drafts) {
      const c = readCreature(d.metadata);
      if (c) d.metadata[TOKEN_KEY] = { ...c, ...applyHp(c, op) };
    }
  });
  message = describeHpOp(op);
  await refreshItems();
  render();
}

async function unlink() {
  await OBR.scene.items.updateItems(ids, (drafts) => {
    for (const d of drafts) delete d.metadata[TOKEN_KEY];
  });
  await refreshItems();
  message = "";
  mode = "assign";
  render();
}

// ------------------------------------------------------------ boot

function render() {
  if (mode === "hp" && linked().length) renderHp();
  else {
    mode = "assign";
    const first = items[0];
    const current = linked()[0]?.name;
    renderAssign(current ?? (first ? stripTokenSuffix(tokenLabel(first)) : ""));
  }
}

OBR.onReady(async () => {
  void followTheme();
  ids = (await OBR.player.getSelection()) ?? [];
  await refreshItems();
  const index = await getIndex();
  search = index ? new BestiarySearch(index.creatures) : null;
  mode = items.length && linked().length === items.length ? "hp" : "assign";
  render();
});
