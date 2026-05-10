import pool from "./db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export type ArticleStatus = "draft" | "published";

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  status: ArticleStatus;
  generated_by_ai: number;
  ai_topic: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ArticleListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: ArticleStatus;
  generated_by_ai: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

export async function ensureUniqueSlug(base: string, excludeId?: number): Promise<string> {
  let slug = base || "article";
  let i = 1;
  while (true) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM articles WHERE slug = ? LIMIT 1",
      [slug]
    );
    const found = rows[0];
    if (!found || (excludeId !== undefined && found.id === excludeId)) return slug;
    i++;
    slug = `${base}-${i}`;
  }
}

export async function listArticles(opts?: { status?: ArticleStatus | "all" }): Promise<ArticleListItem[]> {
  const status = opts?.status ?? "all";
  const where = status === "all" ? "" : "WHERE status = ?";
  const params = status === "all" ? [] : [status];
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, title, slug, excerpt, status, generated_by_ai, created_at, updated_at, published_at
     FROM articles
     ${where}
     ORDER BY updated_at DESC`,
    params
  );
  return rows as ArticleListItem[];
}

export async function getArticle(id: number): Promise<Article | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM articles WHERE id = ? LIMIT 1",
    [id]
  );
  return (rows[0] as Article) ?? null;
}

export async function createArticle(data: {
  title: string;
  body: string;
  excerpt?: string | null;
  status?: ArticleStatus;
  generated_by_ai?: boolean;
  ai_topic?: string | null;
  slug?: string;
}): Promise<Article> {
  const baseSlug = slugify(data.slug ?? data.title);
  const slug = await ensureUniqueSlug(baseSlug);
  const status = data.status ?? "draft";
  const publishedAt = status === "published" ? new Date() : null;

  const [res] = await pool.query<ResultSetHeader>(
    `INSERT INTO articles (title, slug, excerpt, body, status, generated_by_ai, ai_topic, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      slug,
      data.excerpt ?? null,
      data.body,
      status,
      data.generated_by_ai ? 1 : 0,
      data.ai_topic ?? null,
      publishedAt,
    ]
  );
  const row = await getArticle(res.insertId);
  if (!row) throw new Error("Article created but not found");
  return row;
}

export async function updateArticle(id: number, data: Partial<{
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  status: ArticleStatus;
}>): Promise<Article | null> {
  const current = await getArticle(id);
  if (!current) return null;

  const fields: string[] = [];
  const params: (string | number | Date | null)[] = [];

  if (data.title !== undefined) { fields.push("title = ?"); params.push(data.title); }
  if (data.slug !== undefined) {
    const newSlug = await ensureUniqueSlug(slugify(data.slug), id);
    fields.push("slug = ?"); params.push(newSlug);
  }
  if (data.excerpt !== undefined) { fields.push("excerpt = ?"); params.push(data.excerpt); }
  if (data.body !== undefined) { fields.push("body = ?"); params.push(data.body); }
  if (data.status !== undefined) {
    fields.push("status = ?"); params.push(data.status);
    if (data.status === "published" && !current.published_at) {
      fields.push("published_at = ?"); params.push(new Date());
    }
    if (data.status === "draft") {
      fields.push("published_at = NULL");
    }
  }

  if (fields.length === 0) return current;

  params.push(id);
  await pool.query(`UPDATE articles SET ${fields.join(", ")} WHERE id = ?`, params);
  return getArticle(id);
}

export async function deleteArticle(id: number): Promise<boolean> {
  const [res] = await pool.query<ResultSetHeader>("DELETE FROM articles WHERE id = ?", [id]);
  return res.affectedRows > 0;
}

export async function getRecentArticleSummaries(limit = 10): Promise<{ title: string; slug: string }[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT title, slug FROM articles
     ORDER BY COALESCE(published_at, created_at) DESC
     LIMIT ?`,
    [limit]
  );
  return rows as { title: string; slug: string }[];
}
