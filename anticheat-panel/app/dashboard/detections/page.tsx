"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Search, Filter } from "lucide-react";
import { clientBadgeColor, formatDate, cn } from "@/lib/utils";

interface Detection {
  id: string;
  player: string;
  client: string;
  reason: string;
  world: string;
  coords: string;
  ping: number;
  action: string;
  ts: number;
}

const CLIENT_FILTERS = ["All", "Wurst", "Meteor", "LiquidBounce", "Other"];

export default function DetectionsPage() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/mc/stats");
      if (!res.ok) return;
      const data = await res.json();
      setDetections(data.recentDetections);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const sse = new EventSource("/api/mc/events");
    sse.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        if (evt.type === "detection") {
          setDetections((prev) => [{ ...evt.payload, id: Math.random().toString(36) }, ...prev]);
        }
      } catch { /* ignore */ }
    };
    return () => sse.close();
  }, [fetchData]);

  const filtered = detections.filter((d) => {
    const matchSearch =
      !search ||
      d.player.toLowerCase().includes(search.toLowerCase()) ||
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.reason.toLowerCase().includes(search.toLowerCase());
    const matchClient =
      clientFilter === "All" ||
      d.client.toLowerCase().includes(clientFilter.toLowerCase());
    return matchSearch && matchClient;
  });

  function actionBadge(action: string) {
    if (action === "BAN") return "bg-red-600/10 text-red-400 border-red-600/20";
    if (action === "KICK") return "bg-orange-600/10 text-orange-400 border-orange-600/20";
    return "bg-muted text-muted-foreground border-border";
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Detections</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{detections.length} total recorded</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player, client, reason…"
            className="w-full rounded-lg border border-border bg-card pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {CLIENT_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setClientFilter(f)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs border transition-colors",
                clientFilter === f
                  ? "bg-accent text-foreground border-border"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Player", "Client", "Reason", "Action", "World", "Ping", "Time"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 mx-auto mb-2 opacity-40" />
                    No detections found
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="tr-hover">
                    <td className="px-4 py-2.5 font-medium">{d.player}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded border font-medium", clientBadgeColor(d.client))}>
                        {d.client}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">{d.reason}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded border font-medium", actionBadge(d.action))}>
                        {d.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{d.world}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums">{d.ping}ms</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums whitespace-nowrap">
                      {formatDate(d.ts)}
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
