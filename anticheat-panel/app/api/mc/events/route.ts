import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { addEventListeners, initWsBridge, MCEvent } from "@/lib/ws-bridge";

initWsBridge();

export async function GET() {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send a heartbeat comment every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch { clearInterval(heartbeat); }
      }, 15_000);

      const unsub = addEventListeners((evt: MCEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
        } catch { /* closed */ }
      });

      // Cleanup when client disconnects
      return () => {
        clearInterval(heartbeat);
        unsub();
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
