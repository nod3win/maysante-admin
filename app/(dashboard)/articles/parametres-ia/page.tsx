"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Save, Play, AlertCircle, Check, Loader2, FileText } from "lucide-react";

interface Settings {
  theme: string | null;
  auto_publish: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
}

interface GenerateResult {
  articleId: number;
  title: string;
  published: boolean;
}

// Étapes affichées pendant la génération, selon le temps écoulé.
const PROGRESS_STEPS: { fromSec: number; label: string }[] = [
  { fromSec: 0, label: "Analyse des articles existants…" },
  { fromSec: 5, label: "Choix de l'angle et du plan…" },
  { fromSec: 12, label: "Rédaction de l'article…" },
  { fromSec: 35, label: "Relecture et mise en forme…" },
  { fromSec: 60, label: "Finalisation…" },
];

export default function ParametresIaPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState("");
  const [autoPublish, setAutoPublish] = useState(false);

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load(): Promise<Settings> {
    const res = await fetch("/api/blog/ai-settings");
    const data: Settings = await res.json();
    setSettings(data);
    setTheme(data.theme ?? "");
    setAutoPublish(data.auto_publish);
    return data;
  }

  useEffect(() => {
    load().then((data) => {
      setLoading(false);
      // Une génération est déjà en cours (autre onglet, rechargement) :
      // on reprend l'affichage de progression jusqu'à son terme.
      if (data.last_status === "running") startProgress();
    });
    return stopProgress;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startProgress() {
    setGenerating(true);
    setElapsed(0);
    setResult(null);
    stopProgress();
    const t0 = Date.now();
    timerRef.current = setInterval(async () => {
      setElapsed(Math.round((Date.now() - t0) / 1000));
      // Toutes les 3 s, vérifie si la génération est terminée côté serveur.
      if (Math.round((Date.now() - t0) / 1000) % 3 === 0) {
        const res = await fetch("/api/blog/ai-settings");
        const data: Settings = await res.json();
        if (data.last_status !== "running") {
          setSettings(data);
          setGenerating(false);
          stopProgress();
          if (data.last_status === "error") setError(data.last_error ?? "Erreur lors de la génération.");
        }
      }
    }, 1000);
  }

  function stopProgress() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function save() {
    setError(""); setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/blog/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: theme.trim() || null, auto_publish: autoPublish }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur."); return; }
      setSettings(data);
      setSuccess("Configuration enregistrée.");
    } finally {
      setSaving(false);
    }
  }

  async function generateNow() {
    setError(""); setSuccess(""); setResult(null);
    // Enregistre le thème courant avant de lancer, pour que la génération
    // utilise ce qui est à l'écran.
    await fetch("/api/blog/ai-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: theme.trim() || null, auto_publish: autoPublish }),
    }).catch(() => {});
    startProgress();
    try {
      const res = await fetch("/api/blog/generate", { method: "POST" });
      const data = await res.json();
      stopProgress();
      setGenerating(false);
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la génération.");
      } else {
        setResult(data as GenerateResult);
      }
      load();
    } catch {
      stopProgress();
      setGenerating(false);
      setError("La connexion a été interrompue — vérifiez la liste des articles.");
      load();
    }
  }

  if (loading || !settings) {
    return <div className="text-sm text-[#737373]">Chargement…</div>;
  }

  const currentStep = [...PROGRESS_STEPS].reverse().find((s) => elapsed >= s.fromSec) ?? PROGRESS_STEPS[0];
  // Progression indicative (les générations durent ~20 s à 2 min) — plafonnée à 95 %.
  const progressPct = Math.min(95, Math.round((elapsed / 45) * 100));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[#0a0a0a]" />
          <h1 className="text-2xl font-semibold text-[#0a0a0a]">Génération IA</h1>
        </div>
        <p className="text-sm text-[#737373]">
          Faites rédiger un article de blog par Claude, à la demande. Vous donnez un thème,
          vous lancez, et l'article arrive en brouillon (ou est publié directement, au choix).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
        <div>
          <h3 className="text-sm font-medium text-[#0a0a0a] mb-1">Thème ou orientation (optionnel)</h3>
          <p className="text-xs text-[#737373] mb-3">
            Précisez un sujet, une catégorie, des mots-clés à privilégier. Laissez vide pour laisser
            l'IA choisir librement parmi les sujets pertinents pour Maysanté.
          </p>
          <textarea
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            rows={4}
            maxLength={2000}
            disabled={generating}
            placeholder="Ex : Privilégie les sujets autour de la convalescence post-hospitalisation et des aides à domicile pour personnes âgées."
            className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a] transition resize-none placeholder:text-[#b0b0b0] disabled:opacity-60"
          />
          <div className="text-xs text-[#a3a3a3] text-right mt-1">{theme.length}/2000</div>
        </div>

        <div className="border-t border-[#e5e5e5] pt-6 mt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium text-[#0a0a0a]">Publication directe</h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Si activée, l'article généré est publié directement sur le site.
                Sinon, il arrive en brouillon et attend votre validation.
              </p>
            </div>
            <button
              onClick={() => setAutoPublish((v) => !v)}
              disabled={generating}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                autoPublish ? "bg-[#0a0a0a]" : "bg-[#e5e5e5]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  autoPublish ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {generating && (
          <div className="mt-6 border border-[#e5e5e5] bg-[#fafafa] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#0a0a0a]" />
              <span className="text-sm font-medium text-[#0a0a0a]">Génération en cours</span>
              <span className="ml-auto text-xs text-[#737373] tabular-nums">{elapsed}s</span>
            </div>
            <div className="h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full bg-[#0a0a0a] rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-[#737373]">{currentStep.label} Comptez environ une minute.</p>
          </div>
        )}

        {result && (
          <div className="mt-6 border border-green-200 bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-green-700" />
              <span className="text-sm font-medium text-green-800">
                {result.published ? "Article généré et publié !" : "Article généré, en brouillon."}
              </span>
            </div>
            <p className="text-xs text-green-800 mb-3">« {result.title} »</p>
            <Link
              href={`/articles/${result.articleId}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-green-900 underline underline-offset-2"
            >
              <FileText className="w-3.5 h-3.5" />
              {result.published ? "Voir l'article" : "Relire et publier"}
            </Link>
          </div>
        )}

        {error && (
          <p className="mt-4 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2 flex items-start gap-2">
            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {success}
          </p>
        )}

        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-[#e5e5e5]">
          <button
            onClick={save}
            disabled={saving || generating}
            className="inline-flex items-center gap-2 border border-[#e5e5e5] bg-white text-[#0a0a0a] rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#f9f9f9] transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            onClick={generateNow}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#1a1a1a] transition disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {generating ? "Génération…" : "Générer maintenant"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
        <h2 className="text-sm font-medium text-[#0a0a0a] mb-4">Dernière génération</h2>
        {settings.last_run_at ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#737373]">Date</span>
              <span className="text-[#0a0a0a]">
                {new Date(settings.last_run_at).toLocaleString("fr-BE")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Statut</span>
              <span
                className={`font-medium ${
                  settings.last_status === "success"
                    ? "text-green-700"
                    : settings.last_status === "running"
                    ? "text-[#0a0a0a]"
                    : "text-red-600"
                }`}
              >
                {settings.last_status === "success"
                  ? "Succès"
                  : settings.last_status === "running"
                  ? "En cours…"
                  : "Erreur"}
              </span>
            </div>
            {settings.last_error && (
              <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs text-[#737373] mt-2">
                {settings.last_error}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#737373]">Jamais exécutée.</p>
        )}
      </div>
    </div>
  );
}
