"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, ToggleLeft, ToggleRight, UserPlus } from "lucide-react";

type NotifEmail = { id: number; email: string; label: string | null; active: number };
type AdminUser = { id: number; email: string; created_at: string };

export default function ParametresPage() {
  const [emails, setEmails] = useState<NotifEmail[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [newEmail, setNewEmail] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [addingEmail, setAddingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  async function fetchEmails() {
    const res = await fetch("/api/emails");
    setEmails(await res.json());
    setLoadingEmails(false);
  }

  async function fetchUsers() {
    const res = await fetch("/api/users");
    setUsers(await res.json());
    setLoadingUsers(false);
  }

  useEffect(() => { fetchEmails(); fetchUsers(); }, []);

  async function addEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setAddingEmail(true);
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, label: newLabel || null }),
      });
      if (!res.ok) { setEmailError((await res.json()).error); return; }
      setNewEmail(""); setNewLabel("");
      fetchEmails();
    } finally { setAddingEmail(false); }
  }

  async function toggleActive(item: NotifEmail) {
    await fetch(`/api/emails/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: item.active === 1 ? 0 : 1 }),
    });
    fetchEmails();
  }

  async function deleteEmail(id: number) {
    await fetch(`/api/emails/${id}`, { method: "DELETE" });
    fetchEmails();
  }

  async function inviteUser(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(""); setInviteSuccess("");
    setInviting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteError(data.error); return; }
      setInviteSuccess(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail("");
      fetchUsers();
    } finally { setInviting(false); }
  }

  async function deleteUser(id: number) {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0a0a0a]">Paramètres</h1>
        <p className="text-sm text-[#737373] mt-1">Gestion des accès et des notifications</p>
      </div>

      {/* Utilisateurs */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h2 className="text-sm font-medium text-[#0a0a0a]">Utilisateurs</h2>
          <p className="text-xs text-[#737373] mt-0.5">Comptes ayant accès à la plateforme</p>
        </div>

        {loadingUsers ? (
          <div className="px-6 py-8 text-sm text-[#737373]">Chargement…</div>
        ) : users.length === 0 ? (
          <div className="px-6 py-8 text-sm text-[#737373]">Aucun utilisateur.</div>
        ) : (
          <div className="divide-y divide-[#e5e5e5]">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-full bg-[#f3f3f3] flex items-center justify-center text-xs font-semibold text-[#0a0a0a] shrink-0">
                  {u.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0a0a0a] truncate">{u.email}</p>
                  <p className="text-xs text-[#737373]">
                    Ajouté le {new Date(u.created_at).toLocaleDateString("fr-BE")}
                  </p>
                </div>
                <button
                  onClick={() => deleteUser(u.id)}
                  className="text-[#b0b0b0] hover:text-red-500 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inviter un utilisateur */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
        <h2 className="text-sm font-medium text-[#0a0a0a] mb-1">Inviter un utilisateur</h2>
        <p className="text-xs text-[#737373] mb-4">Un email de création de mot de passe sera envoyé automatiquement.</p>
        <form onSubmit={inviteUser} className="flex gap-3">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a] transition"
            placeholder="collaborateur@exemple.be"
          />
          <button
            type="submit"
            disabled={inviting}
            className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#1a1a1a] transition disabled:opacity-60 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            {inviting ? "Envoi…" : "Inviter"}
          </button>
        </form>
        {inviteError && <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{inviteError}</p>}
        {inviteSuccess && <p className="mt-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">✅ {inviteSuccess}</p>}
      </div>

      {/* Emails de notification */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h2 className="text-sm font-medium text-[#0a0a0a]">Emails de notification</h2>
          <p className="text-xs text-[#737373] mt-0.5">Ces adresses reçoivent une copie de chaque demande</p>
        </div>

        {loadingEmails ? (
          <div className="px-6 py-8 text-sm text-[#737373]">Chargement…</div>
        ) : emails.length === 0 ? (
          <div className="px-6 py-8 text-sm text-[#737373]">Aucun email configuré.</div>
        ) : (
          <div className="divide-y divide-[#e5e5e5]">
            {emails.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0a0a0a] truncate">{item.email}</p>
                  {item.label && <p className="text-xs text-[#737373] truncate">{item.label}</p>}
                </div>
                <button onClick={() => toggleActive(item)} className="text-[#737373] hover:text-[#0a0a0a] transition-colors" title={item.active ? "Désactiver" : "Activer"}>
                  {item.active ? <ToggleRight className="w-5 h-5 text-[#0a0a0a]" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => deleteEmail(item.id)} className="text-[#b0b0b0] hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ajouter un email de notif */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6">
        <h2 className="text-sm font-medium text-[#0a0a0a] mb-4">Ajouter un email de notification</h2>
        <form onSubmit={addEmail} className="space-y-3">
          <div>
            <label className="text-xs text-[#737373] block mb-1.5">Adresse email *</label>
            <input
              type="email" required value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a] transition"
              placeholder="exemple@corporus.be"
            />
          </div>
          <div>
            <label className="text-xs text-[#737373] block mb-1.5">Libellé (optionnel)</label>
            <input
              type="text" value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#0a0a0a] outline-none focus:ring-2 focus:ring-[#0a0a0a] transition"
              placeholder="Ex : Direction, Support…"
            />
          </div>
          {emailError && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{emailError}</p>}
          <button
            type="submit" disabled={addingEmail}
            className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#1a1a1a] transition disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {addingEmail ? "Ajout…" : "Ajouter"}
          </button>
        </form>
      </div>
    </div>
  );
}
