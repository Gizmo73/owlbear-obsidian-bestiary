// Just enough of Obsidian's API for test/plugin-smoke.mjs to run the real plugin code
// in a browser. Not shipped; esbuild swaps it in for "obsidian" in the smoke test only.

import { load as yamlLoad } from "js-yaml";

declare global {
  interface Window {
    __notices: string[];
    __app: unknown;
  }
  interface HTMLElement {
    createDiv(o?: { cls?: string; text?: string }): HTMLDivElement;
    createSpan(o?: { cls?: string; text?: string; title?: string }): HTMLSpanElement;
    createEl<K extends keyof HTMLElementTagNameMap>(tag: K, o?: { cls?: string; text?: string; href?: string; title?: string }): HTMLElementTagNameMap[K];
    empty(): void;
    setText(t: string): void;
    setAttr(k: string, v: string): void;
  }
}

window.__notices = [];

const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
proto.createEl = function (this: HTMLElement, tag: string, o: { cls?: string; text?: string; href?: string; title?: string } = {}) {
  const el = document.createElement(tag);
  if (o.cls) el.className = o.cls;
  if (o.text !== undefined) el.textContent = o.text;
  if (o.href) el.setAttribute("href", o.href);
  if (o.title) el.title = o.title;
  this.appendChild(el);
  return el;
};
proto.createDiv = function (this: HTMLElement, o = {}) {
  return (this as HTMLElement).createEl("div", o);
};
proto.createSpan = function (this: HTMLElement, o = {}) {
  return (this as HTMLElement).createEl("span", o);
};
proto.empty = function (this: HTMLElement) {
  this.innerHTML = "";
};
proto.setText = function (this: HTMLElement, t: string) {
  this.textContent = t;
};
proto.setAttr = function (this: HTMLElement, k: string, v: string) {
  this.setAttribute(k, v);
};

export class Notice {
  constructor(message: string) {
    window.__notices.push(message);
  }
}

export function parseYaml(text: string) {
  return yamlLoad(text);
}

export function debounce<T extends (...a: unknown[]) => unknown>(fn: T) {
  return fn;
}

export class MarkdownView {}

export class Plugin {
  commands: Record<string, unknown>[] = [];
  processors: Record<string, (source: string, el: HTMLElement, ctx: unknown) => void> = {};
  cleanups: (() => void)[] = [];
  data: unknown = null;
  constructor(
    public app: unknown,
    public manifest: { id: string; version: string },
  ) {}
  async loadData() {
    return this.data;
  }
  async saveData(d: unknown) {
    this.data = JSON.parse(JSON.stringify(d));
  }
  addStatusBarItem() {
    return document.body.createDiv({ cls: "status-bar-item" });
  }
  addSettingTab() {}
  addCommand(c: Record<string, unknown>) {
    this.commands.push(c);
  }
  registerEvent() {}
  register(fn: () => void) {
    this.cleanups.push(fn);
  }
  registerMarkdownCodeBlockProcessor(lang: string, fn: (source: string, el: HTMLElement, ctx: unknown) => void) {
    if (this.processors[lang]) throw new Error("already registered");
    this.processors[lang] = fn;
  }
}

export class PluginSettingTab {
  containerEl = document.createElement("div");
  constructor(
    public app: unknown,
    public plugin: unknown,
  ) {}
}

export class Setting {
  constructor(_el: HTMLElement) {}
  setName() {
    return this;
  }
  setDesc() {
    return this;
  }
  setHeading() {
    return this;
  }
  addToggle() {
    return this;
  }
  addText() {
    return this;
  }
  addButton() {
    return this;
  }
}
