// GM-only ring around the token(s) whose turn it is (local items, never sent to players).

import OBR, { buildShape, type Item } from "@owlbear-rodeo/sdk";
import { RING_KEY } from "./common";

const RING_COLOR = "#ffd54a";

/** Make the rings match `tokenIds` exactly: add missing ones, remove the rest. */
export async function showRings(tokenIds: string[]) {
  const wanted = new Set(tokenIds);
  const rings = await OBR.scene.local.getItems((item) => !!item.metadata[RING_KEY]);
  const have = new Set<string>();
  const stale: string[] = [];
  for (const ring of rings) {
    const parent = ring.attachedTo ?? "";
    if (wanted.has(parent) && !have.has(parent)) have.add(parent);
    else stale.push(ring.id);
  }
  if (stale.length) await OBR.scene.local.deleteItems(stale);

  const missing = [...wanted].filter((id) => !have.has(id));
  if (!missing.length) return;
  const present = new Set((await OBR.scene.items.getItems(missing)).map((i) => i.id));
  const dpi = await OBR.scene.grid.getDpi();
  const created: Item[] = [];
  for (const id of missing) {
    if (!present.has(id)) continue;
    const b = await OBR.scene.items.getItemBounds([id]);
    const size = Math.max(b.width, b.height) * 1.12;
    created.push(
      buildShape()
        .shapeType("CIRCLE")
        .width(size)
        .height(size)
        .position(b.center)
        .strokeColor(RING_COLOR)
        .strokeOpacity(0.95)
        .strokeWidth(Math.max(3, Math.round(dpi * 0.04)))
        .fillOpacity(0)
        .attachedTo(id)
        .layer("ATTACHMENT")
        .locked(true)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION", "SCALE"])
        .metadata({ [RING_KEY]: true })
        .build(),
    );
  }
  if (created.length) await OBR.scene.local.addItems(created);
}
