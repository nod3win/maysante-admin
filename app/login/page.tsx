"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur de connexion."); return; }
      window.location.href = "/demandes";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo-corporus.png" alt="Corporus" width={140} height={40} className="mb-6 object-contain" />
          <h1 className="text-xl font-semibold text-[#0a0a0a]">Connexion</h1>
          <p className="text-sm text-[#737373] mt-1">Plateforme admin Maysanté</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#0a0a0a] block mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-transparent transition"
                placeholder="admin@corporus.be"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#0a0a0a] block mb-1.5">Mot de passe</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0a0a0a] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#1a1a1a] transition disabled:opacity-60 mt-2"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-xs text-[#737373] hover:text-[#0a0a0a] transition">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[#b0b0b0] mt-6">
          Corporus Software © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
