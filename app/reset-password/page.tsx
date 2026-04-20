"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    const confirm = fd.get("confirm") as string;
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { setError("Le mot de passe doit faire au moins 8 caractères."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur."); return; }
      router.push("/login?reset=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-[#0a0a0a] block mb-1.5">Nouveau mot de passe</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a] transition"
          placeholder="8 caractères minimum"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[#0a0a0a] block mb-1.5">Confirmer</label>
        <input
          name="confirm"
          type="password"
          required
          className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a] transition"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#0a0a0a] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#1a1a1a] transition disabled:opacity-60"
      >
        {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo-corporus.png" alt="Corporus" width={140} height={40} className="mb-6 object-contain" />
          <h1 className="text-xl font-semibold text-[#0a0a0a]">Nouveau mot de passe</h1>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-8 shadow-sm">
          <Suspense fallback={<p className="text-sm text-[#737373]">Chargement…</p>}>
            <ResetForm />
          </Suspense>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-xs text-[#737373] hover:text-[#0a0a0a] transition">Retour à la connexion</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
