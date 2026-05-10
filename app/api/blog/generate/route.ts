import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSettings, recordRun, todayDayCode } from "@/lib/blog-ai-settings";
import { generateArticle } from "@/lib/ai-generator";
import { createArticle } from "@/lib/articles";
import { notifyAllAdmins } from "@/lib/notify-admins";

export const maxDuration = 300;

function checkBearer(req: NextRequest): boolean {
  const expected = process.env.BLOG_GENERATE_SECRET;
  if (!expected) return false;
  const header = req.headers.get("authorization");
  if (!header) return false;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  // Comparaison à temps constant pour éviter le timing attack.
  const provided = match[1].trim();
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  // Auth : (a) Bearer token statique pour les runs automatiques (scheduler) OU
  // (b) session admin valide pour le déclenchement manuel "Générer maintenant".
  const isScheduler = checkBearer(req);
  const session = isScheduler ? null : await getSession();
  const isManual = !!session;

  if (!isScheduler && !isManual) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const settings = await getSettings();

  if (!settings.enabled) {
    await recordRun({ status: "skipped", error: "Génération désactivée." });
    return NextResponse.json({ skipped: true, reason: "disabled" });
  }

  // En mode scheduler, on respecte le calendrier. En mode manuel, on génère toujours.
  if (isScheduler) {
    const today = todayDayCode();
    if (!today || !settings.days_of_week.includes(today)) {
      await recordRun({ status: "skipped", error: `Jour non programmé (${today ?? "weekend"})` });
      return NextResponse.json({ skipped: true, reason: "not-a-scheduled-day" });
    }
  }

  try {
    const generated = await generateArticle({ theme: settings.theme });
    const created = await createArticle({
      title: generated.title,
      excerpt: generated.excerpt,
      body: generated.body,
      status: "draft",
      generated_by_ai: true,
      ai_topic: settings.theme,
    });

    const baseUrl = process.env.ADMIN_BASE_URL ?? "";
    const editUrl = `${baseUrl}/articles/${created.id}`;

    await notifyAllAdmins({
      subject: `Nouvel article IA à valider — ${created.title}`,
      html: `
        <h2 style="margin:0 0 12px;font-size:18px;color:#0a0a0a">Nouveau brouillon généré</h2>
        <p style="margin:0 0 8px;color:#525252;font-size:14px">
          Un article a été rédigé automatiquement par l'IA et attend votre validation avant publication.
        </p>
        <div style="margin:20px 0;padding:16px;background:#fafafa;border-radius:12px;border:1px solid #e5e5e5">
          <p style="margin:0 0 6px;font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:0.5px">Titre proposé</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#0a0a0a">${escapeHtml(created.title)}</p>
          ${created.excerpt ? `
          <p style="margin:12px 0 0;font-size:13px;color:#525252;line-height:1.5">${escapeHtml(created.excerpt)}</p>
          ` : ""}
          ${settings.theme ? `
          <p style="margin:12px 0 0;font-size:11px;color:#a3a3a3"><em>Thème configuré : ${escapeHtml(settings.theme)}</em></p>
          ` : ""}
        </div>
        <p style="margin:0 0 16px;color:#525252;font-size:14px">
          Ouvrez le brouillon pour relire, modifier et publier.
        </p>
        <a href="${editUrl}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;font-size:14px;font-weight:500">
          Ouvrir le brouillon →
        </a>
      `,
    });

    await recordRun({ status: "success" });
    return NextResponse.json({ ok: true, articleId: created.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[blog/generate] failure:", err);
    await recordRun({ status: "error", error: message.slice(0, 500) });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
