"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email") }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo-corporus.png" alt="Corporus" width={140} height={40} className="mb-6 object-contain" />
          <h1 className="text-xl font-semibold text-[#0a0a0a]">Mot de passe oublié</h1>
          <p className="text-sm text-[#737373] mt-1">Réinitialisez votre accès</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-8 shadow-sm">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-[#f0f0f0] rounded-full flex items-center justify-center mx-auto text-xl">✉️</div>
              <p className="text-sm font-medium text-[#0a0a0a]">Email envoyé</p>
              <p className="text-xs text-[#737373]">Si votre adresse est enregistrée, vous recevrez un lien de réinitialisation dans quelques minutes.</p>
              <Link href="/login" className="inline-block mt-4 text-xs text-[#0a0a0a] underline">Retour à la connexion</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#0a0a0a] block mb-1.5">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-transparent transition"
                  placeholder="admin@corporus.be"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0a0a0a] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#1a1a1a] transition disabled:opacity-60"
              >
                {loading ? "Envoi…" : "Envoyer le lien"}
              </button>
              <div className="text-center">
                <Link href="/login" className="text-xs text-[#737373] hover:text-[#0a0a0a] transition">
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
