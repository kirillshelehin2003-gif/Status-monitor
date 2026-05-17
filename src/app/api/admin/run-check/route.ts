import { NextResponse } from "next/server";
import { prisma } from "@/server/database/prisma";
import { runMonitoringCycle, runServiceCheck } from "@/server/monitors/monitor-runner";
import { getDashboardSnapshot } from "@/server/services/snapshots";
import { publishDashboardSnapshot } from "@/server/realtime/status-events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.serviceId === "string" && body.serviceId.length > 0) {
    const service = await prisma.service.findUnique({ where: { id: body.serviceId } });
    if (!service) {
      return NextResponse.json({ message: "Сервис не найден." }, { status: 404 });
    }
    const check = await runServiceCheck(service);
    await publishDashboardSnapshot(await getDashboardSnapshot());
    return NextResponse.json({ ok: true, checkId: check.id });
  }

  const result = await runMonitoringCycle();
  return NextResponse.json({ ok: true, ...result });
}
