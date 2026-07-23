import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getStats, type StatsRange } from "@/lib/stats";

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const raw = Number(req.nextUrl.searchParams.get("days"));
  const days: StatsRange = raw === 7 || raw === 90 ? raw : 30;

  return NextResponse.json(await getStats(days));
}
