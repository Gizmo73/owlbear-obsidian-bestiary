// Local HTTP + WebSocket server the Owlbear extension connects to.
// Kept free of any `obsidian` import so it can be exercised from plain Node.

import http from "node:http";
import { WebSocketServer, type WebSocket } from "ws";

export interface BridgeServerOptions {
  port: number;
  /** Origins (scheme://host:port) allowed to call /ping and open the socket. */
  allowedOrigins: string[];
  version: string;
  onMessage: (msg: Record<string, unknown>, reply: (msg: unknown) => void) => void | Promise<void>;
  onLog: (line: string) => void;
  onClientsChanged?: (count: number) => void;
}

export interface BridgeServer {
  close(): Promise<void>;
  broadcast(msg: unknown): void;
  readonly listening: Promise<void>;
}

export function startBridgeServer(opts: BridgeServerOptions): BridgeServer {
  const validHosts = new Set([`127.0.0.1:${opts.port}`, `localhost:${opts.port}`]);
  const clients = new Set<WebSocket>();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${opts.port}`);
    const origin = req.headers.origin;

    // DNS-rebinding guard: only answer requests addressed to the loopback host.
    if (!validHosts.has(req.headers.host ?? "")) {
      res.writeHead(421).end("wrong host");
      return;
    }

    if (url.pathname === "/ping") {
      if (origin && !opts.allowedOrigins.includes(origin)) {
        opts.onLog(`rejected /ping from origin ${origin}`);
        res.writeHead(403).end("origin not allowed");
        return;
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Private-Network": "true",
      };
      if (origin) {
        headers["Access-Control-Allow-Origin"] = origin;
        headers["Vary"] = "Origin";
      }
      if (req.method === "OPTIONS") {
        headers["Access-Control-Allow-Methods"] = "GET";
        headers["Access-Control-Allow-Headers"] = "*";
        res.writeHead(204, headers).end();
        return;
      }
      res.writeHead(200, headers).end(
        JSON.stringify({ ok: true, plugin: "owlbear-bestiary-bridge", version: opts.version }),
      );
      return;
    }

    res.writeHead(404).end("not found");
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const origin = req.headers.origin ?? "";
    const path = new URL(req.url ?? "/", "http://x").pathname;
    if (path !== "/ws" || !validHosts.has(req.headers.host ?? "") || !opts.allowedOrigins.includes(origin)) {
      opts.onLog(`rejected websocket from origin "${origin}" path ${path}`);
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      clients.add(ws);
      opts.onClientsChanged?.(clients.size);
      opts.onLog(`websocket connected from ${origin}`);
      const reply = (msg: unknown) => {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
      };
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(String(data));
          if (msg && typeof msg === "object") void opts.onMessage(msg, reply);
        } catch {
          opts.onLog("ignored non-JSON websocket message");
        }
      });
      ws.on("close", () => {
        clients.delete(ws);
        opts.onClientsChanged?.(clients.size);
        opts.onLog(`websocket closed (${origin})`);
      });
    });
  });

  const listening = new Promise<void>((resolve, reject) => {
    server.once("error", (err: NodeJS.ErrnoException) => {
      opts.onLog(
        err.code === "EADDRINUSE"
          ? `port ${opts.port} is already in use; the bridge could not start`
          : `server error: ${err.message}`,
      );
      reject(err);
    });
    server.listen(opts.port, "127.0.0.1", () => {
      opts.onLog(`listening on http://127.0.0.1:${opts.port}`);
      resolve();
    });
  });
  listening.catch(() => undefined);

  return {
    listening,
    broadcast(msg) {
      const text = JSON.stringify(msg);
      for (const ws of clients) if (ws.readyState === ws.OPEN) ws.send(text);
    },
    close() {
      for (const ws of clients) ws.terminate();
      wss.close();
      return new Promise((resolve) => server.close(() => resolve()));
    },
  };
}
