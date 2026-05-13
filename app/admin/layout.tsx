"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";
import {
  HiChartBarSquare,
  HiUsers,
  HiRectangleGroup,
  HiChatBubbleLeftEllipsis,
  HiArrowRightOnRectangle,
  HiShieldCheck,
} from "react-icons/hi2";

const adminLinks = [
  { label: "Statistiques", href: "/admin", icon: HiChartBarSquare },
  { label: "Utilisateurs", href: "/admin/users", icon: HiUsers },
  { label: "Communauté", href: "/admin/communaute", icon: HiChatBubbleLeftEllipsis },
  { label: "Blocs de contenu", href: "/admin/blocs", icon: HiRectangleGroup },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN") router.replace("/admin/login");
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a1628" }}><div className="w-6 h-6 border-2 border-[#00b8d9] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f1f5f9" }}>
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ backgroundColor: "#0a1628", minHeight: "100vh" }}>
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/5">
          <HiShieldCheck className="w-6 h-6 text-[#00b8d9]" />
          <span className="text-white font-bold text-base">Admin</span>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">ADMIN</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={active
                  ? { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", borderLeft: "3px solid #00b8d9", paddingLeft: "9px" }
                  : { color: "#94a3b8", borderLeft: "3px solid transparent", paddingLeft: "9px" }
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" style={active ? { color: "#00b8d9" } : undefined} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 border-t border-white/5 pt-3">
          <button
            onClick={() => { logout(); router.push("/admin/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <HiArrowRightOnRectangle className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
    </div>
  );
}
