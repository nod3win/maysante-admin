"use client";

import { useEffect, useState } from "react";
import { Sparkles, Save, Play, AlertCircle, Check } from "lucide-react";

type DayCode = "mon" | "tue" | "wed" | "thu" | "fri";

const DAYS: { code: DayCode; label: string }[] = [
  { code: "mon", label: "Lun" },
  { code: "tue", label: "Mar" },
  { code: "wed", label: "Mer" },
  { code: "thu", label: "Jeu" },
  { code: "fri", label: "Ven" },
];

interface Settings {
  enabled: boolean;
  days_of_week: DayCode[];
  theme: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
}

export default function ParametresIaPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [enabled, setEnabled] = useState(false);
  const [days, setDays] = useState<DayCode[]>([]);
  const [theme, setTheme] = useState("");

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/blog/ai-settings");
    const data: Settings = await res.json();
    setSettings(data);
    setEnabled(data.enabled);
    setDays(data.days_of_week);
    setTheme(data.theme ?? "");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function toggleDay(d: DayCode) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function save() {
    setError(""); setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/blog/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, days_of_week: days, theme: theme.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur."); return; }
      setSettings(data);
      setSuccess("Configuration enregistrée.");
    } finally {
      setSaving(false);
    }
  }

  async function testNow() {
    setError(""); setSuccess("");
    setTesting(true);
    try {
      const res = await fetch("/api/blog/generate?manual=1", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur lors de la génération."); return; }
      setSuccess("Article généré ! Consultez la liste des articles.");
      load();
    } finally {
      setTesting(false);
    }
  }

  if (loading || !settings) {
    return <div className="text-sm text-[#737373]">Chargement…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[#0a0a0a]" />
          <h1 className="text-2xl font-semibold text-[#0a0a0a]">Génération IA</h1>
        </div>
        <p className="text-sm text-[#737373]">
          Configure la rédaction automatique d'articles de blog par Claude. Chaque article généré
          arrive en brouillon et nécessite une validation avant publication.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-sm font-medium text-[#0a0a0a]">Activer la génération automatique</h2>
            <p className="text-xs text-[#737373] mt-0.5">
              Quand activée, un article est généré chaque jour sélectionné ci-dessous.
            </p>
          </div>
          <button
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
              enabled ? "bg-[#0a0a0a]" : "bg-[#e5e5e5]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="border-t border-[#e5e5e5] pt-6">
          <h3 className="text-sm font-medium text-[#0a0a0a] mb-1">Jours de publication</h3>
          <p className="text-xs text-[#737373] mb-3">
            Sélectionnez les jours où l'IA doit générer un article (1 par jour activé).
          </p>
          <div className="flex gap-2">
            {DAYS.map((d) => (
              <button
                key={d.code}
                onClick={() => toggleDay(d.code)}
                className={`flex-1 h-11 rounded-xl text-sm font-medium transition-colors ${
                  days.includes(d.code)
                    ? "bg-[#0a0a0a] text-white"
                    : "bg-[#f9f9f9] text-[#737373] hover:bg-[#f3f3f3] hover:text-[#0a0a0a]"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#e5e5e5] pt-6 mt-6">
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
            placeholder="Ex : Privilégie les sujets autour de la convalescence post-hospitalisation et des aides à domicile pour personnes âgées."
            className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a] transition resize-none placeholder:text-[#b0b0b0]"
          />
          <div className="text-xs text-[#a3a3a3] text-right mt-1">{theme.length}/2000</div>
        </div>

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
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#1a1a1a] transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            onClick={testNow}
            disabled={testing}
            className="inline-flex items-center gap-2 border border-[#e5e5e5] bg-white text-[#0a0a0a] rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#f9f9f9] transition disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {testing ? "Génération…" : "Générer maintenant"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
        <h2 className="text-sm font-medium text-[#0a0a0a] mb-4">Dernier déclenchement</h2>
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
                    : settings.last_status === "skipped"
                    ? "text-[#737373]"
                    : "text-red-600"
                }`}
              >
                {settings.last_status === "success" ? "Succès" : settings.last_status === "skipped" ? "Ignoré" : "Erreur"}
              </span>
            </div>
            {settings.last_error && (
              <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs text-[#737373] mt-2">
                {settings.last_error}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#737373]">Jamais exécuté.</p>
        )}
      </div>
    </div>
  );
}
