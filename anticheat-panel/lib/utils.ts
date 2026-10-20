import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function clientColor(client: string): string {
  const c = client.toLowerCase();
  if (c.includes("wurst"))  return "text-yellow-400";
  if (c.includes("meteor")) return "text-purple-400";
  if (c.includes("liquid")) return "text-blue-400";
  if (c.includes("future")) return "text-cyan-400";
  return "text-red-400";
}

export function clientBadgeColor(client: string): string {
  const c = client.toLowerCase();
  if (c.includes("wurst"))  return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  if (c.includes("meteor")) return "bg-purple-500/10 text-purple-400 border-purple-500/30";
  if (c.includes("liquid")) return "bg-blue-500/10  text-blue-400  border-blue-500/30";
  if (c.includes("future")) return "bg-cyan-500/10  text-cyan-400  border-cyan-500/30";
  return "bg-red-500/10 text-red-400 border-red-500/30";
}
