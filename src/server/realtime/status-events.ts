import { EventEmitter } from "node:events";
import Redis from "ioredis";
import type { DashboardSnapshotDto } from "@/types/status";

const CHANNEL = "status-monitor:updates";
const CACHE_KEY = "status-monitor:dashboard";

const globalRealtime = globalThis as unknown as {
  statusEventBus?: EventEmitter;
  redisPublisher?: Redis;
};

export const statusEventBus = globalRealtime.statusEventBus ?? new EventEmitter();
statusEventBus.setMaxListeners(200);
globalRealtime.statusEventBus = statusEventBus;

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false
  });
  client.on("error", () => {
    // Redis is optional in local dev. SSE falls back to polling/global events.
  });
  return client;
}

export function getRedisPublisher(): Redis | null {
  if (globalRealtime.redisPublisher === undefined) {
    const client = createRedisClient();
    globalRealtime.redisPublisher = client ?? undefined;
  }
  return globalRealtime.redisPublisher ?? null;
}

export async function publishDashboardSnapshot(snapshot: DashboardSnapshotDto): Promise<void> {
  statusEventBus.emit("snapshot", snapshot);

  const redis = getRedisPublisher();
  if (!redis) return;

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }
    const payload = JSON.stringify(snapshot);
    await redis.set(CACHE_KEY, payload, "EX", 90);
    await redis.publish(CHANNEL, payload);
  } catch {
    // Keep monitoring alive even if Redis is temporarily unavailable.
  }
}

export async function getCachedDashboardSnapshot(): Promise<DashboardSnapshotDto | null> {
  const redis = getRedisPublisher();
  if (!redis) return null;

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }
    const cached = await redis.get(CACHE_KEY);
    return cached ? (JSON.parse(cached) as DashboardSnapshotDto) : null;
  } catch {
    return null;
  }
}

export function createRedisSubscriber(): Redis | null {
  return createRedisClient();
}

export const statusUpdatesChannel = CHANNEL;
