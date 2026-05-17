import { NextResponse } from "next/server";
import { ServiceCategory } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/database/prisma";
import { getDashboardSnapshot } from "@/server/services/snapshots";
import { publishDashboardSnapshot } from "@/server/realtime/status-events";

export const runtime = "nodejs";

const updateServiceSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  category: z.nativeEnum(ServiceCategory).optional(),
  description: z.string().min(3).max(240).optional(),
  homepageUrl: z.string().url().optional().nullable().or(z.literal("")),
  healthCheckUrl: z.string().url().optional().nullable().or(z.literal("")),
  statusPageUrl: z.string().url().optional().nullable().or(z.literal("")),
  apiCheckUrl: z.string().url().optional().nullable().or(z.literal("")),
  regions: z.array(z.string()).optional(),
  enabled: z.boolean().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = updateServiceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные сервиса.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const service = await prisma.service.update({
    where: { id },
    data: {
      ...data,
      homepageUrl: data.homepageUrl === "" ? null : data.homepageUrl,
      healthCheckUrl: data.healthCheckUrl === "" ? null : data.healthCheckUrl,
      statusPageUrl: data.statusPageUrl === "" ? null : data.statusPageUrl,
      apiCheckUrl: data.apiCheckUrl === "" ? null : data.apiCheckUrl
    }
  });

  await prisma.checkLog.create({
    data: {
      serviceId: service.id,
      level: "info",
      source: "admin",
      message: `Обновлены настройки ${service.name}.`
    }
  });
  await publishDashboardSnapshot(await getDashboardSnapshot());

  return NextResponse.json({ ok: true, service });
}
