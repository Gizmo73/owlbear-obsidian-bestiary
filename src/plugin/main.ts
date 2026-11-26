// Owlbear Bestiary Bridge: lets the "Obsidian Bestiary" Owlbear Rodeo extension
// search your Fantasy Statblocks bestiary and open creatures in the Creature pane.

import { App, Notice, Plugin, PluginSettingTab, Setting, debounce } from "obsidian";
import { startBridgeServer, type BridgeServer } from "./server";
import {
  DEFAULT_PORT,
  EXTENSION_ORIGINS,
  PROTOCOL_VERSION,
  type BestiaryPayload,
  type PartiesPayload,
  type Party,
  type Push,
  type Request,
  type ShowResult,
  type Welcome,
} from "../shared/protocol";
import { indexVersion, toEntry, type BestiaryEntry } from "../shared/bestiary";
import { matchKey } from "../shared/names";

interface StatblocksApi {
  getBestiaryNames(): string[];
  getCreatureFromBestiary(name: string): Record<string, unknown> | null;
  getBestiary?(): Map<string, Record<string, unknown>>;
  isResolved(): boolean;
}

interface StatblocksPlugin {
  creature_view?: { render(creature: unknown): Promise<void> };
  openCreatureView?: () => Promise<{ render(creature: unknown): Promise<void> }>;
}

declare global {
  interface Window {
    FantasyStatblocks?: StatblocksApi;
  }
}

interface Settings {
  port: number;
  showOnSelect: boolean;
  /** Parties made in Owlbear (Initiative Tracker's own parties are read, never written). */
  parties: { name: string; members: string[] }[];
}

const DEFAULTS: Settings = { port: DEFAULT_PORT, showOnSelect: true, parties: [] };

/** The bits of Initiative Tracker's saved data we read. */
interface InitiativeTrackerData {
  parties?: { name: string; players?: string[] }[];
  players?: { name: string; player?: boolean }[];
}

export default class OwlbearBestiaryBridge extends Plugin {
  settings: Settings = { ...DEFAULTS };
  private server: BridgeServer | null = null;
  private statusEl!: HTMLElement;
  private clients = 0;
  private serverState: "starting" | "listening" | "failed" = "starting";
  private index: BestiaryEntry[] = [];
  private version = "";
  private byKey = new Map<string, string>();

  async onload() {
    this.settings = { ...DEFAULTS, parties: [], ...((await this.loadData()) as Partial<Settings> | null) };
    this.statusEl = this.addStatusBarItem();
    this.addSettingTab(new BridgeSettingTab(this.app, this));

    const rebuild = debounce(() => this.rebuildIndex(true), 1500, true);
    for (const event of [
      "fantasy-statblocks:bestiary:resolved",
      "fantasy-statblocks:bestiary:updated",
      "fantasy-statblocks:loaded",
    ]) {
      // Fantasy Statblocks' own onUpdated() only fires once, so listen to its workspace events.
      this.registerEvent((this.app.workspace as unknown as WorkspaceEvents).on(event, rebuild));
    }

    this.app.workspace.onLayoutReady(() => {
      this.rebuildIndex(false);
      void this.startServer();
    });
  }

  async onunload() {
    await this.server?.close();
  }

  // ------------------------------------------------------------ server

  async startServer() {
    await this.server?.close();
    this.serverState = "starting";
    this.renderStatus();
    this.server = startBridgeServer({
      port: this.settings.port,
      allowedOrigins: EXTENSION_ORIGINS,
      version: this.manifest.version,
      onMessage: (msg, reply) => this.handle(msg, reply),
      onLog: (line) => console.debug(`[owlbear-bestiary-bridge] ${line}`),
      onClientsChanged: (n) => {
        this.clients = n;
        this.renderStatus();
      },
    });
    try {
      await this.server.listening;
      this.serverState = "listening";
    } catch (err) {
      this.serverState = "failed";
      const inUse = (err as NodeJS.ErrnoException).code === "EADDRINUSE";
      new Notice(
        inUse
          ? `Owlbear Bestiary Bridge: port ${this.settings.port} is in use. ` +
              `Disable the "Owlbear Bridge Test" plugin, or change the port in settings.`
          : `Owlbear Bestiary Bridge could not start: ${(err as Error).message}`,
        10000,
      );
    }
    this.renderStatus();
  }

  private async handle(raw: Record<string, unknown>, reply: (msg: unknown) => void) {
    const id = typeof raw.id === "number" ? raw.id : -1;
    const req = raw as unknown as Request;
    try {
      const result = await this.respond(req);
      reply({ id, ok: true, result });
    } catch (err) {
      reply({ id, ok: false, error: (err as Error).message });
    }
  }

  private async respond(req: Request): Promise<unknown> {
    switch (req.kind) {
      case "hello": {
        const welcome: Welcome = {
          protocol: PROTOCOL_VERSION,
          vault: this.app.vault.getName(),
          bestiaryVersion: this.version,
          creatureCount: this.index.length,
          statblocksPlugin: !!window.FantasyStatblocks,
        };
        return welcome;
      }
      case "getBestiary": {
        if (!this.index.length) this.rebuildIndex(false);
        const payload: BestiaryPayload = {
          version: this.version,
          vault: this.app.vault.getName(),
          creatures: this.index,
        };
        return payload;
      }
      case "showCreature": {
        const result: ShowResult = { shown: this.settings.showOnSelect ? await this.showCreature(req.name) : null };
        return result;
      }
      case "getParties":
        return this.parties();
      case "saveParty":
        return this.saveParty(req.name, req.members);
      case "deleteParty":
        return this.deleteParty(req.name);
      default:
        throw new Error(`unknown request "${(req as { kind?: string }).kind}"`);
    }
  }

  // ------------------------------------------------------------ bestiary

  rebuildIndex(notify: boolean) {
    const api = window.FantasyStatblocks;
    if (!api || !api.isResolved()) return;
    const entries: BestiaryEntry[] = [];
    for (const name of api.getBestiaryNames()) {
      try {
        const entry = toEntry(api.getCreatureFromBestiary(name) ?? {});
        if (entry) entries.push(entry);
      } catch (err) {
        console.warn(`[owlbear-bestiary-bridge] skipped "${name}": ${(err as Error).message}`);
      }
    }
    const version = indexVersion(entries);
    if (version === this.version) return;
    this.index = entries;
    this.version = version;
    this.byKey = new Map(entries.map((e) => [matchKey(e.name), e.name]));
    this.renderStatus();
    if (notify) {
      const push: Push = { push: "bestiaryChanged", version, creatureCount: entries.length };
      this.server?.broadcast(push);
    }
  }

  /** Same as Fantasy Statblocks' own obsidian://creature-pane handler. */
  async showCreature(name: string): Promise<string | null> {
    const api = window.FantasyStatblocks;
    const exact = this.byKey.get(matchKey(name));
    if (!api || !exact) return null;
    const creature = api.getBestiary?.().get(exact) ?? api.getCreatureFromBestiary(exact);
    const fs = (this.app as unknown as { plugins: { getPlugin(id: string): unknown } }).plugins.getPlugin(
      "obsidian-5e-statblocks",
    ) as StatblocksPlugin | null;
    if (fs?.creature_view) await fs.creature_view.render(creature);
    else if (fs?.openCreatureView) await (await fs.openCreatureView()).render(creature);
    else return null;
    return exact;
  }

  // ------------------------------------------------------------ parties

  /** Initiative Tracker's live data if it's loaded, else its saved data.json. */
  private async initiativeTrackerData(): Promise<InitiativeTrackerData | null> {
    const plugins = (this.app as unknown as { plugins: { getPlugin(id: string): unknown } }).plugins;
    const live = (plugins.getPlugin("initiative-tracker") as { data?: InitiativeTrackerData } | null)?.data;
    if (live) return live;
    try {
      const path = `${this.app.vault.configDir}/plugins/initiative-tracker/data.json`;
      return JSON.parse(await this.app.vault.adapter.read(path)) as InitiativeTrackerData;
    } catch {
      return null;
    }
  }

  async parties(): Promise<PartiesPayload> {
    const it = await this.initiativeTrackerData();
    const fromTracker: Party[] = (it?.parties ?? []).map((p) => ({
      name: p.name,
      members: p.players ?? [],
      source: "initiative-tracker",
    }));
    const own: Party[] = this.settings.parties.map((p) => ({ ...p, source: "bridge" }));
    const pcs = new Set<string>([
      ...(it?.players ?? []).filter((p) => p.player !== false && p.name).map((p) => p.name),
      ...fromTracker.flatMap((p) => p.members),
      ...own.flatMap((p) => p.members),
    ]);
    return { parties: [...fromTracker, ...own], pcs: [...pcs].sort((a, b) => a.localeCompare(b)) };
  }

  private async saveParty(name: string, members: string[]): Promise<PartiesPayload> {
    const clean = name.trim();
    if (!clean) throw new Error("the party needs a name");
    const it = await this.initiativeTrackerData();
    if (it?.parties?.some((p) => p.name === clean)) {
      throw new Error(`"${clean}" is an Initiative Tracker party: pick another name`);
    }
    const list = [...new Set(members.map((m) => m.trim()).filter(Boolean))];
    const existing = this.settings.parties.find((p) => p.name === clean);
    if (existing) existing.members = list;
    else this.settings.parties.push({ name: clean, members: list });
    await this.saveSettings();
    this.server?.broadcast({ push: "partiesChanged" } satisfies Push);
    return this.parties();
  }

  private async deleteParty(name: string): Promise<PartiesPayload> {
    this.settings.parties = this.settings.parties.filter((p) => p.name !== name);
    await this.saveSettings();
    this.server?.broadcast({ push: "partiesChanged" } satisfies Push);
    return this.parties();
  }

  // ------------------------------------------------------------ status

  renderStatus() {
    if (!this.statusEl) return;
    let text: string;
    if (this.serverState === "failed") text = "Owlbear: not running";
    else if (this.clients > 0) text = `Owlbear: connected${this.clients > 1 ? ` (${this.clients})` : ""}`;
    else text = "Owlbear: waiting";
    this.statusEl.setText(text);
    this.statusEl.setAttr(
      "aria-label",
      `Owlbear Bestiary Bridge · 127.0.0.1:${this.settings.port} · ${this.index.length} creatures`,
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

interface WorkspaceEvents {
  on(name: string, callback: () => void): import("obsidian").EventRef;
}

class BridgeSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: OwlbearBestiaryBridge,
  ) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Show selected tokens in the Creature pane")
      .setDesc("When you select a linked token in Owlbear, open its statblock in Fantasy Statblocks' Creature pane.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showOnSelect).onChange(async (v) => {
          this.plugin.settings.showOnSelect = v;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Port")
      .setDesc(
        `Local port the Owlbear extension connects to (default ${DEFAULT_PORT}). ` +
          "If you change it, set the same port in the extension's panel in Owlbear.",
      )
      .addText((t) =>
        t.setValue(String(this.plugin.settings.port)).onChange(async (v) => {
          const port = Number(v);
          if (!Number.isInteger(port) || port < 1024 || port > 65535) return;
          this.plugin.settings.port = port;
          await this.plugin.saveSettings();
        }),
      )
      .addButton((b) =>
        b.setButtonText("Restart").onClick(async () => {
          await this.plugin.startServer();
          new Notice(`Owlbear Bestiary Bridge listening on 127.0.0.1:${this.plugin.settings.port}`);
        }),
      );
  }
}
