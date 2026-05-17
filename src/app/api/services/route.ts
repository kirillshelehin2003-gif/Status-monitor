import { NextResponse } from "next/server";
import { getDashboardSnapshot } from "@/server/services/snapshots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getDashboardSnapshot();
  return NextResponse.json(snapshot);
}
