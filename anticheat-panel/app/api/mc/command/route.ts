import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendCommand, initWsBridge } from "@/lib/ws-bridge";

initWsBridge();

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { command } = await req.json();
  if (!command || typeof command !== "string") {
    return NextResponse.json({ error: "command required" }, { status: 400 });
  }

  const sent = sendCommand(command.trim());
  if (!sent) {
    return NextResponse.json({ error: "MC server not connected" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
