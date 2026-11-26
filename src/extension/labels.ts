// GM-only HP text above linked tokens. These are *local* items, which exist
// only in this browser: players never receive them.
// Plain map text (not a Label) so it zooms with the map like token names do,
// at a fixed size that doesn't change when the token is resized.

import OBR, { buildText, type Item, type Text } from "@owlbear-rodeo/sdk";
import { hpBand } from "../shared/hp";
import { LABEL_KEY, readCreature } from "./common";

/** Bright fills with a dark outline read well on most maps. */
export const HP_COLORS = { healthy: "#7ee081", bloodied: "#ffc04d", down: "#ff6b6b" } as const;
/** Token names default to 24 on a 150 dpi grid; match that. */
const FONT_PER_DPI = 24 / 150;

interface LabelInfo {
  text: string;
  color: string;
  /** Token scale when the label was placed; a resize re-places it. */
  fit: string;
}

/** "#2 5/7" when there are several of the creature (matches "Goblin 2" in the turn order), else "5/7". */
function infoFor(token: Item, siblings: Map<string, number>): LabelInfo | null {
  const c = readCreature(token.metadata);
  if (!c) return null;
  const hp = `${c.hp}/${c.maxHp}`;
  const text = (siblings.get(c.name) ?? 0) > 1 && c.n ? `#${c.n} ${hp}` : hp;
  return { text, color: HP_COLORS[hpBand(c)], fit: `${token.scale.x},${token.scale.y}` };
}

const fitOf = (label: Item) => (label.metadata[LABEL_KEY] as { fit?: string } | undefined)?.fit ?? "";

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
  const labels = (await OBR.scene.local.getItems((item) => !!item.metadata[LABEL_KEY])) as Text[];

  const siblings = new Map<string, number>();
  for (const token of tokens) {
    const name = readCreature(token.metadata)!.name;
    siblings.set(name, (siblings.get(name) ?? 0) + 1);
  }
  const wanted = new Map<string, { token: Item; info: LabelInfo }>();
  for (const token of tokens) {
    const info = infoFor(token, siblings);
    if (info) wanted.set(token.id, { token, info });
  }

  const stale: string[] = [];
  const changed: Text[] = [];
  const have = new Set<string>();
  for (const label of labels) {
    const parent = label.attachedTo ?? "";
    const want = wanted.get(parent);
    if (!want || have.has(parent) || fitOf(label) !== want.info.fit || label.type !== "TEXT") {
      stale.push(label.id);
      continue;
    }
    have.add(parent);
    if (label.text.plainText !== want.info.text || label.text.style.fillColor !== want.info.color) {
      changed.push(label);
    }
  }

  if (stale.length) await OBR.scene.local.deleteItems(stale);

  if (changed.length) {
    await OBR.scene.local.updateItems(changed, (drafts) => {
      for (const d of drafts) {
        const info = wanted.get(d.attachedTo ?? "")!.info;
        d.text.plainText = info.text;
        d.text.style.fillColor = info.color;
      }
    });
  }

  const missing = [...wanted.values()].filter(({ token }) => !have.has(token.id));
  if (missing.length) {
    const dpi = await OBR.scene.grid.getDpi();
    const font = Math.round(dpi * FONT_PER_DPI);
    const boxHeight = Math.round(font * 1.5);
    const created: Item[] = [];
    for (const { token, info } of missing) {
      const bounds = await OBR.scene.items.getItemBounds([token.id]);
      // Wide enough for "#12 175/175" even on tiny tokens; centred over the token.
      const boxWidth = Math.max(bounds.width, font * 7);
      created.push(
        buildText()
          .textType("PLAIN")
          .plainText(info.text)
          .width(boxWidth)
          .height(boxHeight)
          .position({ x: bounds.center.x - boxWidth / 2, y: bounds.min.y - boxHeight })
          .attachedTo(token.id)
          .textAlign("CENTER")
          .textAlignVertical("BOTTOM")
          .fontSize(font)
          .fontWeight(700)
          .fillColor(info.color)
          .strokeColor("#000000")
          .strokeOpacity(0.85)
          .strokeWidth(Math.max(2, Math.round(font / 6)))
          .locked(true)
          .disableHit(true)
          .disableAttachmentBehavior(["ROTATION", "SCALE"])
          .metadata({ [LABEL_KEY]: { fit: info.fit } })
          .build(),
      );
    }
    await OBR.scene.local.addItems(created);
  }
}
