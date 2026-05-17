import "@/server/env";
import { prisma } from "@/server/database/prisma";
import { runMonitoringCycle } from "@/server/monitors/monitor-runner";

const intervalSeconds = Math.max(15, Number(process.env.MONITOR_INTERVAL_SECONDS ?? 45));

async function tick() {
  const started = Date.now();
  const result = await runMonitoringCycle();
  const durationMs = Date.now() - started;
  await prisma.checkLog.create({
    data: {
      level: result.failed > 0 ? "warn" : "info",
      source: "worker",
      message: `Цикл мониторинга завершен: ${result.checked} сервисов, ошибок ${result.failed}, ${durationMs} мс.`,
      meta: { ...result, durationMs }
    }
  });
}

async function main() {
  await prisma.checkLog.create({
    data: {
      level: "info",
      source: "worker",
      message: `Monitoring worker started, interval ${intervalSeconds}s.`
    }
  });

  await tick();
  setInterval(() => {
    tick().catch(async (error) => {
      await prisma.checkLog.create({
        data: {
          level: "error",
          source: "worker",
          message: "Monitoring cycle failed.",
          meta: { error: error instanceof Error ? error.message : String(error) }
        }
      });
    });
  }, intervalSeconds * 1000);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
