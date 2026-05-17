import { NextResponse } from "next/server";
import { getServiceDetail } from "@/server/services/snapshots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getServiceDetail(slug);
  if (!detail) {
    return NextResponse.json({ message: "Сервис не найден." }, { status: 404 });
  }
  return NextResponse.json(detail);
}
