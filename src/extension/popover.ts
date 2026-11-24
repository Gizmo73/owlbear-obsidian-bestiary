// Toolbar panel: connection status, bestiary sync, port.

import OBR from "@owlbear-rodeo/sdk";
import { getPort, openChannel, setPort, type BridgeStatus, type ChannelMessage } from "./common";
import { followTheme } from "./theme";

const root = document.getElementById("app")!;
let status: BridgeStatus | null = null;

const channel = openChannel((msg: ChannelMessage) => {
  if (msg.type === "status") {
    status = msg.status;
    render();
  }
});

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function describe(s: BridgeStatus | null): { cls: string; title: string; detail: string } {
  if (!s) return { cls: "pending", title: "Starting…", detail: "" };
  switch (s.state) {
    case "player":
      return { cls: "idle", title: "GM only", detail: "This extension only does things for the GM." };
    case "connected":
      return {
        cls: s.error ? "warn" : "ok",
        title: `Connected to “${esc(s.vault ?? "")}”`,
        detail: s.error
          ? esc(s.error)
          : `${s.creatures ?? 0} creatures${s.syncedAt ? ` · synced ${new Date(s.syncedAt).toLocaleTimeString()}` : ""}`,
      };
    case "connecting":
      return { cls: "pending", title: "Connecting to Obsidian…", detail: "" };
    default:
      return {
        cls: "fail",
        title: "Not connected to Obsidian",
        detail: `${esc(s.error ?? "")}. Is Obsidian open with Owlbear Bestiary Bridge enabled?${
          s.creatures ? ` Using the saved bestiary (${s.creatures} creatures).` : ""
        }`,
      };
  }
}

function render() {
  const d = describe(status);
  root.innerHTML = `
    <h1>Obsidian Bestiary</h1>
    <div class="status ${d.cls}"><span class="dot"></span><div><div class="title">${d.title}</div><div class="detail">${d.detail}</div></div></div>
    ${
      status?.state === "player"
        ? ""
        : `<div class="buttons">
      <button id="reconnect" type="button">Reconnect</button>
      <button id="refresh" type="button" ${status?.state === "connected" ? "" : "disabled"}>Refresh bestiary</button>
    </div>
    <p class="help">Right-click a token → <b>Statblock &amp; HP</b> to link it to a creature. Selecting a linked token opens it in Obsidian's Creature pane.</p>
    <details>
      <summary>Connection settings</summary>
      <label>Port <input id="port" type="number" min="1024" max="65535" value="${getPort()}"></label>
      <button id="save-port" type="button">Save</button>
      <p class="help">Must match the port in the Owlbear Bestiary Bridge plugin settings.</p>
    </details>`
    }`;
  document.getElementById("reconnect")?.addEventListener("click", () => channel.post({ type: "reconnect" }));
  document.getElementById("refresh")?.addEventListener("click", () => channel.post({ type: "refresh-bestiary" }));
  document.getElementById("save-port")?.addEventListener("click", () => {
    const port = Number((document.getElementById("port") as HTMLInputElement).value);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) return;
    setPort(port);
    channel.post({ type: "reconnect" });
  });
}

render();
OBR.onReady(() => {
  void followTheme();
  channel.post({ type: "get-status" });
});
