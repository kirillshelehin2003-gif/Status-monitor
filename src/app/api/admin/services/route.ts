import { NextResponse } from "next/server";
import { ServiceCategory } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/database/prisma";
import { getDashboardSnapshot } from "@/server/services/snapshots";
import { publishDashboardSnapshot } from "@/server/realtime/status-events";

export const runtime = "nodejs";

const createServiceSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  category: z.nativeEnum(ServiceCategory),
  description: z.string().min(3).max(240),
  homepageUrl: z.string().url().optional().or(z.literal("")),
  healthCheckUrl: z.string().url().optional().or(z.literal("")),
  statusPageUrl: z.string().url().optional().or(z.literal("")),
  apiCheckUrl: z.string().url().optional().or(z.literal("")),
  regions: z.array(z.string()).default([]),
  enabled: z.boolean().default(true)
});

export async function POST(request: Request) {
  const parsed = createServiceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные сервиса.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const service = await prisma.service.create({
    data: {
      ...data,
      homepageUrl: data.homepageUrl || null,
      healthCheckUrl: data.healthCheckUrl || null,
      statusPageUrl: data.statusPageUrl || null,
      apiCheckUrl: data.apiCheckUrl || null
    }
  });

  await prisma.checkLog.create({
    data: {
      serviceId: service.id,
      level: "info",
      source: "admin",
      message: `Добавлен сервис ${service.name}.`
    }
  });
  await publishDashboardSnapshot(await getDashboardSnapshot());

  return NextResponse.json({ ok: true, service });
}
