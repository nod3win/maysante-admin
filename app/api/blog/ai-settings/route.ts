import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSettings, saveSettings, ALL_DAYS, type DayCode } from "@/lib/blog-ai-settings";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corps invalide." }, { status: 400 });

  const enabled = Boolean(body.enabled);
  const days: DayCode[] = Array.isArray(body.days_of_week)
    ? body.days_of_week.filter((d: unknown): d is DayCode =>
        typeof d === "string" && (ALL_DAYS as string[]).includes(d)
      )
    : [];
  const theme: string | null = typeof body.theme === "string" && body.theme.trim()
    ? body.theme.trim().slice(0, 2000)
    : null;

  if (enabled && days.length === 0) {
    return NextResponse.json(
      { error: "Activez au moins un jour pour la génération automatique." },
      { status: 400 }
    );
  }

  await saveSettings({ enabled, days_of_week: days, theme });
  return NextResponse.json(await getSettings());
}
