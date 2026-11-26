// WebSocket client to the Obsidian plugin, with request/response and auto-reconnect.

import {
  MIN_PROTOCOL_VERSION,
  PROTOCOL_VERSION,
  type Push,
  type Request,
  type ResponseEnvelope,
  type ResponseFor,
  type Welcome,
} from "../shared/protocol";

interface Handlers {
  onConnected(welcome: Welcome): void;
  onDisconnected(error: string): void;
  onConnecting(): void;
  onPush(push: Push): void;
}

export class BridgeClient {
  private ws: WebSocket | null = null;
  private nextId = 1;
  private pending = new Map<number, { resolve(v: unknown): void; reject(e: Error): void }>();
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;
  private stopped = false;

  constructor(
    private readonly port: () => number,
    private readonly player: () => string,
    private readonly handlers: Handlers,
  ) {}

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  start() {
    this.stopped = false;
    this.connect();
  }

  stop() {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ws?.close();
  }

  /** Drop the current socket (if any) and connect again straight away. */
  reconnect() {
    this.failures = 0;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    const old = this.ws;
    this.ws = null;
    old?.close();
    this.connect();
  }

  request<R extends Request>(req: R, timeoutMs = 10000): Promise<ResponseFor<R>> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("not connected to Obsidian"));
    }
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, ...req }));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Obsidian did not answer "${req.kind}"`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v as ResponseFor<R>);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
    });
  }

  private connect() {
    if (this.stopped) return;
    this.handlers.onConnecting();
    let ws: WebSocket;
    try {
      ws = new WebSocket(`ws://127.0.0.1:${this.port()}/ws`);
    } catch (err) {
      this.scheduleRetry((err as Error).message);
      return;
    }
    this.ws = ws;
    let opened = false;

    ws.onopen = async () => {
      opened = true;
      this.failures = 0;
      try {
        const welcome = await this.request({ kind: "hello", protocol: PROTOCOL_VERSION, player: this.player() });
        if (welcome.protocol < MIN_PROTOCOL_VERSION) {
          this.handlers.onDisconnected("the Obsidian plugin is too old: update Owlbear Bestiary Bridge");
          ws.close();
          return;
        }
        this.handlers.onConnected(welcome);
      } catch (err) {
        this.handlers.onDisconnected((err as Error).message);
      }
    };

    ws.onmessage = (e) => {
      let msg: ResponseEnvelope | Push;
      try {
        msg = JSON.parse(String(e.data));
      } catch {
        return;
      }
      if ("push" in msg) {
        this.handlers.onPush(msg);
        return;
      }
      const waiter = this.pending.get(msg.id);
      if (!waiter) return;
      this.pending.delete(msg.id);
      if (msg.ok) waiter.resolve(msg.result);
      else waiter.reject(new Error(msg.error));
    };

    ws.onclose = () => {
      if (this.ws !== ws) return; // replaced by reconnect()
      this.ws = null;
      for (const w of this.pending.values()) w.reject(new Error("connection closed"));
      this.pending.clear();
      this.scheduleRetry(opened ? "connection to Obsidian closed" : "Obsidian not reachable");
    };
  }

  private scheduleRetry(reason: string) {
    if (this.stopped) return;
    this.failures++;
    this.handlers.onDisconnected(reason);
    const delay = Math.min(15000, 2000 * this.failures);
    this.retryTimer = setTimeout(() => this.connect(), delay);
  }
}
