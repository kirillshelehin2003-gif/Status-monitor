import "@/server/env";
import { prisma } from "@/server/database/prisma";
import { runMonitoringCycle } from "@/server/monitors/monitor-runner";

const schedulerState = globalThis as typeof globalThis & {
  __statusMonitorScheduler?: {
    started: boolean;
    timer?: NodeJS.Timeout;
  };
};

const state = (schedulerState.__statusMonitorScheduler ??= { started: false });

const intervalSeconds = Math.max(15, Number(process.env.MONITOR_INTERVAL_SECONDS ?? 45));

async function tick() {
  const started = Date.now();
  const result = await runMonitoringCycle();
  const durationMs = Date.now() - started;
  await prisma.checkLog.create({
    data: {
      level: result.failed > 0 ? "warn" : "info",
      source: "worker",
      message: `Monitoring cycle finished: ${result.checked} services, ${result.failed} errors, ${durationMs} ms.`,
      meta: { ...result, durationMs }
    }
  });
}

export async function startMonitoringScheduler() {
  if (state.started) return;
  state.started = true;

  await prisma.checkLog.create({
    data: {
      level: "info",
      source: "worker",
      message: `Monitoring scheduler started, interval ${intervalSeconds}s.`
    }
  });

  tick().catch(logCycleError);
  state.timer = setInterval(() => {
    tick().catch(logCycleError);
  }, intervalSeconds * 1000);
}

async function logCycleError(error: unknown) {
  await prisma.checkLog.create({
    data: {
      level: "error",
      source: "worker",
      message: "Monitoring cycle failed.",
      meta: { error: error instanceof Error ? error.message : String(error) }
    }
  });
}
