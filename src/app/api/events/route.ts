import { getCachedDashboardSnapshot, createRedisSubscriber, statusEventBus, statusUpdatesChannel } from "@/server/realtime/status-events";
import { getDashboardSnapshot } from "@/server/services/snapshots";
import type { DashboardSnapshotDto } from "@/types/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, payload: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      const sendSnapshot = (snapshot: DashboardSnapshotDto) => send("snapshot", snapshot);
      const onSnapshot = (snapshot: DashboardSnapshotDto) => sendSnapshot(snapshot);
      statusEventBus.on("snapshot", onSnapshot);

      const subscriber = createRedisSubscriber();
      if (subscriber) {
        subscriber.on("message", (_channel, payload) => {
          try {
            sendSnapshot(JSON.parse(payload) as DashboardSnapshotDto);
          } catch {
            send("error", { message: "Не удалось разобрать Redis payload." });
          }
        });
        subscriber.on("error", () => {
          send("notice", { message: "Redis недоступен, SSE продолжит polling." });
        });
        try {
          await subscriber.connect();
          await subscriber.subscribe(statusUpdatesChannel);
        } catch {
          send("notice", { message: "Redis подписка недоступна, SSE работает через polling." });
        }
      }

      const initial = (await getCachedDashboardSnapshot()) ?? (await getDashboardSnapshot());
      sendSnapshot(initial);

      const interval = setInterval(async () => {
        try {
          sendSnapshot(await getDashboardSnapshot());
        } catch {
          send("error", { message: "Не удалось обновить snapshot." });
        }
      }, 15_000);

      const cleanup = () => {
        closed = true;
        clearInterval(interval);
        statusEventBus.off("snapshot", onSnapshot);
        if (subscriber) {
          subscriber.disconnect();
        }
        try {
          controller.close();
        } catch {
          // stream can already be closed by the browser
        }
      };

      request.signal.addEventListener("abort", cleanup, { once: true });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
