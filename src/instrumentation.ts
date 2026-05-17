export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_IN_PROCESS_MONITOR === "true") return;

  const { startMonitoringScheduler } = await import("@/server/monitors/scheduler");
  await startMonitoringScheduler();
}
