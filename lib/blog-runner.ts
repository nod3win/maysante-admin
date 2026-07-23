import { getSettings, markRunning, recordRun } from "./blog-ai-settings";
import { generateArticle } from "./ai-generator";
import { createArticle } from "./articles";

export type RunResult =
  | { ok: true; articleId: number; title: string; published: boolean }
  | { error: string };

/**
 * Génération d'un article à la demande : lit les réglages (thème, mode de
 * publication), marque la génération "running" (statut sondé par la page
 * Génération IA pour la progression), génère via l'API Anthropic puis crée
 * l'article en brouillon ou publié selon `auto_publish`.
 *
 * Appelé uniquement par la route /api/blog/generate (bouton
 * "Générer maintenant") — plus aucune génération planifiée.
 */
export async function runBlogGeneration(): Promise<RunResult> {
  const settings = await getSettings();
  await markRunning();

  try {
    const generated = await generateArticle({ theme: settings.theme });
    const created = await createArticle({
      title: generated.title,
      excerpt: generated.excerpt,
      body: generated.body,
      status: settings.auto_publish ? "published" : "draft",
      generated_by_ai: true,
      ai_topic: settings.theme,
    });

    await recordRun({ status: "success" });
    return {
      ok: true,
      articleId: created.id,
      title: created.title,
      published: settings.auto_publish,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[blog-runner] échec de génération :", err);
    await recordRun({ status: "error", error: message.slice(0, 500) });
    return { error: message };
  }
}
