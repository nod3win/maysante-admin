"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Phone, Mail } from "lucide-react";

type Demande = Record<string, string | number | null>;

function toWaMe(phone: string) {
  return "https://wa.me/" + phone.replace(/\D/g, "");
}

export default function DemandePage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Demande | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/demandes/${type}/${id}`)
      .then((r) => { if (r.status === 401) { router.push("/login"); return null; } return r.json(); })
      .then((d) => { if (d) { setData(d); } setLoading(false); })
      .catch(() => setLoading(false));
  }, [type, id, router]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <p className="text-sm text-[#737373]">Chargement…</p>
    </div>
  );

  if (!data) return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <p className="text-sm text-[#737373]">Demande introuvable.</p>
      <Link href="/demandes" className="mt-4 inline-block text-xs underline text-[#0a0a0a]">← Retour</Link>
    </div>
  );

  const isContact = type === "contact";
  const nom = isContact ? (data.nom as string) : `${data.prenom} ${data.nom}`;
  const phone = data.telephone as string | null;

  const fields = isContact
    ? [
        { label: "Nom", value: data.nom },
        { label: "Email", value: data.email },
        { label: "Téléphone", value: data.telephone ?? "—" },
        { label: "Message", value: data.message },
      ]
    : [
        { label: "Prénom", value: data.prenom },
        { label: "Nom", value: data.nom },
        { label: "Téléphone", value: data.telephone },
        { label: "Type de soin", value: data.type_soin === "soins-infirmiers" ? "Soins infirmiers" : "Garde malade" },
      ];

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/demandes"
        className="inline-flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#0a0a0a] transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Toutes les demandes
      </Link>

      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="px-7 py-6 border-b border-[#e5e5e5] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isContact
                ? <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#f0f0f0] text-[#0a0a0a] rounded-full px-2 py-0.5"><Mail className="w-3 h-3" />Demande de contact</span>
                : <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#0a0a0a] text-white rounded-full px-2 py-0.5"><Phone className="w-3 h-3" />Demande de rappel</span>
              }
            </div>
            <h1 className="text-xl font-semibold text-[#0a0a0a]">{nom}</h1>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#737373] shrink-0 mt-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(data.created_at as string).toLocaleString("fr-BE", {
              day: "2-digit", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>
        </div>

        <div className="px-7 py-6 space-y-5">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-[#737373] mb-1">{label}</p>
              <p className="text-sm text-[#0a0a0a] whitespace-pre-wrap">{value as string ?? "—"}</p>
            </div>
          ))}
        </div>

        {phone && (
          <div className="px-7 py-5 border-t border-[#e5e5e5] flex items-center gap-3">
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#1a1a1a] transition-colors"
            >
              <Phone className="w-4 h-4" />
              Appeler
            </a>
            <a
              href={toWaMe(phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#1ebe5d] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
