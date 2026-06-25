import type { Response } from "express";

/**
 * Simple SSE manager — a singleton Set of active response objects.
 * When any mutation happens, call `notifyAll()` to emit an invalidate event
 * to every connected client. The frontend then re-fetches the full state.
 *
 * No persistence, no Redis, no complex state — intentionally simple.
 */

export class SseManager {
  private readonly clients = new Set<Response>();

  subscribe(res: Response): void {
    this.clients.add(res);
    res.on("close", () => {
      this.clients.delete(res);
    });
  }

  notifyAll(): void {
    const data = JSON.stringify({ type: "invalidate" });
    for (const res of this.clients) {
      try {
        res.write(`event: update\ndata: ${data}\n\n`);
      } catch {
        // Client disconnected between the check and the write — safe to ignore
        this.clients.delete(res);
      }
    }
  }

  get clientCount(): number {
    return this.clients.size;
  }
}

// Module-level singleton — one instance per Node.js process
export const sseManager = new SseManager();
