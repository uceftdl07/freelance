"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import WelcomeModal from "./WelcomeModal";
import {
  HiHome,
  HiDocumentText,
  HiBriefcase,
  HiCog6Tooth,
  HiArrowRightOnRectangle,
  HiBars3,
  HiXMark,
  HiUser,
  HiBell,
  HiMagnifyingGlass,
  HiChatBubbleLeftRight,
  HiHeart,
} from "react-icons/hi2";

const candidatLinks = [
  { label: "Tableau de bord", href: "/dashboard/candidat", icon: HiHome },
  { label: "Mon Profil", href: "/dashboard/candidat/profil", icon: HiUser },
  { label: "Mon CV", href: "/dashboard/candidat/cv", icon: HiDocumentText },
  { label: "Offres de mission", href: "/dashboard/candidat/offres", icon: HiMagnifyingGlass },
  { label: "Mes Candidatures", href: "/dashboard/candidat/candidatures", icon: HiBriefcase },
  { label: "Mes Favoris", href: "/dashboard/candidat/favoris", icon: HiHeart },
  { label: "Messagerie", href: "/dashboard/candidat/messagerie", icon: HiChatBubbleLeftRight },
  { label: "Paramètres", href: "/dashboard/candidat/parametres", icon: HiCog6Tooth },
];

const recruteurLinks = [
  { label: "Rechercher", href: "/dashboard/recruteur", icon: HiMagnifyingGlass },
  { label: "Mes Offres", href: "/dashboard/recruteur/offres", icon: HiBriefcase },
  { label: "Candidats Sauvegardés", href: "/dashboard/recruteur/sauvegardes", icon: HiUser },
  { label: "Messagerie", href: "/dashboard/recruteur/messagerie", icon: HiChatBubbleLeftRight },
  { label: "Paramètres", href: "/dashboard/recruteur/parametres", icon: HiCog6Tooth },
];

// Map pathnames to page titles for the topbar
const pageTitles: Record<string, string> = {
  "/dashboard/candidat": "Tableau de bord",
  "/dashboard/candidat/profil": "Mon Profil",
  "/dashboard/candidat/cv": "Mon CV",
  "/dashboard/candidat/offres": "Offres de mission",
  "/dashboard/candidat/candidatures": "Mes Candidatures",
  "/dashboard/candidat/favoris": "Mes Favoris",
  "/dashboard/candidat/parametres": "Paramètres",
  "/dashboard/candidat/messagerie": "Messagerie",
  "/dashboard/recruteur": "Rechercher des candidats",
  "/dashboard/recruteur/offres": "Mes Offres",
  "/dashboard/recruteur/sauvegardes": "Candidats Sauvegardés",
  "/dashboard/recruteur/messagerie": "Messagerie",
  "/dashboard/recruteur/parametres": "Paramètres",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Show welcome modal if user hasn't completed onboarding
  useEffect(() => {
    const onboarded = localStorage.getItem("freelanceit_onboarded");
    if (!onboarded) setShowWelcome(true);
  }, []);

  const handleWelcomeSave = async (data: { civility: string; firstName: string; lastName: string; pseudo: string }) => {
    // In production: POST to /api/profile/me
    console.log("[Onboarding]", data);
    localStorage.setItem("freelanceit_onboarded", "true");
    setShowWelcome(false);
  };

  const handleWelcomeLogout = () => {
    localStorage.removeItem("freelanceit_token");
    localStorage.removeItem("freelanceit_onboarded");
    router.push("/");
  };

  // Determine which sidebar to show based on path
  const isRecruteur = pathname.startsWith("/dashboard/recruteur");
  const links = isRecruteur ? recruteurLinks : candidatLinks;
  const pageTitle = pageTitles[pathname] || "Tableau de bord";

  // Check if a link is active (exact match or starts with for nested routes)
  const isActive = (href: string) => {
    if (href === "/dashboard/candidat" || href === "/dashboard/recruteur") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f1f5f9" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#0a1628" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #00b8d9, #00a3c4)",
              }}
            >
              <span className="text-white font-black text-xs">FI</span>
            </div>
            <span className="text-white font-bold text-lg">
              Freelance<span style={{ color: "#00b8d9" }}>IT</span>
            </span>
          </Link>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          >
            <HiXMark size={20} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3">
          <span
            className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: isRecruteur ? "rgba(139,92,246,0.15)" : "rgba(0,184,217,0.15)",
              color: isRecruteur ? "#a78bfa" : "#00b8d9",
            }}
          >
            {isRecruteur ? "Recruteur" : "Candidat"}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={
                  active
                    ? {
                        backgroundColor: "rgba(255,255,255,0.1)",
                        color: "#ffffff",
                        borderLeft: "4px solid #00b8d9",
                        paddingLeft: "8px",
                      }
                    : {
                        color: "#94a3b8",
                        borderLeft: "4px solid transparent",
                        paddingLeft: "8px",
                      }
                }
              >
                <Icon
                  className="w-5 h-5 flex-shrink-0"
                  style={active ? { color: "#00b8d9" } : undefined}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-white/5 pt-3">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <HiArrowRightOnRectangle className="w-5 h-5" />
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 h-16 flex items-center gap-4 px-4 sm:px-6 bg-white shadow-sm"
        >
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <HiBars3 size={22} />
          </button>

          <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>

          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell + dropdown */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
              >
                <HiBell className="w-5 h-5" />
                <span
                  className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                  style={{ backgroundColor: "#ef4444" }}
                />
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900">Notifications</h4>
                    <span className="text-[10px] font-bold text-[#00b8d9] bg-[#00b8d9]/10 px-2 py-0.5 rounded-full">3 nouvelles</span>
                  </div>
                  <div className="py-1">
                    <div className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-[#00b8d9]">
                      <p className="text-sm text-gray-800 font-medium">🚀 Une nouvelle offre correspond à votre profil</p>
                      <p className="text-[11px] text-gray-400 mt-1">Il y a 5 minutes</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-[#00b8d9]">
                      <p className="text-sm text-gray-800 font-medium">👀 L&apos;entreprise Qonto a consulté votre profil</p>
                      <p className="text-[11px] text-gray-400 mt-1">Il y a 2 heures</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-transparent">
                      <p className="text-sm text-gray-600">✅ Bienvenue sur FreelanceIT ! Complétez votre profil.</p>
                      <p className="text-[11px] text-gray-400 mt-1">Il y a 1 jour</p>
                    </div>
                  </div>
                  <div className="px-4 pt-2 border-t border-gray-100">
                    <Link href={isRecruteur ? "/dashboard/recruteur/alertes" : "/dashboard/candidat/alertes"} onClick={() => setNotifOpen(false)} className="text-xs font-bold text-[#00b8d9] hover:underline">Voir toutes les notifications →</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white transition-transform hover:scale-105"
                style={{ backgroundColor: "#00b8d9" }}
              >
                Y
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 pb-3 border-b border-gray-100 text-center">
                    <p className="text-xs text-gray-500 mb-2">Profil non complet</p>
                    <Link href="/dashboard/candidat/profil" onClick={() => setDropdownOpen(false)} className="block w-full py-2 text-sm font-bold text-[#0a1628] border border-[#0a1628] rounded-lg hover:bg-gray-50 transition-colors">
                      Compléter mon profil
                    </Link>
                  </div>
                  <div className="py-2 flex flex-col">
                    <Link href="/dashboard/candidat/profil" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors">
                      <HiUser className="w-4 h-4 text-gray-400" /> Mon profil IT <span className="ml-auto text-[10px] font-bold text-[#00b8d9]">NEW !</span>
                    </Link>
                    <Link href="/dashboard/candidat/cv" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors">
                      <HiDocumentText className="w-4 h-4 text-gray-400" /> Mes documents
                    </Link>
                    <Link href="/dashboard/candidat/candidatures" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors">
                      <HiBriefcase className="w-4 h-4 text-gray-400" /> Mes candidatures
                    </Link>
                    <Link href="/dashboard/candidat/parametres" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors border-t border-gray-50 mt-1 pt-3">
                      <HiCog6Tooth className="w-4 h-4 text-gray-400" /> Mon compte
                    </Link>
                    <button
                      onClick={handleWelcomeLogout}
                      className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-500 transition-colors mt-1 border-t border-gray-100 pt-3"
                    >
                      <HiArrowRightOnRectangle className="w-4 h-4 text-gray-400" /> Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcome}
        onSave={handleWelcomeSave}
        onLogout={handleWelcomeLogout}
      />
    </div>
  );
}
