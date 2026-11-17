// Spike: route B. Reach into Obsidian's web viewer (an Electron <webview>)
// running Owlbear, and relay postMessages to and from our extension's iframe.
// Kept free of any `obsidian` import so it can be exercised from plain Node.

export interface WebviewLike {
  getURL(): string;
  executeJavaScript(code: string): Promise<unknown>;
}

export interface RelayStatus {
  webviews: number;
  owlbear: number;
  frames: string[];
  error?: string;
}

interface RelayOptions {
  extensionOrigins: string[];
  msgKey: string;
  findWebviews: () => WebviewLike[];
  onMessage: (msg: Record<string, unknown>, reply: (msg: unknown) => void) => void;
  onStatus: (status: RelayStatus) => void;
  intervalMs?: number;
}

/**
 * Script run in Owlbear's top frame. Installs a tiny relay once, then returns
 * any messages our extension posted to the top frame since the last poll.
 */
export function bootstrapScript(extensionOrigins: string[], msgKey: string): string {
  return `(() => {
  if (!window.__obsBridge) {
    const ORIGINS = ${JSON.stringify(extensionOrigins)};
    const KEY = ${JSON.stringify(msgKey)};
    const queue = [];
    const listen = (w) => w.addEventListener("message", (e) => {
      if (e.data && e.data[KEY] && ORIGINS.includes(e.origin)) queue.push(e.data);
    });
    listen(window);
    const frames = () => {
      const out = [];
      const walk = (root) => {
        root.querySelectorAll("iframe").forEach((f) => {
          out.push(f);
          try { if (f.contentDocument) walk(f.contentDocument); } catch {}
        });
        root.querySelectorAll("*").forEach((el) => { if (el.shadowRoot) walk(el.shadowRoot); });
      };
      walk(document);
      return out;
    };
    const ours = () => frames().filter((f) => {
      try { return ORIGINS.includes(new URL(f.src, location.href).origin); } catch { return false; }
    });
    window.__obsBridge = {
      send(msg) {
        for (const f of ours()) {
          try { f.contentWindow.postMessage(Object.assign({ [KEY]: true }, msg), new URL(f.src, location.href).origin); } catch {}
        }
      },
      drain() { return queue.splice(0); },
      frames() { return ours().map((f) => f.src); },
    };
  }
  return { drained: window.__obsBridge.drain(), frames: window.__obsBridge.frames() };
})()`;
}

export function sendScript(msg: unknown): string {
  return `window.__obsBridge && window.__obsBridge.send(${JSON.stringify(msg)})`;
}

export class WebviewRelay {
  private timer: ReturnType<typeof setInterval> | null = null;
  private busy = false;
  private readonly bootstrap: string;

  constructor(private readonly opts: RelayOptions) {
    this.bootstrap = bootstrapScript(opts.extensionOrigins, opts.msgKey);
  }

  start() {
    this.timer = setInterval(() => void this.tick(), this.opts.intervalMs ?? 500);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick() {
    if (this.busy) return;
    this.busy = true;
    const status: RelayStatus = { webviews: 0, owlbear: 0, frames: [] };
    try {
      const views = this.opts.findWebviews();
      status.webviews = views.length;
      for (const view of views) {
        let url = "";
        try {
          url = view.getURL();
        } catch {
          continue; // not attached yet
        }
        if (!/^https:\/\/(www\.)?owlbear\.rodeo\//.test(url)) continue;
        status.owlbear++;
        const result = (await view.executeJavaScript(this.bootstrap)) as {
          drained: Record<string, unknown>[];
          frames: string[];
        } | null;
        if (!result) continue;
        status.frames.push(...result.frames);
        const reply = (msg: unknown) => void view.executeJavaScript(sendScript(msg)).catch(() => undefined);
        for (const msg of result.drained) this.opts.onMessage(msg, reply);
      }
    } catch (err) {
      status.error = (err as Error).message;
    } finally {
      this.busy = false;
      this.opts.onStatus(status);
    }
  }
}
