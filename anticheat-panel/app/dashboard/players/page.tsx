"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search, Ban, Swords, RefreshCw } from "lucide-react";
import { clientBadgeColor, cn } from "@/lib/utils";

interface Player {
  name: string;
  uuid: string;
  ping: number;
  world: string;
  detectedClient?: string;
  violations: number;
  brand: string;
  online: boolean;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [cmdStatus, setCmdStatus] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/mc/stats");
      if (!res.ok) return;
      const data = await res.json();
      setPlayers(data.players);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    const sse = new EventSource("/api/mc/events");
    sse.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        if (["player_join", "player_quit", "detection"].includes(evt.type)) fetchData();
      } catch { /* ignore */ }
    };
    return () => { clearInterval(interval); sse.close(); };
  }, [fetchData]);

  async function sendCmd(player: string, cmd: string) {
    setCmdStatus((s) => ({ ...s, [player]: "sending…" }));
    const res = await fetch("/api/mc/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: cmd }),
    });
    setCmdStatus((s) => ({ ...s, [player]: res.ok ? "sent" : "failed" }));
    setTimeout(() => setCmdStatus((s) => { const n = { ...s }; delete n[player]; return n; }), 2000);
  }

  const filtered = players.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Players</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {players.filter((p) => p.online).length} online
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players…"
          className="w-full max-w-xs rounded-lg border border-border bg-card pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Player", "Status", "Brand", "Client", "Violations", "World", "Ping", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    <Users className="h-4 w-4 mx-auto mb-2 opacity-40" />
                    No players found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.uuid} className="tr-hover">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {p.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn(
                        "inline-flex h-1.5 w-1.5 rounded-full mr-1.5",
                        p.online ? "bg-green-400" : "bg-muted-foreground"
                      )} />
                      <span className="text-xs text-muted-foreground">{p.online ? "Online" : "Offline"}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{p.brand}</td>
                    <td className="px-4 py-2.5">
                      {p.detectedClient ? (
                        <span className={cn("text-xs px-1.5 py-0.5 rounded border font-medium", clientBadgeColor(p.detectedClient))}>
                          {p.detectedClient}
                        </span>
                      ) : (
                        <span className="text-xs text-green-400/70">Clean</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn(
                        "text-xs tabular-nums font-medium",
                        p.violations > 0 ? "text-red-400" : "text-muted-foreground"
                      )}>
                        {p.violations}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.world}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">{p.ping}ms</td>
                    <td className="px-4 py-2.5">
                      {cmdStatus[p.name] ? (
                        <span className="text-xs text-muted-foreground">{cmdStatus[p.name]}</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            title="Kick"
                            onClick={() => sendCmd(p.name, `kick ${p.name} Kicked by admin`)}
                            className="rounded p-1 text-muted-foreground hover:text-orange-400 hover:bg-orange-400/10 transition-colors"
                          >
                            <Swords className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Ban"
                            onClick={() => sendCmd(p.name, `ban ${p.name} Banned by admin`)}
                            className="rounded p-1 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
