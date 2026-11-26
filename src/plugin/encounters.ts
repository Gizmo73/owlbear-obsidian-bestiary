// `encounter` code blocks (Initiative Tracker's syntax) with a "Send to Owlbear" button,
// and a command that sends the block under the cursor (works even while Initiative
// Tracker still owns the code block).

import { MarkdownView, Notice, parseYaml, type Editor, type MarkdownPostProcessorContext } from "obsidian";
import { parseEncounterBlock, summarize, type StagedEncounter } from "../shared/encounter";
import type OwlbearBestiaryBridge from "./main";

const STYLE = `
.obb-encounter { border: 1px solid var(--background-modifier-border); border-radius: var(--radius-m); padding: var(--size-4-2) var(--size-4-3); background: var(--background-secondary); }
.obb-encounter-head { display: flex; gap: var(--size-4-2); align-items: baseline; flex-wrap: wrap; }
.obb-encounter-title { font-weight: var(--font-semibold); }
.obb-encounter-party, .obb-encounter-note { color: var(--text-muted); font-size: var(--font-ui-small); }
.obb-creatures { margin: var(--size-4-1) 0 var(--size-4-2); padding-left: var(--size-4-5); }
.obb-creatures .obb-count { color: var(--text-muted); font-variant-numeric: tabular-nums; margin-right: 4px; }
.obb-creatures .obb-unknown { color: var(--text-muted); font-style: italic; }
.obb-actions { display: flex; gap: var(--size-4-2); align-items: center; flex-wrap: wrap; }
.obb-sent { color: var(--text-success); font-size: var(--font-ui-small); }
`;

interface BlockInfo {
  encounter: StagedEncounter;
  parsedOk: boolean;
}

/** Lines inside callouts / quotes start with "> " (possibly nested). */
const QUOTE = /^(?:\s*>\s?)*/;
const OPEN = /^(?:\s*>\s?)*\s*```encounter\b/;
const FENCE = /^(?:\s*>\s?)*\s*```/;
const CLOSE = /^(?:\s*>\s?)*\s*```\s*$/;

function basename(path: string) {
  return path.split("/").pop()?.replace(/\.md$/, "") ?? path;
}

/**
 * Name and stable id for a block: its `name:`, else "Note › Heading". Several unnamed
 * blocks under one heading get "(2)", "(3)", so each keeps its own entry in Owlbear's list.
 */
function describe(
  plugin: OwlbearBestiaryBridge,
  source: string,
  path: string,
  text: string | undefined,
  lineStart: number | undefined,
): BlockInfo {
  let data: unknown = {};
  let parsedOk = true;
  try {
    data = parseYaml(source) ?? {};
  } catch {
    parsedOk = false;
  }
  const block = parseEncounterBlock(data);
  const headings = plugin.app.metadataCache.getCache(path)?.headings ?? [];
  const line = lineStart ?? Number.MAX_SAFE_INTEGER;
  const above = headings.filter((h) => h.position.start.line < line);
  const heading = above.length ? above[above.length - 1].heading : undefined;

  let ordinal = 1;
  if (!block.name && text !== undefined && lineStart !== undefined) {
    const lines = text.split("\n");
    const from = heading ? above[above.length - 1].position.start.line : 0;
    for (let i = from; i < lineStart; i++) if (OPEN.test(lines[i])) ordinal++;
  }
  const label = block.name ?? [basename(path), heading].filter(Boolean).join(" › ");
  const name = ordinal > 1 ? `${label} (${ordinal})` : label;
  return {
    parsedOk,
    encounter: {
      id: `block:${path}::${name}`,
      name,
      from: basename(path),
      party: block.party,
      creatures: block.creatures,
      addedAt: Date.now(),
    },
  };
}

async function send(plugin: OwlbearBestiaryBridge, encounter: StagedEncounter) {
  if (!encounter.creatures.length) {
    new Notice("This encounter has no creatures to send.");
    return false;
  }
  const updating = plugin.isStaged(encounter.id);
  await plugin.stageEncounter({ ...encounter, addedAt: Date.now() });
  new Notice(
    `${updating ? "Updated" : "Sent"} “${encounter.name}” ${updating ? "in" : "to"} Owlbear's encounter list` +
      (plugin.connected ? "." : ". It'll be there when Owlbear connects."),
  );
  return true;
}

function render(plugin: OwlbearBestiaryBridge, source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
  const section = ctx.getSectionInfo(el);
  const { encounter, parsedOk } = describe(plugin, source, ctx.sourcePath, section?.text, section?.lineStart);
  el.empty();
  const box = el.createDiv({ cls: "obb-encounter" });
  const head = box.createDiv({ cls: "obb-encounter-head" });
  head.createSpan({ cls: "obb-encounter-title", text: encounter.name });
  if (encounter.party) head.createSpan({ cls: "obb-encounter-party", text: `Party: ${encounter.party}` });

  if (!parsedOk) box.createDiv({ cls: "obb-encounter-note", text: "This encounter block isn't valid YAML." });
  const list = box.createEl("ul", { cls: "obb-creatures" });
  for (const c of encounter.creatures) {
    const li = list.createEl("li");
    if (c.count > 1) li.createSpan({ cls: "obb-count", text: `${c.count} ×` });
    const known = plugin.bestiaryName(c.name);
    if (known) {
      const a = li.createEl("a", { text: c.name, href: "#", title: "Show in the Creature pane" });
      a.addEventListener("click", (e) => {
        e.preventDefault();
        void plugin.showCreature(known);
      });
    } else {
      li.createSpan({ cls: "obb-unknown", text: c.name, title: "Not in your bestiary: it will be placed as an unlinked token" });
    }
    const extras = [c.hp !== undefined ? `HP ${c.hp}` : "", c.ac !== undefined ? `AC ${c.ac}` : "", c.ally ? "ally" : ""].filter(Boolean);
    if (extras.length) li.createSpan({ cls: "obb-encounter-note", text: ` (${extras.join(", ")})` });
  }
  if (!encounter.creatures.length) box.createDiv({ cls: "obb-encounter-note", text: "No creatures yet." });

  const actions = box.createDiv({ cls: "obb-actions" });
  const draw = () => {
    actions.empty();
    if (plugin.isStaged(encounter.id)) {
      actions.createSpan({ cls: "obb-sent", text: "✓ In Owlbear's list" });
      actions.createEl("button", { text: "Update" }).addEventListener("click", async () => {
        await send(plugin, encounter);
        draw();
      });
      actions.createEl("button", { text: "Remove" }).addEventListener("click", async () => {
        await plugin.removeEncounter(encounter.id);
        draw();
      });
    } else {
      const b = actions.createEl("button", { text: "Send to Owlbear", cls: "mod-cta" });
      b.disabled = !encounter.creatures.length;
      b.addEventListener("click", async () => {
        if (await send(plugin, encounter)) draw();
      });
    }
  };
  draw();
}

/** The `encounter` block containing the cursor, if any. */
function blockAtCursor(editor: Editor): { source: string; lineStart: number } | null {
  const cursor = editor.getCursor().line;
  let start = -1;
  for (let i = cursor; i >= 0; i--) {
    const line = editor.getLine(i);
    if (OPEN.test(line)) {
      start = i;
      break;
    }
    if (i !== cursor && FENCE.test(line)) return null;
  }
  if (start === -1) return null;
  let end = -1;
  for (let i = start + 1; i < editor.lineCount(); i++) {
    if (CLOSE.test(editor.getLine(i))) {
      end = i;
      break;
    }
  }
  if (end === -1 || cursor > end) return null;
  const lines: string[] = [];
  for (let i = start + 1; i < end; i++) lines.push(editor.getLine(i).replace(QUOTE, ""));
  return { source: lines.join("\n"), lineStart: start };
}

export function registerEncounters(plugin: OwlbearBestiaryBridge) {
  const style = document.createElement("style");
  style.id = "owlbear-bestiary-bridge-style";
  style.textContent = STYLE;
  document.head.appendChild(style);
  plugin.register(() => style.remove());

  // Only one plugin can draw a code block language; leave it to Initiative Tracker while it's on.
  if (!plugin.initiativeTrackerEnabled) {
    try {
      plugin.registerMarkdownCodeBlockProcessor("encounter", (source, el, ctx) => render(plugin, source, el, ctx));
      plugin.encounterBlocks = true;
    } catch (err) {
      console.warn("[owlbear-bestiary-bridge] couldn't take over encounter blocks", err);
    }
  }

  plugin.addCommand({
    id: "send-encounter-under-cursor",
    name: "Send encounter under cursor to Owlbear",
    editorCheckCallback: (checking, editor, view) => {
      const block = blockAtCursor(editor);
      const file = view.file ?? plugin.app.workspace.getActiveViewOfType(MarkdownView)?.file;
      if (!block || !file) return false;
      if (!checking) {
        const { encounter } = describe(plugin, block.source, file.path, editor.getValue(), block.lineStart);
        void send(plugin, encounter);
      }
      return true;
    },
  });
}
