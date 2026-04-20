"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Mail, Clock } from "lucide-react";

type Demande = {
  id: number;
  type: "contact" | "appel";
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  message?: string;
  type_soin?: string;
  created_at: string;
};

function badge(type: string) {
  if (type === "contact")
    return <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#f0f0f0] text-[#0a0a0a] rounded-full px-2 py-0.5"><Mail className="w-3 h-3" />Contact</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#0a0a0a] text-white rounded-full px-2 py-0.5"><Phone className="w-3 h-3" />Rappel</span>;
}

export default function DashboardPage() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/demandes")
      .then((r) => r.json())
      .then((d) => { setDemandes(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const contacts = demandes.filter((d) => d.type === "contact").length;
  const appels = demandes.filter((d) => d.type === "appel").length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0a0a0a]">Demandes</h1>
        <p className="text-sm text-[#737373] mt-1">Toutes les demandes reçues depuis le site Maysanté</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total", value: demandes.length },
          { label: "Contacts", value: contacts },
          { label: "Rappels", value: appels },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#e5e5e5] p-5">
            <p className="text-xs text-[#737373] mb-1">{label}</p>
            <p className="text-3xl font-semibold text-[#0a0a0a]">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h2 className="text-sm font-medium text-[#0a0a0a]">Toutes les demandes</h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-[#737373]">Chargement…</div>
        ) : demandes.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#737373]">Aucune demande pour le moment.</div>
        ) : (
          <div className="divide-y divide-[#e5e5e5]">
            {demandes.map((d) => (
              <Link
                key={`${d.type}-${d.id}`}
                href={`/demandes/${d.type}/${d.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9f9f9] transition-colors group"
              >
                <div className="shrink-0">{badge(d.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0a0a0a] truncate">
                    {d.type === "appel" ? `${d.prenom} ${d.nom}` : d.nom}
                  </p>
                  <p className="text-xs text-[#737373] truncate">
                    {d.type === "contact" ? d.email : d.telephone}
                  </p>
                </div>
                {d.type === "appel" && d.type_soin && (
                  <span className="text-xs text-[#737373] hidden sm:block shrink-0">
                    {d.type_soin === "soins-infirmiers" ? "Soins infirmiers" : "Garde malade"}
                  </span>
                )}
                <div className="flex items-center gap-1 text-xs text-[#737373] shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(d.created_at).toLocaleString("fr-BE", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
                <span className="text-[#b0b0b0] group-hover:text-[#0a0a0a] transition-colors text-sm">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
