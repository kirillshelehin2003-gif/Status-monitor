import { NextResponse } from "next/server";
import { getAdminSnapshot } from "@/server/services/snapshots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getAdminSnapshot());
}
