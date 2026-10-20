"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Terminal, Send, Trash2, ChevronRight } from "lucide-react";
import { formatTimestamp, cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  cmd: string;
  ts: number;
  result?: string;
  status: "pending" | "sent" | "failed";
}

const QUICK_CMDS = [
  { label: "List Players", cmd: "list" },
  { label: "Save World",   cmd: "save-all" },
  { label: "Reload AC",    cmd: "anticheat reload" },
  { label: "TPS",          cmd: "tps" },
];

export default function ConsolePage() {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  async function run(cmd: string) {
    if (!cmd.trim()) return;
    setSending(true);

    const entry: LogEntry = {
      id: Math.random().toString(36),
      cmd: cmd.trim(),
      ts: Date.now(),
      status: "pending",
    };

    setLog((prev) => [...prev, entry]);
    setHistory((prev) => [cmd.trim(), ...prev].slice(0, 50));
    setHistIdx(-1);

    try {
      const res = await fetch("/api/mc/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd.trim() }),
      });

      setLog((prev) =>
        prev.map((e) =>
          e.id === entry.id
            ? { ...e, status: res.ok ? "sent" : "failed", result: res.ok ? undefined : "MC server not connected" }
            : e
        )
      );
    } catch {
      setLog((prev) =>
        prev.map((e) => e.id === entry.id ? { ...e, status: "failed", result: "Network error" } : e)
      );
    }

    setSending(false);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? "" : history[next]);
    }
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Console</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Commands run silently — nothing appears in server console or chat
        </p>
      </div>

      {/* Quick commands */}
      <div className="flex flex-wrap gap-2">
        {QUICK_CMDS.map(({ label, cmd }) => (
          <button
            key={cmd}
            onClick={() => run(cmd)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Log */}
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-[hsl(224,71%,3%)] overflow-y-auto font-mono text-xs p-4 space-y-2">
        {log.length === 0 ? (
          <p className="text-muted-foreground/40">
            // No commands yet. Type a command below or use a quick action.
          </p>
        ) : (
          log.map((entry) => (
            <div key={entry.id} className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground/50 tabular-nums flex-shrink-0">
                  {formatTimestamp(entry.ts)}
                </span>
                <ChevronRight className="h-3 w-3 text-red-500 flex-shrink-0" />
                <span className="text-foreground">{entry.cmd}</span>
                <span className={cn(
                  "ml-auto flex-shrink-0 text-xs",
                  entry.status === "sent"    ? "text-green-400/70" :
                  entry.status === "failed"  ? "text-red-400/70"   :
                  "text-yellow-400/70"
                )}>
                  {entry.status}
                </span>
              </div>
              {entry.result && (
                <p className="pl-[calc(7ch+1rem)] text-muted-foreground">{entry.result}</p>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Enter command… (↑↓ for history)"
            className="w-full rounded-lg border border-border bg-card pl-8 pr-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => { run(input); setInput(""); }}
          disabled={!input.trim() || sending}
          className="rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 px-3 py-2.5 text-white transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
        <button
          onClick={() => setLog([])}
          className="rounded-lg border border-border px-3 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
