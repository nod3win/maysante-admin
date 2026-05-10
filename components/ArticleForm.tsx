"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Editor from "./Editor";
import { Save, Eye, Trash2, Sparkles } from "lucide-react";

interface ArticleFormProps {
  article: {
    id?: number;
    title: string;
    slug: string;
    excerpt: string | null;
    body: string;
    status: "draft" | "published";
    generated_by_ai?: number;
  };
}

export default function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter();
  const isNew = !article.id;

  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [excerpt, setExcerpt] = useState(article.excerpt ?? "");
  const [body, setBody] = useState(article.body);
  const [status, setStatus] = useState<"draft" | "published">(article.status);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function save(nextStatus?: "draft" | "published") {
    setError(""); setSuccess("");
    setSaving(true);
    const targetStatus = nextStatus ?? status;
    try {
      const url = isNew ? "/api/articles" : `/api/articles/${article.id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          body,
          status: targetStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la sauvegarde.");
        return;
      }
      setStatus(targetStatus);
      if (isNew && data.id) {
        router.push(`/articles/${data.id}`);
      } else {
        setSuccess(targetStatus === "published" ? "Article publié." : "Article enregistré.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!article.id) return;
    if (!confirm("Supprimer cet article définitivement ?")) return;
    const res = await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
    if (res.ok) router.push("/articles");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold text-[#0a0a0a]">
              {isNew ? "Nouvel article" : "Modifier l'article"}
            </h1>
            {article.generated_by_ai === 1 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0a0a0a] bg-[#f3f3f3] rounded-full px-2 py-0.5">
                <Sparkles className="w-3 h-3" /> Généré IA
              </span>
            )}
          </div>
          <p className="text-sm text-[#737373]">
            Statut : <span className="font-medium text-[#0a0a0a]">{status === "published" ? "Publié" : "Brouillon"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isNew && (
            <button
              onClick={remove}
              className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-red-500 transition-colors px-3 py-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </button>
          )}
          <button
            onClick={() => save("draft")}
            disabled={saving}
            className="inline-flex items-center gap-2 border border-[#e5e5e5] bg-white text-[#0a0a0a] rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#f9f9f9] transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
          <button
            onClick={() => save("published")}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#1a1a1a] transition disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            {status === "published" ? "Mettre à jour" : "Publier"}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
      {success && <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2">✓ {success}</p>}

      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de l'article"
          className="w-full text-3xl font-semibold text-[#0a0a0a] bg-transparent border-none outline-none placeholder:text-[#d4d4d4]"
        />

        <div className="flex items-center gap-2 text-xs text-[#737373]">
          <span className="text-[#a3a3a3]">/blog/</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug-de-larticle"
            className="flex-1 bg-transparent border-none outline-none text-[#525252] font-mono"
          />
        </div>

        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Résumé court (1–2 phrases, max 200 caractères)"
          maxLength={200}
          rows={2}
          className="w-full text-sm text-[#525252] bg-transparent border-none outline-none resize-none placeholder:text-[#b0b0b0]"
        />
        <div className="text-xs text-[#a3a3a3] text-right">{excerpt.length}/200</div>
      </div>

      <Editor value={body} onChange={setBody} placeholder="Commencez à rédiger votre article…" />
    </div>
  );
}
