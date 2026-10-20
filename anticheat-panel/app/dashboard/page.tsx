"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, AlertTriangle, Activity, Wifi, WifiOff, Zap, Clock,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { clientBadgeColor, formatTimestamp, cn } from "@/lib/utils";

interface Stats {
  tps: number;
  onlinePlayers: number;
  maxPlayers: number;
  uptime: number;
  connected: boolean;
}

interface Detection {
  id: string;
  player: string;
  client: string;
  reason: string;
  world: string;
  coords: string;
  ping: number;
  ts: number;
}

interface Player {
  name: string;
  uuid: string;
  ping: number;
  world: string;
  detectedClient?: string;
  violations: number;
  brand: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/mc/stats");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats);
      setPlayers(data.players);
      setDetections(data.recentDetections);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);

    // SSE for live detections
    const sse = new EventSource("/api/mc/events");
    sse.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        if (evt.type === "detection") {
          setDetections((prev) => [{ ...evt.payload, id: Math.random().toString(36) }, ...prev].slice(0, 50));
        }
        if (evt.type === "player_join" || evt.type === "player_quit" || evt.type === "stats") {
          fetchData();
        }
      } catch { /* ignore */ }
    };

    return () => {
      clearInterval(interval);
      sse.close();
    };
  }, [fetchData]);

  function tpsColor(tps: number) {
    if (tps >= 19) return "text-green-400";
    if (tps >= 15) return "text-yellow-400";
    return "text-red-400";
  }

  function formatUptime(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live server status</p>
        </div>
        <div className="flex items-center gap-1.5">
          {stats?.connected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs text-green-400 font-medium">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs text-red-400 font-medium">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Online Players"
          value={`${stats?.onlinePlayers ?? 0} / ${stats?.maxPlayers ?? 0}`}
          icon={Users}
          accent="blue"
        />
        <StatCard
          label="TPS"
          value={stats?.tps.toFixed(1) ?? "—"}
          icon={Zap}
          accent={stats ? (stats.tps >= 19 ? "green" : stats.tps >= 15 ? "yellow" : "red") : "default"}
          sub="Target: 20.0"
        />
        <StatCard
          label="Total Detections"
          value={detections.length}
          icon={AlertTriangle}
          accent="red"
        />
        <StatCard
          label="Uptime"
          value={stats ? formatUptime(stats.uptime) : "—"}
          icon={Clock}
          accent="default"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Online players */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">Online Players</h2>
            <span className="text-xs text-muted-foreground">{players.length} online</span>
          </div>
          <div className="divide-y divide-border">
            {players.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">No players online</p>
            ) : (
              players.map((p) => (
                <div key={p.uuid} className="flex items-center justify-between px-4 py-2.5 tr-hover">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar placeholder */}
                    <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center text-xs font-medium">
                      {p.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.world} · {p.ping}ms</p>
                    </div>
                  </div>
                  {p.detectedClient ? (
                    <span className={cn("text-xs px-2 py-0.5 rounded-md border font-medium", clientBadgeColor(p.detectedClient))}>
                      {p.detectedClient}
                    </span>
                  ) : (
                    <span className="text-xs text-green-400/70">Clean</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent detections */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">Recent Detections</h2>
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {detections.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">No detections yet</p>
            ) : (
              detections.slice(0, 20).map((d) => (
                <div key={d.id} className="px-4 py-2.5 tr-hover">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{d.player}</span>
                        <span className={cn("text-xs px-1.5 py-0 rounded border font-medium flex-shrink-0", clientBadgeColor(d.client))}>
                          {d.client}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{d.reason}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                      {formatTimestamp(d.ts)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
