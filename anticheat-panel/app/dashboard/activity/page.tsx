"use client";

import { useEffect, useState } from "react";
import { Activity, UserPlus, UserMinus, AlertTriangle, ShieldAlert } from "lucide-react";
import { clientBadgeColor, formatTimestamp, cn } from "@/lib/utils";

interface FeedEvent {
  id: string;
  type: string;
  label: string;
  sub: string;
  ts: number;
  client?: string;
}

function eventIcon(type: string) {
  switch (type) {
    case "player_join":  return <UserPlus  className="h-3.5 w-3.5 text-green-400" />;
    case "player_quit":  return <UserMinus className="h-3.5 w-3.5 text-muted-foreground" />;
    case "detection":    return <ShieldAlert className="h-3.5 w-3.5 text-red-400" />;
    case "violation":    return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />;
    default:             return <Activity   className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function eventDot(type: string) {
  switch (type) {
    case "player_join": return "bg-green-400";
    case "player_quit": return "bg-muted-foreground";
    case "detection":   return "bg-red-400";
    case "violation":   return "bg-yellow-400";
    default:            return "bg-muted-foreground";
  }
}

export default function ActivityPage() {
  const [events, setEvents] = useState<FeedEvent[]>([]);

  useEffect(() => {
    const sse = new EventSource("/api/mc/events");
    sse.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        let entry: FeedEvent | null = null;

        if (evt.type === "player_join") {
          entry = {
            id: Math.random().toString(36),
            type: "player_join",
            label: `${evt.payload.name} joined`,
            sub: `${evt.payload.world} · ${evt.payload.ping}ms`,
            ts: evt.ts,
          };
        } else if (evt.type === "player_quit") {
          entry = {
            id: Math.random().toString(36),
            type: "player_quit",
            label: `${evt.payload.name} left`,
            sub: "",
            ts: evt.ts,
          };
        } else if (evt.type === "detection") {
          entry = {
            id: Math.random().toString(36),
            type: "detection",
            label: `${evt.payload.player} flagged`,
            sub: evt.payload.reason as string,
            ts: evt.ts,
            client: evt.payload.client as string,
          };
        } else if (evt.type === "violation") {
          entry = {
            id: Math.random().toString(36),
            type: "violation",
            label: `${evt.payload.player} violation`,
            sub: evt.payload.check as string,
            ts: evt.ts,
          };
        }

        if (entry) {
          setEvents((prev) => [entry!, ...prev].slice(0, 200));
        }
      } catch { /* ignore */ }
    };

    return () => sse.close();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Activity</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live event stream</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Live</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {events.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Waiting for events…</p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[calc(100vh-14rem)] overflow-y-auto">
            {events.map((evt, i) => (
              <div key={evt.id} className="flex items-start gap-3 px-4 py-3 tr-hover">
                {/* Timeline */}
                <div className="relative flex flex-col items-center mt-0.5">
                  <div className={cn("h-2 w-2 rounded-full flex-shrink-0", eventDot(evt.type))} />
                  {i < events.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" style={{ minHeight: "16px" }} />
                  )}
                </div>

                <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {eventIcon(evt.type)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{evt.label}</p>
                      {evt.sub && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{evt.sub}</p>
                      )}
                    </div>
                    {evt.client && (
                      <span className={cn("text-xs px-1.5 py-0 rounded border font-medium flex-shrink-0", clientBadgeColor(evt.client))}>
                        {evt.client}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                    {formatTimestamp(evt.ts)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
