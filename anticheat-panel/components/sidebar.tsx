"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Users,
  AlertTriangle,
  Terminal,
  LogOut,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",            label: "Overview",    icon: LayoutDashboard },
  { href: "/dashboard/players",    label: "Players",     icon: Users },
  { href: "/dashboard/detections", label: "Detections",  icon: AlertTriangle },
  { href: "/dashboard/console",    label: "Console",     icon: Terminal },
  { href: "/dashboard/activity",   label: "Activity",    icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card/50">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/15 border border-red-600/20">
          <Shield className="h-4 w-4 text-red-500" />
        </div>
        <span className="text-sm font-semibold tracking-tight">AC Panel</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
