import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/blog-ai-settings";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corps invalide." }, { status: 400 });

  const theme: string | null = typeof body.theme === "string" && body.theme.trim()
    ? body.theme.trim().slice(0, 2000)
    : null;
  const autoPublish = Boolean(body.auto_publish);

  await saveSettings({ theme, auto_publish: autoPublish });
  return NextResponse.json(await getSettings());
}
