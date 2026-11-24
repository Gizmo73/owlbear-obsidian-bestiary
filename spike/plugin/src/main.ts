// Spike: Obsidian side of the Owlbear connection test.
// Route A: local HTTP/WebSocket server on 127.0.0.1.
// Route B: reach into the web viewer running Owlbear and relay postMessages.
// Either route can ask us to show a creature in Fantasy Statblocks' Creature pane.

import { App, Modal, Notice, Plugin } from "obsidian";
import { BRIDGE_PORT, EXTENSION_ORIGINS, MSG_KEY, matchKey, nameCandidates } from "../../shared";
import { startBridgeServer, type BridgeServer } from "./server";
import { WebviewRelay, type RelayStatus, type WebviewLike } from "./relay";
import { EXTENSION_FILES } from "./embedded.gen";

declare global {
  interface Window {
    FantasyStatblocks?: {
      getBestiaryNames(): string[];
      getBestiary?(): Map<string, unknown>;
      getCreature?(name: string): Promise<unknown>;
    };
  }
}

interface StatblocksPlugin {
  creature_view?: { render(creature: unknown): Promise<void> };
  openCreatureView?: () => Promise<{ render(creature: unknown): Promise<void> }>;
}

type Token = { name: string; label: string };

export default class OwlbearBridgeSpike extends Plugin {
  private server: BridgeServer | null = null;
  private relay: WebviewRelay | null = null;
  private statusEl!: HTMLElement;
  readonly log: string[] = [];
  private state = {
    server: "starting",
    wsClients: 0,
    httpOk: false,
    relay: "looking for web viewer",
    injectOk: false,
    lastShown: "",
  };

  async onload() {
    this.statusEl = this.addStatusBarItem();
    this.renderStatus();

    this.server = startBridgeServer({
      port: BRIDGE_PORT,
      allowedOrigins: EXTENSION_ORIGINS,
      files: EXTENSION_FILES,
      version: this.manifest.version,
      onMessage: (msg, reply) => void this.handle(msg, reply),
      onLog: (line) => {
        if (line.startsWith("HTTP /ping")) this.state.httpOk = true;
        this.addLog(`[A] ${line}`);
      },
      onClientsChanged: (n) => {
        this.state.wsClients = n;
        this.renderStatus();
      },
    });
    this.server.listening.then(
      () => {
        this.state.server = "listening";
        this.renderStatus();
        new Notice(`Owlbear bridge test listening on 127.0.0.1:${BRIDGE_PORT}`);
      },
      (err: Error) => {
        this.state.server = "failed";
        this.renderStatus();
        new Notice(`Owlbear bridge test could not start: ${err.message}`);
      },
    );

    let lastRelay = "";
    this.relay = new WebviewRelay({
      extensionOrigins: EXTENSION_ORIGINS,
      msgKey: MSG_KEY,
      findWebviews: () => this.findWebviews(),
      onMessage: (msg, reply) => {
        this.state.injectOk = true;
        void this.handle(msg, reply);
      },
      onStatus: (s) => {
        const text = describeRelay(s);
        if (text !== lastRelay) {
          lastRelay = text;
          this.state.relay = text;
          this.addLog(`[B] ${text}`);
        }
      },
    });
    this.app.workspace.onLayoutReady(() => this.relay?.start());

    this.addCommand({
      id: "show-log",
      name: "Show connection test log",
      callback: () => new LogModal(this.app, this).open(),
    });
    this.addCommand({
      id: "diagnose-web-viewer",
      name: "Diagnose web viewer (logs what Obsidian is showing Owlbear in)",
      callback: () => {
        this.app.workspace.iterateAllLeaves((leaf) => {
          const el = leaf.view.containerEl;
          const webviews = Array.from(el.querySelectorAll("webview")) as unknown as WebviewLike[];
          const iframes = Array.from(el.querySelectorAll("iframe")).map((f) => f.src).filter(Boolean);
          if (!webviews.length && !iframes.length) return;
          const urls = webviews.map((w) => {
            try {
              return w.getURL();
            } catch (e) {
              return `(getURL failed: ${(e as Error).message})`;
            }
          });
          this.addLog(
            `[diag] view "${leaf.view.getViewType()}": ${webviews.length} webview(s) ${JSON.stringify(urls)}, ` +
              `${iframes.length} iframe(s) ${JSON.stringify(iframes)}`,
          );
        });
        void this.relay?.tick();
        new LogModal(this.app, this).open();
      },
    });
    this.addCommand({
      id: "show-test-creature",
      name: "Show a creature in the Creature pane (self-test)",
      callback: async () => {
        const names = window.FantasyStatblocks?.getBestiaryNames() ?? [];
        const pick = names.includes("Goblin") ? "Goblin" : names[0];
        const result = await this.showCreature([{ name: pick ?? "", label: "" }]);
        new Notice(result.creature ? `Showing ${result.creature}` : "Fantasy Statblocks not found");
      },
    });
  }

  async onunload() {
    this.relay?.stop();
    await this.server?.close();
  }

  // ------------------------------------------------------------ messages

  private async handle(msg: Record<string, unknown>, reply: (msg: unknown) => void) {
    const route = msg.route === "inject" ? "inject" : "websocket";
    const tag = route === "inject" ? "[B]" : "[A]";
    switch (msg.type) {
      case "hello": {
        this.addLog(`${tag} hello from ${msg.variant} (${msg.role} "${msg.player}")`);
        const names = window.FantasyStatblocks?.getBestiaryNames() ?? [];
        reply({
          type: "welcome",
          route,
          vaultName: this.app.vault.getName(),
          statblocks: !!window.FantasyStatblocks,
          creatures: names.length,
        });
        break;
      }
      case "ping":
        reply({ type: "pong", route, t: msg.t });
        break;
      case "selection": {
        const tokens = (msg.tokens as Token[]) ?? [];
        this.addLog(`${tag} selection: ${tokens.map((t) => t.label || t.name).join(", ")}`);
        const shown = await this.showCreature(tokens);
        reply({ type: "shown", route, ...shown });
        break;
      }
      default:
        break;
    }
    this.renderStatus();
  }

  // ------------------------------------------------------------ Creature pane

  /** Mirrors Fantasy Statblocks' own obsidian://creature-pane handler. */
  async showCreature(tokens: Token[]): Promise<{ creature: string | null; tried: string[] }> {
    const api = window.FantasyStatblocks;
    const tried: string[] = [];
    if (!api) return { creature: null, tried };
    const byKey = new Map(api.getBestiaryNames().map((n) => [matchKey(n), n]));
    const first = tokens[0];
    if (!first) return { creature: null, tried };
    for (const candidate of nameCandidates(first)) {
      tried.push(candidate);
      const match = byKey.get(matchKey(candidate));
      if (!match) continue;
      const creature = api.getBestiary?.().get(match) ?? (await api.getCreature?.(match));
      const fs = (this.app as unknown as { plugins: { getPlugin(id: string): unknown } }).plugins.getPlugin(
        "obsidian-5e-statblocks",
      ) as StatblocksPlugin | null;
      if (fs?.creature_view) await fs.creature_view.render(creature);
      else if (fs?.openCreatureView) await (await fs.openCreatureView()).render(creature);
      this.state.lastShown = match;
      this.addLog(`showing ${match} in the Creature pane`);
      return { creature: match, tried };
    }
    this.addLog(`no bestiary match (tried ${tried.join(", ")})`);
    return { creature: null, tried };
  }

  // ------------------------------------------------------------ helpers

  private findWebviews(): WebviewLike[] {
    const found = new Set<WebviewLike>();
    this.app.workspace.iterateAllLeaves((leaf) => {
      leaf.view.containerEl
        .querySelectorAll("webview")
        .forEach((el) => found.add(el as unknown as WebviewLike));
    });
    return [...found];
  }

  addLog(line: string) {
    const stamp = new Date().toLocaleTimeString();
    this.log.unshift(`${stamp}  ${line}`);
    this.log.length = Math.min(this.log.length, 200);
    console.log(`[owlbear-bridge-spike] ${line}`);
    this.renderStatus();
  }

  private renderStatus() {
    const s = this.state;
    const a =
      s.server === "failed" ? "A ✖" : s.wsClients > 0 ? `A ✔ (${s.wsClients})` : s.httpOk ? "A ~" : "A …";
    const b = s.injectOk ? "B ✔" : "B …";
    this.statusEl?.setText(`Owlbear test: ${a} · ${b}${s.lastShown ? ` · ${s.lastShown}` : ""}`);
  }

  summary(): string {
    const s = this.state;
    return [
      `Server: ${s.server} on 127.0.0.1:${BRIDGE_PORT}`,
      `Route A: HTTP ping ${s.httpOk ? "received" : "not seen"}; websocket clients ${s.wsClients}`,
      `Route B: ${s.injectOk ? "messages relayed" : "no messages yet"}; ${s.relay}`,
      `Last creature shown: ${s.lastShown || "none"}`,
      `Electron ${process.versions.electron ?? "?"}, Chromium ${process.versions.chrome ?? "?"}`,
      `User agent: ${navigator.userAgent}`,
    ].join("\n");
  }
}

function describeRelay(s: RelayStatus): string {
  if (s.error) return `web viewer found but injection failed: ${s.error}`;
  if (s.webviews === 0) return "no web viewer <webview> found";
  if (s.owlbear === 0) return `${s.webviews} web viewer(s), none on owlbear.rodeo`;
  return `Owlbear open in ${s.owlbear} web viewer(s); our extension frames: ${s.frames.length}`;
}

class LogModal extends Modal {
  constructor(app: App, private plugin: OwlbearBridgeSpike) {
    super(app);
  }
  onOpen() {
    this.titleEl.setText("Owlbear bridge test");
    const text = `${this.plugin.summary()}\n\n${this.plugin.log.join("\n")}`;
    const area = this.contentEl.createEl("textarea", { text });
    area.style.width = "100%";
    area.style.height = "320px";
    area.style.fontFamily = "var(--font-monospace)";
    area.readOnly = true;
    const btn = this.contentEl.createEl("button", { text: "Copy" });
    btn.style.marginTop = "8px";
    btn.onclick = async () => {
      await navigator.clipboard.writeText(text);
      new Notice("Copied");
    };
  }
  onClose() {
    this.contentEl.empty();
  }
}
