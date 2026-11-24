// Spike: Owlbear Rodeo side of the connection test.
// Tries every route to the Obsidian plugin and shows the result of each,
// then forwards token selections so Obsidian can open the Creature pane.

import OBR, { isImage, type Item } from "@owlbear-rodeo/sdk";
import {
  BRIDGE_PORT,
  MSG_KEY,
  OWLBEAR_ORIGINS,
  stripTokenSuffix,
  type BridgeMessage,
  type Route,
} from "../../shared";

type Status = "pending" | "ok" | "fail" | "idle";

const variant =
  location.origin === "https://gizmo73.github.io" ? "GitHub Pages copy" : "Obsidian-served copy";

const rows: Record<string, { status: Status; detail: string }> = {
  sdk: { status: "pending", detail: "waiting for Owlbear…" },
  http: { status: "pending", detail: "trying…" },
  websocket: { status: "pending", detail: "trying…" },
  inject: { status: "pending", detail: "waiting for Obsidian to reach in…" },
  link: { status: "idle", detail: "press the button below, then check the Creature pane" },
  creature: { status: "idle", detail: "select a token named after a creature" },
};

const labels: Record<string, string> = {
  sdk: "Owlbear SDK",
  http: "A1 · HTTP to Obsidian",
  websocket: "A2 · WebSocket to Obsidian",
  inject: "B · Obsidian web viewer injection",
  link: "C · obsidian:// link",
  creature: "Creature pane",
};

const log: string[] = [];

function addLog(line: string) {
  const stamp = new Date().toLocaleTimeString();
  log.unshift(`${stamp}  ${line}`);
  log.length = Math.min(log.length, 40);
  render();
}

function set(key: string, status: Status, detail: string) {
  rows[key] = { status, detail };
  render();
}

function render() {
  const icon = (s: Status) => ({ pending: "…", ok: "✔", fail: "✖", idle: "–" })[s];
  const table = document.getElementById("rows");
  if (table) {
    table.innerHTML = Object.keys(rows)
      .map(
        (k) =>
          `<div class="row ${rows[k].status}"><span class="icon">${icon(rows[k].status)}</span>` +
          `<span class="label">${labels[k]}</span><span class="detail">${escapeHtml(rows[k].detail)}</span></div>`,
      )
      .join("");
  }
  const logEl = document.getElementById("log");
  if (logEl) logEl.textContent = log.join("\n");
  const summary = document.getElementById("summary") as HTMLTextAreaElement | null;
  if (summary) summary.value = summaryText();
}

function summaryText() {
  const lines = [
    `Variant: ${variant} (${location.origin})`,
    `User agent: ${navigator.userAgent}`,
    ...Object.keys(rows).map((k) => `${labels[k]}: ${rows[k].status.toUpperCase()} - ${rows[k].detail}`),
  ];
  return lines.join("\n");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

// ---------------------------------------------------------------- outgoing

let ws: WebSocket | null = null;
let injectLive = false;
let role = "unknown";
let lastCreatureGuess = "Goblin";
let playerName = "unknown";

type Outgoing = BridgeMessage extends infer M ? (M extends BridgeMessage ? Omit<M, "route"> : never) : never;

function send(msg: Outgoing) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ ...msg, route: "websocket" }));
  }
  // Route B: Obsidian's injected helper in Owlbear's page relays these.
  postUp({ [MSG_KEY]: true, ...msg, route: "inject" });
}

/** Route B: post to Owlbear's top frame, where Obsidian's helper listens. */
function postUp(data: unknown) {
  window.parent.postMessage(data, "*");
  if (window.top && window.top !== window.parent) window.top.postMessage(data, "*");
}

// ---------------------------------------------------------------- incoming

function handle(msg: BridgeMessage) {
  switch (msg.type) {
    case "welcome": {
      const detail = `connected to vault "${msg.vaultName}"; Fantasy Statblocks ${
        msg.statblocks ? `found (${msg.creatures} creatures)` : "NOT found"
      }`;
      if (msg.route === "inject") {
        injectLive = true;
        set("inject", "ok", detail);
      } else {
        set("websocket", "ok", detail);
      }
      addLog(`welcome via ${msg.route}`);
      break;
    }
    case "pong": {
      const ms = Date.now() - msg.t;
      addLog(`round trip via ${msg.route}: ${ms} ms`);
      break;
    }
    case "shown": {
      if (msg.creature) {
        // Use Obsidian's exact name for the route C link test too.
        lastCreatureGuess = msg.creature;
        set("creature", "ok", `showing "${msg.creature}" (via ${msg.route})`);
      }
      else set("creature", "fail", `no bestiary match for: ${msg.tried.join(", ") || "(nothing)"}`);
      break;
    }
    default:
      break;
  }
}

// Route B listener: messages posted into this iframe by Owlbear's page.
window.addEventListener("message", (event) => {
  if (event.source !== window.parent && event.source !== window.top) return;
  if (!OWLBEAR_ORIGINS.includes(event.origin)) return;
  const data = event.data as Record<string, unknown> | null;
  if (!data || typeof data !== "object" || !data[MSG_KEY]) return;
  handle(data as unknown as BridgeMessage);
});

// ---------------------------------------------------------------- route A1: plain HTTP

async function tryHttp() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  const started = Date.now();
  try {
    const res = await fetch(`http://127.0.0.1:${BRIDGE_PORT}/ping`, {
      cache: "no-store",
      signal: ctrl.signal,
    });
    const body = await res.json();
    set("http", "ok", `HTTP ${res.status} in ${Date.now() - started} ms, plugin ${body.plugin}`);
  } catch (err) {
    set("http", "fail", `${(err as Error).name}: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------- route A2: WebSocket

let wsAttempts = 0;
function connectWs() {
  wsAttempts++;
  let opened = false;
  try {
    ws = new WebSocket(`ws://127.0.0.1:${BRIDGE_PORT}/ws`);
  } catch (err) {
    set("websocket", "fail", `could not create socket: ${(err as Error).message}`);
    setTimeout(connectWs, 5000);
    return;
  }
  ws.onopen = () => {
    opened = true;
    addLog("websocket open");
    send({ type: "hello", variant, role, player: playerName });
  };
  ws.onmessage = (e) => {
    try {
      handle(JSON.parse(String(e.data)));
    } catch {
      /* ignore */
    }
  };
  ws.onclose = (e) => {
    if (!opened) {
      set(
        "websocket",
        "fail",
        `could not connect (attempt ${wsAttempts}, close code ${e.code}); retrying every 5 s`,
      );
    } else {
      set("websocket", "fail", `connection closed (code ${e.code}); retrying`);
    }
    ws = null;
    setTimeout(connectWs, 5000);
  };
}

// ---------------------------------------------------------------- Owlbear side

function tokenInfo(item: Item) {
  const label = isImage(item) ? item.text?.plainText ?? "" : "";
  return { name: item.name ?? "", label };
}

async function startOwlbear() {
  if (!OBR.isAvailable) {
    set("sdk", "fail", "not running inside Owlbear Rodeo");
    return;
  }
  OBR.onReady(async () => {
    role = await OBR.player.getRole();
    playerName = await OBR.player.getName();
    set("sdk", "ok", `ready; you are ${role} "${playerName}"`);
    send({ type: "hello", variant, role, player: playerName });

    let lastKey = "";
    const onSelection = async (ids: string[] | undefined) => {
      const key = (ids ?? []).join(",");
      if (key === lastKey) return;
      lastKey = key;
      if (!ids || ids.length === 0) return;
      const items = await OBR.scene.items.getItems(ids);
      const tokens = items.map(tokenInfo);
      addLog(`selected: ${tokens.map((t) => t.label || t.name).join(", ")}`);
      lastCreatureGuess = stripTokenSuffix(tokens[0].label || tokens[0].name || lastCreatureGuess);
      send({ type: "selection", tokens });
    };
    OBR.player.onChange((player) => void onSelection(player.selection));
    void onSelection(await OBR.player.getSelection());
  });
}

// ---------------------------------------------------------------- boot

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("variant")!.textContent = `${variant} · ${location.origin}`;
  document.getElementById("retry")!.addEventListener("click", () => {
    set("http", "pending", "trying…");
    void tryHttp();
    send({ type: "hello", variant, role, player: playerName });
  });
  document.getElementById("link")!.addEventListener("click", () => {
    const url = `obsidian://creature-pane?creature=${encodeURIComponent(lastCreatureGuess)}`;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    set("link", "pending", `opened ${url} - did the Creature pane show ${lastCreatureGuess}? (tell Claude)`);
  });
  render();
  void tryHttp();
  connectWs();
  void startOwlbear();
  // Keep announcing ourselves on route B until Obsidian answers.
  const helloTimer = setInterval(() => {
    if (injectLive) clearInterval(helloTimer);
    else postUp({ [MSG_KEY]: true, type: "hello", route: "inject", variant, role, player: playerName });
  }, 2000);
  setInterval(() => send({ type: "ping", t: Date.now() }), 10000);
  setTimeout(() => {
    if (!injectLive) set("inject", "fail", "no answer from Obsidian after 20 s (still listening)");
  }, 20000);
});
