/**
 * Server-side singleton that maintains a WebSocket connection to the
 * Minecraft plugin. The plugin connects OUT to this server; commands
 * flow in the other direction.
 *
 * This module is imported by API routes only — never by client components.
 */

import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";

export interface MCEvent {
  type:
    | "player_join"
    | "player_quit"
    | "detection"
    | "violation"
    | "player_list"
    | "stats"
    | "command_result"
    | "pong";
  payload: Record<string, unknown>;
  ts: number;
}

export interface PlayerInfo {
  name: string;
  uuid: string;
  ping: number;
  world: string;
  online: boolean;
  detectedClient?: string;
  violations: number;
  brand: string;
  joinedAt: number;
}

export interface DetectionRecord {
  id: string;
  player: string;
  uuid: string;
  client: string;
  reason: string;
  world: string;
  coords: string;
  ping: number;
  ts: number;
  action: "KICK" | "BAN" | "FLAG";
}

// ---- Singleton state ----

let wss: WebSocketServer | null = null;
let pluginSocket: WebSocket | null = null;
const eventListeners: Set<(evt: MCEvent) => void> = new Set();

// In-memory stores — reset on server restart
export const players: Map<string, PlayerInfo> = new Map();
export const detections: DetectionRecord[] = [];
export const commandLog: Array<{ cmd: string; ts: number; result?: string }> = [];

let serverStats = {
  tps: 20.0,
  onlinePlayers: 0,
  maxPlayers: 20,
  uptime: 0,
  connected: false,
};

// ---- Init ----

export function initWsBridge(): void {
  if (wss) return; // already running

  const port = parseInt(process.env.MC_WS_PORT ?? "25580", 10);
  const token = process.env.MC_WS_TOKEN;

  wss = new WebSocketServer({ port });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    // Validate token from query param
    const url = new URL(req.url ?? "/", `http://localhost`);
    const suppliedToken = url.searchParams.get("token");

    if (!token || suppliedToken !== token) {
      ws.close(4001, "Unauthorized");
      return;
    }

    pluginSocket = ws;
    serverStats.connected = true;

    ws.on("message", (raw) => {
      try {
        const evt: MCEvent = JSON.parse(raw.toString());
        handleEvent(evt);
      } catch { /* malformed */ }
    });

    ws.on("close", () => {
      pluginSocket = null;
      serverStats.connected = false;
      players.forEach((p) => (p.online = false));
    });

    ws.on("error", () => {
      pluginSocket = null;
      serverStats.connected = false;
    });

    // Ask for current player list immediately
    sendCommand("LIST_PLAYERS");
  });
}

// ---- Event handling ----

function handleEvent(evt: MCEvent): void {
  switch (evt.type) {
    case "player_join": {
      const p = evt.payload as unknown as PlayerInfo;
      players.set(p.uuid, { ...p, online: true });
      serverStats.onlinePlayers = [...players.values()].filter((x) => x.online).length;
      break;
    }
    case "player_quit": {
      const { uuid } = evt.payload as { uuid: string };
      const p = players.get(uuid);
      if (p) p.online = false;
      serverStats.onlinePlayers = [...players.values()].filter((x) => x.online).length;
      break;
    }
    case "detection": {
      const d = evt.payload as unknown as DetectionRecord;
      detections.unshift({ ...d, id: crypto.randomUUID() });
      if (detections.length > 500) detections.pop();
      // Update player record
      const p = players.get(d.uuid);
      if (p) { p.detectedClient = d.client; p.violations++; }
      break;
    }
    case "player_list": {
      const list = evt.payload.players as PlayerInfo[];
      list.forEach((p) => players.set(p.uuid, p));
      serverStats.onlinePlayers = list.filter((p) => p.online).length;
      break;
    }
    case "stats": {
      const s = evt.payload as { tps: number; online: number; max: number; uptime: number };
      serverStats.tps = s.tps;
      serverStats.onlinePlayers = s.online;
      serverStats.maxPlayers = s.max;
      serverStats.uptime = s.uptime;
      break;
    }
    case "command_result": {
      const { cmdId, output } = evt.payload as { cmdId: string; output: string };
      const entry = commandLog.find((c) => (c as { id?: string }).id === cmdId);
      if (entry) entry.result = output;
      break;
    }
  }

  // Broadcast to all SSE listeners
  eventListeners.forEach((fn) => fn(evt));
}

// ---- Public API ----

export function sendCommand(command: string): boolean {
  if (!pluginSocket || pluginSocket.readyState !== WebSocket.OPEN) return false;
  const id = crypto.randomUUID();
  pluginSocket.send(JSON.stringify({ type: "command", command, id }));
  commandLog.unshift({ cmd: command, ts: Date.now(), result: undefined });
  if (commandLog.length > 200) commandLog.pop();
  return true;
}

export function getStats() {
  return { ...serverStats };
}

export function addEventListeners(fn: (evt: MCEvent) => void): () => void {
  eventListeners.add(fn);
  return () => eventListeners.delete(fn);
}

export function isConnected(): boolean {
  return pluginSocket !== null && pluginSocket.readyState === WebSocket.OPEN;
}
