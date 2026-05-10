import { notFound } from "next/navigation";
import { getArticle } from "@/lib/articles";
import ArticleForm from "@/components/ArticleForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const article = await getArticle(numericId);
  if (!article) notFound();

  return <ArticleForm article={article} />;
}
