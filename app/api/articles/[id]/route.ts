import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getArticle, updateArticle, deleteArticle, type ArticleStatus } from "@/lib/articles";
import { sanitizeBody } from "@/lib/ai-generator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return NextResponse.json({ error: "ID invalide." }, { status: 400 });

  const article = await getArticle(numericId);
  if (!article) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return NextResponse.json({ error: "ID invalide." }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corps invalide." }, { status: 400 });

  const patch: Parameters<typeof updateArticle>[1] = {};
  if (typeof body.title === "string") {
    if (body.title.trim().length < 3) return NextResponse.json({ error: "Titre trop court." }, { status: 400 });
    patch.title = body.title.trim();
  }
  if (typeof body.slug === "string" && body.slug.trim()) patch.slug = body.slug.trim();
  if (body.excerpt === null || typeof body.excerpt === "string") {
    patch.excerpt = body.excerpt ? String(body.excerpt).trim().slice(0, 500) : null;
  }
  if (typeof body.body === "string") patch.body = sanitizeBody(body.body);
  if (body.status === "draft" || body.status === "published") {
    patch.status = body.status as ArticleStatus;
  }

  const updated = await updateArticle(numericId, patch);
  if (!updated) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return NextResponse.json({ error: "ID invalide." }, { status: 400 });

  const ok = await deleteArticle(numericId);
  if (!ok) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
