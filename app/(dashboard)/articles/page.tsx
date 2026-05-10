"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Sparkles, Eye, EyeOff } from "lucide-react";

type Status = "all" | "draft" | "published";
type Item = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: "draft" | "published";
  generated_by_ai: number;
  updated_at: string;
  published_at: string | null;
};

export default function ArticlesListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Status>("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/articles?status=${filter}`);
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  const tabs: { value: Status; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "draft", label: "Brouillons" },
    { value: "published", label: "Publiés" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a]">Articles</h1>
          <p className="text-sm text-[#737373] mt-1">Gestion du blog Maysanté</p>
        </div>
        <Link
          href="/articles/nouveau"
          className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#1a1a1a] transition"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="flex items-center gap-1 p-2 border-b border-[#e5e5e5]">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === t.value
                  ? "bg-[#0a0a0a] text-white font-medium"
                  : "text-[#737373] hover:bg-[#f3f3f3] hover:text-[#0a0a0a]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-[#737373]">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText className="w-8 h-8 text-[#d4d4d4] mx-auto mb-3" />
            <p className="text-sm text-[#737373]">Aucun article {filter !== "all" ? `(${filter === "draft" ? "brouillon" : "publié"})` : ""}.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5e5]">
            {items.map((it) => (
              <Link
                key={it.id}
                href={`/articles/${it.id}`}
                className="block px-6 py-4 hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-sm font-medium text-[#0a0a0a] truncate">{it.title}</h2>
                      {it.generated_by_ai === 1 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0a0a0a] bg-[#f3f3f3] rounded-full px-1.5 py-0.5 shrink-0">
                          <Sparkles className="w-2.5 h-2.5" /> IA
                        </span>
                      )}
                    </div>
                    {it.excerpt && (
                      <p className="text-xs text-[#737373] line-clamp-1">{it.excerpt}</p>
                    )}
                    <p className="text-xs text-[#a3a3a3] mt-1.5">
                      {it.status === "published" && it.published_at
                        ? `Publié le ${new Date(it.published_at).toLocaleDateString("fr-BE")}`
                        : `Modifié le ${new Date(it.updated_at).toLocaleDateString("fr-BE")}`}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 shrink-0 ${
                      it.status === "published"
                        ? "bg-green-50 text-green-700"
                        : "bg-[#f3f3f3] text-[#737373]"
                    }`}
                  >
                    {it.status === "published" ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                    {it.status === "published" ? "Publié" : "Brouillon"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
