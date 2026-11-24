// GM-only HP labels under linked tokens. They are *local* items, which exist
// only in this browser: players never receive them.

import OBR, { buildLabel, type Item, type Label } from "@owlbear-rodeo/sdk";
import { hpBand } from "../shared/hp";
import { LABEL_KEY, readCreature } from "./common";

const COLORS = { healthy: "#2e7d32", bloodied: "#b26a00", down: "#b71c1c" } as const;

interface LabelInfo {
  text: string;
  color: string;
}

function infoFor(token: Item): LabelInfo | null {
  const c = readCreature(token.metadata);
  if (!c) return null;
  return { text: `${c.hp}/${c.maxHp}`, color: COLORS[hpBand(c)] };
}

let scheduled = false;
let running = false;
let again = false;

export function startLabels() {
  OBR.scene.items.onChange(() => schedule());
  OBR.scene.onReadyChange((ready) => {
    if (ready) schedule();
  });
  schedule();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    void run();
  }, 60);
}

async function run() {
  if (running) {
    again = true;
    return;
  }
  running = true;
  try {
    await reconcile();
  } catch (err) {
    console.warn("[obsidian-bestiary] label update failed", err);
  } finally {
    running = false;
    if (again) {
      again = false;
      schedule();
    }
  }
}

export async function reconcile() {
  if (!(await OBR.scene.isReady())) return;
  const tokens = await OBR.scene.items.getItems((item) => readCreature(item.metadata) !== null);
  const labels = (await OBR.scene.local.getItems((item) => !!item.metadata[LABEL_KEY])) as Label[];

  const wanted = new Map<string, { token: Item; info: LabelInfo }>();
  for (const token of tokens) {
    const info = infoFor(token);
    if (info) wanted.set(token.id, { token, info });
  }

  const stale: string[] = [];
  const changed: Label[] = [];
  const have = new Set<string>();
  for (const label of labels) {
    const parent = label.attachedTo ?? "";
    const want = wanted.get(parent);
    if (!want || have.has(parent)) {
      stale.push(label.id);
      continue;
    }
    have.add(parent);
    if (label.text.plainText !== want.info.text || label.style.backgroundColor !== want.info.color) {
      changed.push(label);
    }
  }

  if (stale.length) await OBR.scene.local.deleteItems(stale);

  if (changed.length) {
    await OBR.scene.local.updateItems(changed, (drafts) => {
      for (const d of drafts) {
        const info = wanted.get(d.attachedTo ?? "")!.info;
        d.text.plainText = info.text;
        d.style.backgroundColor = info.color;
      }
    });
  }

  const missing = [...wanted.values()].filter(({ token }) => !have.has(token.id));
  if (missing.length) {
    const dpi = await OBR.scene.grid.getDpi();
    const created: Item[] = [];
    for (const { token, info } of missing) {
      const bounds = await OBR.scene.items.getItemBounds([token.id]);
      created.push(
        buildLabel()
          .plainText(info.text)
          .position({ x: bounds.center.x, y: bounds.max.y })
          .attachedTo(token.id)
          .pointerDirection("UP")
          .pointerHeight(0)
          .pointerWidth(0)
          .backgroundColor(info.color)
          .backgroundOpacity(0.85)
          .cornerRadius(dpi * 0.08)
          .fillColor("#ffffff")
          .fontWeight(700)
          .fontSize(Math.round(dpi * 0.16))
          .padding(Math.round(dpi * 0.03))
          .locked(true)
          .disableHit(true)
          .disableAttachmentBehavior(["ROTATION"])
          .metadata({ [LABEL_KEY]: true })
          .build(),
      );
    }
    await OBR.scene.local.addItems(created);
  }
}
