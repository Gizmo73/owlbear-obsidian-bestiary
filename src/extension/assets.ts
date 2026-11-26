// Token images from the GM's Owlbear library: picking them, remembering them, placing them.

import OBR, { buildImage, type Image, type ImageDownload, type Item, type TextContent } from "@owlbear-rodeo/sdk";
import type { TokenArt } from "../shared/protocol";

/** Owlbear rejects some calls with plain objects or strings rather than Errors. */
export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  const message = (err as { message?: unknown } | null)?.message ?? (err as { error?: unknown } | null)?.error;
  if (typeof message === "string") return message;
  try {
    return JSON.stringify(err) ?? String(err);
  } catch {
    return String(err);
  }
}

export const plainText = (text: unknown) => (text as { plainText?: string } | undefined)?.plainText ?? "";

export function toArt(d: ImageDownload): TokenArt {
  return {
    name: d.name,
    image: { url: d.image.url, mime: d.image.mime, width: d.image.width, height: d.image.height },
    grid: { dpi: d.grid.dpi, offset: { x: d.grid.offset.x, y: d.grid.offset.y } },
    scale: { x: d.scale.x, y: d.scale.y },
    rotation: d.rotation,
    text: d.text,
    textItemType: d.textItemType,
    description: d.description,
  };
}

/** A token already on the map, as saved art (so a later insert can recreate it). */
export function artFromItem(item: Image): TokenArt {
  return toArt({ ...item, type: "CHARACTER" } as unknown as ImageDownload);
}

/**
 * Open Owlbear's asset picker. Tries the full request first, then plainer ones in case this
 * Owlbear version rejects the search text or type hint. Returns the error text if all fail.
 */
export async function pickImages(search: string, multiple = true): Promise<{ picks: ImageDownload[]; error?: string }> {
  const attempts: (() => Promise<ImageDownload[]>)[] = [
    () => OBR.assets.downloadImages(multiple, search || undefined, "CHARACTER"),
    () => OBR.assets.downloadImages(multiple),
    () => OBR.assets.downloadImages(),
  ];
  let error = "";
  for (const attempt of attempts) {
    try {
      return { picks: (await attempt()) ?? [] };
    } catch (err) {
      error = describeError(err);
      console.warn("[obsidian-bestiary] asset picker failed:", err);
    }
  }
  return { picks: [], error };
}

/** On-map size of a token (scene units) for spacing. */
export async function tokenSize(art: TokenArt): Promise<number> {
  const dpi = await OBR.scene.grid.getDpi();
  return (art.image.width / art.grid.dpi) * dpi * Math.abs(art.scale.x);
}

/** Centre of what the GM is looking at, in scene coordinates. */
export async function viewCentre() {
  const [w, h] = await Promise.all([OBR.viewport.getWidth(), OBR.viewport.getHeight()]);
  return OBR.viewport.inverseTransformPoint({ x: w / 2, y: h / 2 });
}

export function buildToken(
  art: TokenArt,
  position: { x: number; y: number },
  metadata: Record<string, unknown>,
  visible = true,
): Item {
  let b = buildImage(art.image, art.grid)
    .name(art.name)
    .scale(art.scale)
    .rotation(art.rotation)
    .layer("CHARACTER")
    .position(position)
    .visible(visible)
    .metadata(metadata);
  if (art.text) b = b.text(art.text as TextContent);
  if (art.textItemType) b = b.textItemType(art.textItemType as "LABEL" | "TEXT");
  if (art.description) b = b.description(art.description);
  return b.build();
}
