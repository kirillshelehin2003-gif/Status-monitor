import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/database/prisma";

export const runtime = "nodejs";

const reportSchema = z.object({
  serviceId: z.string().min(1),
  region: z.string().max(80).optional(),
  reason: z.string().min(2).max(120),
  message: z.string().max(500).optional()
});

export async function POST(request: Request) {
  const payload = reportSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ message: "Некорректная жалоба.", issues: payload.error.flatten() }, { status: 400 });
  }

  const report = await prisma.userReport.create({ data: payload.data });
  return NextResponse.json({ ok: true, reportId: report.id });
}
