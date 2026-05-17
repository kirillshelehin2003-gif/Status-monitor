import "../src/server/env";
import { prisma } from "../src/server/database/prisma";
import { runMonitoringCycle } from "../src/server/monitors/monitor-runner";

async function main() {
  await prisma.$transaction([
    prisma.healthCheck.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.userReport.deleteMany(),
    prisma.searchTrend.deleteMany(),
    prisma.manualOverride.deleteMany(),
    prisma.checkLog.deleteMany()
  ]);

  console.log("Runtime history cleared. Running first real monitoring cycle...");
  const result = await runMonitoringCycle();
  console.log(`Runtime history restarted: checked=${result.checked}, failed=${result.failed}.`);
}

let exitCode = 0;

main()
  .catch((error) => {
    console.error(error);
    exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(exitCode);
  });
