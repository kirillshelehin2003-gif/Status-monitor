import { NextResponse } from "next/server";
import { IncidentSource, ServiceStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/database/prisma";
import { getDashboardSnapshot } from "@/server/services/snapshots";
import { publishDashboardSnapshot } from "@/server/realtime/status-events";

export const runtime = "nodejs";

const incidentSchema = z.object({
  serviceId: z.string().min(1),
  status: z.nativeEnum(ServiceStatus),
  title: z.string().min(3).max(120),
  summary: z.string().min(3).max(800),
  reason: z.string().min(3).max(160),
  regions: z.array(z.string()).default([]),
  minutes: z.number().int().min(15).max(24 * 60).default(120)
});

export async function POST(request: Request) {
  const parsed = incidentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректная отметка инцидента.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const now = new Date();
  const endsAt = new Date(now.getTime() + data.minutes * 60 * 1000);
  const [override, incident] = await prisma.$transaction([
    prisma.manualOverride.create({
      data: {
        serviceId: data.serviceId,
        status: data.status,
        reason: data.reason,
        regions: data.regions,
        startsAt: now,
        endsAt,
        createdBy: "admin"
      }
    }),
    prisma.incident.create({
      data: {
        serviceId: data.serviceId,
        title: data.title,
        status: data.status,
        source: IncidentSource.manual,
        startedAt: now,
        affectedRegions: data.regions,
        suspectedReasons: [data.reason],
        summary: data.summary
      }
    })
  ]);

  await prisma.checkLog.create({
    data: {
      serviceId: data.serviceId,
      level: "warn",
      source: "admin",
      message: `Создана ручная отметка: ${data.title}.`,
      meta: { overrideId: override.id, incidentId: incident.id }
    }
  });
  await publishDashboardSnapshot(await getDashboardSnapshot());

  return NextResponse.json({ ok: true, override, incident });
}
