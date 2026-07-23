"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, Settings, LogOut, FileText, Sparkles, BarChart3 } from "lucide-react";

const nav = [
  { href: "/demandes", label: "Demandes", icon: LayoutDashboard },
  { href: "/statistiques", label: "Statistiques", icon: BarChart3 },
  { href: "/articles", label: "Articles", icon: FileText },
  { href: "/articles/parametres-ia", label: "Génération IA", icon: Sparkles },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-56 shrink-0 border-r border-[#e5e5e5] bg-white flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-[#e5e5e5]">
        <Image src="/logo-corporus.png" alt="Corporus" width={110} height={32} className="object-contain" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          // Conflict: /articles is prefix of /articles/parametres-ia.
          // Highlight a more specific route only when path starts with it; otherwise exact match.
          const moreSpecific = nav.some(
            (n) => n.href !== href && n.href.startsWith(href + "/") && pathname.startsWith(n.href)
          );
          const active = !moreSpecific && (pathname === href || pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                active
                  ? "bg-[#0a0a0a] text-white font-medium"
                  : "text-[#737373] hover:bg-[#f3f3f3] hover:text-[#0a0a0a]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5">
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-[#737373] hover:bg-[#f3f3f3] hover:text-[#0a0a0a] transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
