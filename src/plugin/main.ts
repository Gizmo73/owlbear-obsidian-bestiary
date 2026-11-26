// Owlbear Bestiary Bridge: lets the "Obsidian Bestiary" Owlbear Rodeo extension
// search your Fantasy Statblocks bestiary and open creatures in the Creature pane.
// It also owns the campaign's combat data (players, parties, encounters, token
// images) and the `encounter` code block, so Initiative Tracker isn't needed.

import { App, Notice, Plugin, PluginSettingTab, Setting, debounce } from "obsidian";
import { startBridgeServer, type BridgeServer } from "./server";
import { registerEncounters } from "./encounters";
import {
  DEFAULT_PORT,
  EXTENSION_ORIGINS,
  PROTOCOL_VERSION,
  type BestiaryPayload,
  type EncountersPayload,
  type PartiesPayload,
  type Push,
  type Request,
  type ShowResult,
  type TokenArt,
  type Welcome,
} from "../shared/protocol";
import { indexVersion, toEntry, type BestiaryEntry } from "../shared/bestiary";
import {
  importInitiativeTracker,
  type InitiativeTrackerData,
  type Player,
  type StagedEncounter,
} from "../shared/encounter";
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
    /** For Fantasy Statblocks layout buttons: `OwlbearBridge.addToOwlbear(monster)`. */
    OwlbearBridge?: { addToOwlbear(creature: { name?: string } | string): void };
  }
}

interface Settings {
  port: number;
  showOnSelect: boolean;
  players: Player[];
  parties: { name: string; members: string[] }[];
  /** Each PC's token image in the GM's Owlbear library, for "Insert party". */
  tokenArt: Record<string, TokenArt>;
  /** Each creature's token image, for "Insert encounter" and "Add to Owlbear". */
  creatureArt: Record<string, TokenArt>;
  /** Encounters sent to Owlbear's list (or imported from Initiative Tracker). */
  encounters: StagedEncounter[];
  /** When Initiative Tracker's data was imported (0 = not yet). */
  importedFromInitiativeTracker: number;
}

const freshSettings = (): Settings => ({
  port: DEFAULT_PORT,
  showOnSelect: true,
  players: [],
  parties: [],
  tokenArt: {},
  creatureArt: {},
  encounters: [],
  importedFromInitiativeTracker: 0,
});

type Plugins = { getPlugin(id: string): unknown; enabledPlugins: Set<string> };

export default class OwlbearBestiaryBridge extends Plugin {
  settings: Settings = freshSettings();
  private server: BridgeServer | null = null;
  private statusEl!: HTMLElement;
  private clients = 0;
  private serverState: "starting" | "listening" | "failed" = "starting";
  private index: BestiaryEntry[] = [];
  private version = "";
  private byKey = new Map<string, string>();
  /** Whether this plugin draws `encounter` blocks (only when Initiative Tracker is off). */
  encounterBlocks = false;

  get plugins(): Plugins {
    return (this.app as unknown as { plugins: Plugins }).plugins;
  }

  get initiativeTrackerEnabled(): boolean {
    return this.plugins.enabledPlugins.has("initiative-tracker");
  }

  get connected(): boolean {
    return this.clients > 0;
  }

  async onload() {
    this.settings = { ...freshSettings(), ...((await this.loadData()) as Partial<Settings> | null) };
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

    registerEncounters(this);

    window.OwlbearBridge = { addToOwlbear: (creature) => this.addToOwlbear(creature) };
    this.register(() => delete window.OwlbearBridge);

    this.addCommand({
      id: "import-initiative-tracker",
      name: "Import players, parties and saved encounters from Initiative Tracker",
      callback: () => void this.importFromInitiativeTracker(true),
    });

    this.app.workspace.onLayoutReady(async () => {
      if (!this.settings.importedFromInitiativeTracker) await this.importFromInitiativeTracker(false);
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

  push(msg: Push) {
    this.server?.broadcast(msg);
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
      case "saveTokenArt":
        return this.saveArt("tokenArt", req.art);
      case "getEncounters":
        return this.encountersPayload();
      case "removeEncounter":
        await this.removeEncounter(req.encounterId);
        return this.encountersPayload();
      case "saveCreatureArt":
        return this.saveArt("creatureArt", req.art);
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
    if (notify) this.push({ push: "bestiaryChanged", version, creatureCount: entries.length });
  }

  /** Exact bestiary name for a loosely written one ("kuo toa" -> "Kuo-Toa"). */
  bestiaryName(name: string): string | null {
    return this.byKey.get(matchKey(name)) ?? null;
  }

  /** Same as Fantasy Statblocks' own obsidian://creature-pane handler. */
  async showCreature(name: string): Promise<string | null> {
    const api = window.FantasyStatblocks;
    const exact = this.bestiaryName(name);
    if (!api || !exact) return null;
    const creature = api.getBestiary?.().get(exact) ?? api.getCreatureFromBestiary(exact);
    const fs = this.plugins.getPlugin("obsidian-5e-statblocks") as StatblocksPlugin | null;
    if (fs?.creature_view) await fs.creature_view.render(creature);
    else if (fs?.openCreatureView) await (await fs.openCreatureView()).render(creature);
    else return null;
    return exact;
  }

  // ------------------------------------------------------------ players and parties

  parties(): PartiesPayload {
    const pcs = new Set<string>([
      ...this.settings.players.map((p) => p.name),
      ...this.settings.parties.flatMap((p) => p.members),
    ]);
    return {
      parties: this.settings.parties.map((p) => ({ ...p, source: "bridge" })),
      pcs: [...pcs].sort((a, b) => a.localeCompare(b)),
      art: this.settings.tokenArt,
    };
  }

  private async saveParty(name: string, members: string[]): Promise<PartiesPayload> {
    const clean = name.trim();
    if (!clean) throw new Error("the party needs a name");
    const list = [...new Set(members.map((m) => m.trim()).filter(Boolean))];
    const existing = this.settings.parties.find((p) => p.name === clean);
    if (existing) existing.members = list;
    else this.settings.parties.push({ name: clean, members: list });
    for (const member of list) {
      if (!this.settings.players.some((p) => p.name === member)) this.settings.players.push({ name: member });
    }
    await this.saveSettings();
    this.push({ push: "partiesChanged" });
    return this.parties();
  }

  private async deleteParty(name: string): Promise<PartiesPayload> {
    this.settings.parties = this.settings.parties.filter((p) => p.name !== name);
    await this.saveSettings();
    this.push({ push: "partiesChanged" });
    return this.parties();
  }

  private async saveArt(key: "tokenArt" | "creatureArt", art: Record<string, TokenArt | null>) {
    const store = this.settings[key];
    for (const [name, value] of Object.entries(art)) {
      if (!name.trim()) continue;
      if (value && typeof value.image?.url === "string") store[name] = value;
      else delete store[name];
    }
    await this.saveSettings();
    if (key === "tokenArt") {
      this.push({ push: "partiesChanged" });
      return this.parties();
    }
    this.push({ push: "encountersChanged" });
    return this.encountersPayload();
  }

  // ------------------------------------------------------------ encounters

  encountersPayload(): EncountersPayload {
    return {
      encounters: [...this.settings.encounters].sort((a, b) => b.addedAt - a.addedAt),
      art: this.settings.creatureArt,
    };
  }

  isStaged(id: string): boolean {
    return this.settings.encounters.some((e) => e.id === id);
  }

  /** Add or update an encounter in Owlbear's list. */
  async stageEncounter(encounter: StagedEncounter) {
    this.settings.encounters = [...this.settings.encounters.filter((e) => e.id !== encounter.id), encounter];
    await this.saveSettings();
    this.push({ push: "encountersChanged" });
  }

  async removeEncounter(id: string) {
    this.settings.encounters = this.settings.encounters.filter((e) => e.id !== id);
    await this.saveSettings();
    this.push({ push: "encountersChanged" });
  }

  /** Called by the "Add to Owlbear" button in the statblock layout. */
  addToOwlbear(creature: { name?: string } | string) {
    const raw = typeof creature === "string" ? creature : creature?.name;
    const name = raw ? (this.bestiaryName(raw) ?? raw) : "";
    if (!name) return;
    if (!this.connected) {
      new Notice("Owlbear isn't connected: open your room with the Obsidian Bestiary extension.");
      return;
    }
    this.push({ push: "addCreature", name });
    new Notice(`Adding ${name} to Owlbear (hidden)`);
  }

  // ------------------------------------------------------------ Initiative Tracker import

  private async initiativeTrackerData(): Promise<InitiativeTrackerData | null> {
    const live = (this.plugins.getPlugin("initiative-tracker") as { data?: InitiativeTrackerData } | null)?.data;
    if (live) return live;
    try {
      const path = `${this.app.vault.configDir}/plugins/initiative-tracker/data.json`;
      return JSON.parse(await this.app.vault.adapter.read(path)) as InitiativeTrackerData;
    } catch {
      return null;
    }
  }

  /** Copy Initiative Tracker's players, parties and saved encounters in. Never overwrites ours. */
  async importFromInitiativeTracker(manual: boolean) {
    const it = await this.initiativeTrackerData();
    if (!it) {
      if (manual) new Notice("No Initiative Tracker data found to import.");
      return;
    }
    const imported = importInitiativeTracker(it);
    const s = this.settings;
    const add = <T>(list: T[], items: T[], key: (t: T) => string) => {
      const have = new Set(list.map(key));
      const fresh = items.filter((i) => !have.has(key(i)));
      list.push(...fresh);
      return fresh.length;
    };
    const players = add(s.players, imported.players, (p) => p.name);
    const parties = add(s.parties, imported.parties, (p) => p.name);
    const encounters = add(s.encounters, imported.encounters, (e) => e.id);
    s.importedFromInitiativeTracker = Date.now();
    await this.saveSettings();
    if (players || parties || encounters || manual) {
      new Notice(
        `Owlbear Bestiary Bridge imported from Initiative Tracker: ${parties} parties, ${players} players, ${encounters} saved encounters.`,
        8000,
      );
    }
    this.push({ push: "partiesChanged" });
    this.push({ push: "encountersChanged" });
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

const LAYOUT_CALLBACK = "try { OwlbearBridge.addToOwlbear(monster); } catch (e) {}";

class BridgeSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: OwlbearBestiaryBridge,
  ) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    const s = this.plugin.settings;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Show selected tokens in the Creature pane")
      .setDesc("When you select a linked token in Owlbear, open its statblock in Fantasy Statblocks' Creature pane.")
      .addToggle((t) =>
        t.setValue(s.showOnSelect).onChange(async (v) => {
          s.showOnSelect = v;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl).setName("Encounters and parties").setHeading();
    new Setting(containerEl)
      .setName("Encounter blocks")
      .setDesc(
        this.plugin.encounterBlocks
          ? "This plugin shows `encounter` blocks with a Send to Owlbear button."
          : this.plugin.initiativeTrackerEnabled
            ? "Initiative Tracker is still enabled, so it draws `encounter` blocks. Disable it and restart Obsidian to get Send to Owlbear buttons. Meanwhile use the command “Send encounter under cursor to Owlbear”."
            : "Restart Obsidian to show `encounter` blocks with a Send to Owlbear button.",
      );
    new Setting(containerEl)
      .setName("Import from Initiative Tracker")
      .setDesc(
        `${s.parties.length} parties, ${s.players.length} players and ${s.encounters.length} encounters stored here. ` +
          "Importing again only adds what's missing.",
      )
      .addButton((b) =>
        b.setButtonText("Import").onClick(async () => {
          await this.plugin.importFromInitiativeTracker(true);
          this.display();
        }),
      );
    new Setting(containerEl)
      .setName("“Add to Owlbear” button for statblocks")
      .setDesc(
        "In Fantasy Statblocks → Layouts → your layout, set an Action block's callback to this, and delete the old Initiative Tracker buttons.",
      )
      .addText((t) => {
        t.setValue(LAYOUT_CALLBACK).setDisabled(true);
        t.inputEl.style.width = "100%";
      })
      .addButton((b) =>
        b.setButtonText("Copy").onClick(async () => {
          await navigator.clipboard.writeText(LAYOUT_CALLBACK);
          new Notice("Copied");
        }),
      );

    new Setting(containerEl).setName("Connection").setHeading();
    new Setting(containerEl)
      .setName("Port")
      .setDesc(
        `Local port the Owlbear extension connects to (default ${DEFAULT_PORT}). ` +
          "If you change it, set the same port in the extension's panel in Owlbear.",
      )
      .addText((t) =>
        t.setValue(String(s.port)).onChange(async (v) => {
          const port = Number(v);
          if (!Number.isInteger(port) || port < 1024 || port > 65535) return;
          s.port = port;
          await this.plugin.saveSettings();
        }),
      )
      .addButton((b) =>
        b.setButtonText("Restart").onClick(async () => {
          await this.plugin.startServer();
          new Notice(`Owlbear Bestiary Bridge listening on 127.0.0.1:${s.port}`);
        }),
      );
  }
}
