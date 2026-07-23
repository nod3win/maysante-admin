import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { listArticles, createArticle, type ArticleStatus } from "@/lib/articles";
import { sanitizeBody } from "@/lib/ai-generator";

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const status = req.nextUrl.searchParams.get("status") as ArticleStatus | "all" | null;
  const items = await listArticles({ status: status ?? "all" });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || typeof body.body !== "string") {
    return NextResponse.json({ error: "Titre et contenu requis." }, { status: 400 });
  }
  if (body.title.trim().length < 3) {
    return NextResponse.json({ error: "Le titre est trop court." }, { status: 400 });
  }

  const status: ArticleStatus = body.status === "published" ? "published" : "draft";

  const created = await createArticle({
    title: body.title.trim(),
    slug: typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : undefined,
    excerpt: typeof body.excerpt === "string" ? body.excerpt.trim().slice(0, 500) : null,
    body: sanitizeBody(body.body),
    status,
  });

  return NextResponse.json(created, { status: 201 });
}
