import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getStats, players, detections, initWsBridge } from "@/lib/ws-bridge";

initWsBridge();

export async function GET() {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = getStats();
  const onlinePlayers = [...players.values()].filter((p) => p.online);
  const recentDetections = detections.slice(0, 50);

  return NextResponse.json({
    stats,
    players: onlinePlayers,
    recentDetections,
  });
}
