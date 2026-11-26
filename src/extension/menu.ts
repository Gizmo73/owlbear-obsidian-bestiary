// Right-click menu embed ("Statblock & HP"), GM only.
// - Unlinked tokens: search the bestiary (and party PCs) and link every selected token at once.
// - Linked tokens: type damage / healing for every selected monster; change or unlink.

import OBR, { isImage, type Item } from "@owlbear-rodeo/sdk";
import type { BestiaryEntry } from "../shared/bestiary";
import { applyHp, describeHpOp, hpBand, parseHpInput } from "../shared/hp";
import { matchKey, stripTokenSuffix } from "../shared/names";
import { BestiarySearch } from "../shared/search";
import {
  PC_KEY,
  TOKEN_KEY,
  creatureFromEntry,
  loadIndex,
  loadParties,
  openChannel,
  readCreature,
  readPc,
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
let pcs: string[] = loadParties()?.pcs ?? [];

type Result = { kind: "creature"; entry: BestiaryEntry } | { kind: "pc"; name: string };

// ------------------------------------------------------------ bestiary index

let indexWaiters: ((i: CachedIndex | null) => void)[] = [];
const channel = openChannel((msg: ChannelMessage) => {
  if (msg.type === "index") {
    indexWaiters.forEach((w) => w(msg.index));
    indexWaiters = [];
  } else if (msg.type === "parties" && msg.parties) {
    pcs = msg.parties.pcs;
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
const linkedPcs = () => items.map((i) => readPc(i.metadata)).filter((p) => p !== null);
const allLinked = () => items.length > 0 && items.every((i) => readCreature(i.metadata) || readPc(i.metadata));

/** PCs whose name starts with (or has a word starting with) the query; only when there is a query. */
function pcMatches(query: string): string[] {
  const q = matchKey(query);
  if (!q) return [];
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return pcs
    .filter((name) => {
      const key = matchKey(name);
      const nameWords = name.toLowerCase().split(/[^a-z0-9]+/);
      return key.startsWith(q) || words.every((w) => nameWords.some((nw) => nw.startsWith(w)));
    })
    .slice(0, 5);
}

// ------------------------------------------------------------ assign mode

let results: Result[] = [];
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
  results = [
    ...pcMatches(input.value).map((name): Result => ({ kind: "pc", name })),
    ...(search ? search.search(input.value, 20) : []).map((entry): Result => ({ kind: "creature", entry })),
  ];
  const meta = (r: Result) =>
    r.kind === "pc"
      ? "PC · initiative only"
      : [r.entry.cr ? `CR ${esc(r.entry.cr)}` : "", r.entry.hp !== null ? `HP ${r.entry.hp}` : "", r.entry.ac !== null ? `AC ${r.entry.ac}` : ""]
          .filter(Boolean)
          .join(" · ");
  list.innerHTML = results.length
    ? results
        .map(
          (r, i) => `
      <li role="option" data-i="${i}" class="${i === highlighted ? "on" : ""} ${r.kind}">
        <span class="name">${esc(r.kind === "pc" ? r.name : r.entry.name)}</span>
        <span class="meta">${meta(r)}</span>
      </li>`,
        )
        .join("")
    : search || pcs.length
      ? `<li class="empty">No match</li>`
      : "";
  list.querySelectorAll<HTMLLIElement>("li[data-i]").forEach((li) =>
    li.addEventListener("click", () => void assign(results[Number(li.dataset.i)])),
  );
  list.querySelector("li.on")?.scrollIntoView({ block: "nearest" });
}

async function assign(result: Result) {
  if (result.kind === "pc") {
    await OBR.scene.items.updateItems(ids, (drafts) => {
      for (const d of drafts) {
        delete d.metadata[TOKEN_KEY];
        d.metadata[PC_KEY] = { name: result.name };
      }
    });
    message = `Linked to ${result.name} (PC)`;
  } else {
    const creature = creatureFromEntry(result.entry);
    await OBR.scene.items.updateItems(ids, (drafts) => {
      for (const d of drafts) {
        delete d.metadata[PC_KEY];
        d.metadata[TOKEN_KEY] = { ...creature };
      }
    });
    channel.post({ type: "show", name: result.entry.name });
    message = `Linked ${items.length === 1 ? "" : `${items.length} tokens `}to ${result.entry.name}`;
  }
  await refreshItems();
  mode = "hp";
  render();
}

// ------------------------------------------------------------ HP mode

function renderHp() {
  const creatures = linked();
  const rows = items
    .map((item) => ({ item, c: readCreature(item.metadata), pc: readPc(item.metadata) }))
    .filter((r) => r.c || r.pc)
    .slice(0, 4)
    .map(({ item, c, pc }) =>
      c
        ? `
      <div class="row ${hpBand(c)}">
        <span class="name">${esc(items.length === 1 ? c.name : tokenLabel(item))}</span>
        <span class="hpv">${c.hp}/${c.maxHp}</span>
      </div>`
        : `
      <div class="row">
        <span class="name">${esc(pc!)}</span>
        <span class="tag">PC</span>
      </div>`,
    )
    .join("");
  const more = items.length > 4 ? `<div class="more">+${items.length - 4} more</div>` : "";
  const single = creatures.length === 1 && items.length === 1 ? creatures[0] : null;
  const pcOnly = creatures.length === 0;
  root.innerHTML = `
    <div class="hp">
      ${
        single
          ? `<div class="sub">${esc(single.name)}${single.ac !== null ? ` · AC ${single.ac}` : ""}</div>`
          : `<div class="sub">${pcOnly && items.length === 1 ? "Player character" : `${items.length} tokens`}</div>`
      }
      <div class="rows">${rows}${more}</div>
      ${pcOnly ? "" : `<input id="hp" type="text" inputmode="numeric" placeholder="7 dmg · +5 heal · =20 set" autocomplete="off">`}
      <div class="msg" id="msg">${esc(message)}</div>
      <div class="actions">
        <button id="change" type="button">Change</button>
        <button id="unlink" type="button">Unlink</button>
      </div>
    </div>`;
  const input = document.getElementById("hp") as HTMLInputElement | null;
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void applyInput(input.value);
  });
  document.getElementById("change")!.addEventListener("click", () => {
    mode = "assign";
    message = "";
    render();
  });
  document.getElementById("unlink")!.addEventListener("click", () => void unlink());
  input?.focus();
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
    for (const d of drafts) {
      delete d.metadata[TOKEN_KEY];
      delete d.metadata[PC_KEY];
    }
  });
  await refreshItems();
  message = "";
  mode = "assign";
  render();
}

// ------------------------------------------------------------ boot

function render() {
  if (mode === "hp" && (linked().length || linkedPcs().length)) renderHp();
  else {
    mode = "assign";
    const first = items[0];
    const current = linked()[0]?.name ?? linkedPcs()[0];
    renderAssign(current ?? (first ? stripTokenSuffix(tokenLabel(first)) : ""));
  }
}

OBR.onReady(async () => {
  void followTheme();
  ids = (await OBR.player.getSelection()) ?? [];
  await refreshItems();
  if (!pcs.length) channel.post({ type: "get-parties" });
  const index = await getIndex();
  search = index ? new BestiarySearch(index.creatures) : null;
  mode = allLinked() ? "hp" : "assign";
  render();
});
