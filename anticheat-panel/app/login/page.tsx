"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error ?? "Invalid password.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-red-600/20 to-transparent blur-xl" />

        <div className="relative rounded-2xl border border-border bg-card p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-600/10 border border-red-600/20">
              <Shield className="h-7 w-7 text-red-500" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                AntiCheat Panel
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Restricted access
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter panel password"
                  autoComplete="current-password"
                  className={cn(
                    "w-full rounded-lg border bg-background/50 px-3 py-2.5 pr-10",
                    "text-sm text-foreground placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-1 focus:ring-ring transition-colors",
                    error ? "border-red-500/50" : "border-border"
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className={cn(
                "w-full rounded-lg py-2.5 text-sm font-medium transition-all",
                "bg-red-600 hover:bg-red-500 text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
