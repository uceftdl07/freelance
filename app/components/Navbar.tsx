"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { HiMenu, HiX } from "react-icons/hi";
import { HiMagnifyingGlass, HiMapPin } from "react-icons/hi2";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import CreateOfferModal from "./CreateOfferModal";
import UploadCVModal from "./UploadCVModal";

const navLinks = [
  { label: "Missions", href: "/offres" },
  { label: "Communauté", href: "/communaute" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showUploadCV, setShowUploadCV] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  const isLinkActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const { user, loading, logout } = useAuth();

  const dashboardUrl =
    user?.role === "RECRUTEUR"
      ? "/dashboard/recruteur"
      : "/dashboard/candidat";

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "??";

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: "#00b8d9" }}
              >
                FI
              </div>
              <span className="text-[#0a1628] font-extrabold text-xl tracking-tight hidden sm:block">
                Freelance<span style={{ color: "#00b8d9" }}>IT</span>
              </span>
            </Link>

            {/* Desktop Center Links */}
            <div className="hidden lg:flex items-center gap-6 ml-8 h-full">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="relative text-sm font-semibold transition-colors h-full flex items-center"
                    style={{ color: active ? "#00b8d9" : "#4b5563" }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#00b8d9"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#4b5563"; }}
                  >
                    {link.label}
                    {active && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                        style={{ backgroundColor: "#00b8d9" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Small Header Search (Optional as per prompt) */}
            <div className="hidden xl:flex items-center mx-6 flex-1 max-w-md bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-[#00b8d9] transition-colors">
               <HiMagnifyingGlass className="w-4 h-4 text-gray-400 mr-2" />
               <input type="text" placeholder="Métier, mot-clé" className="bg-transparent text-xs text-gray-700 outline-none w-1/2 border-r border-gray-200 mr-2 pr-2" />
               <HiMapPin className="w-4 h-4 text-gray-400 mr-2" />
               <input type="text" placeholder="Toute la France" className="bg-transparent text-xs text-gray-700 outline-none w-1/2" />
            </div>

            {/* Desktop Right Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              {(!mounted || loading) ? (
                <div className="w-24 h-9 bg-gray-100 rounded animate-pulse" />
              ) : user ? (
                <div className="relative flex items-center gap-3">
                  {/* Notification Bell */}
                  <div className="relative">
                    <button
                      onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                      className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
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
                          <Link href={`${dashboardUrl}/alertes`} onClick={() => setNotifOpen(false)} className="text-xs font-bold text-[#00b8d9] hover:underline">Voir toutes les notifications →</Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    href={user?.role === 'RECRUTEUR' ? '/dashboard/recruteur/offres' : '/dashboard/candidat/profil'}
                    className="px-5 py-2.5 text-xs font-extrabold text-white rounded-full transition-all hover:-translate-y-0.5 uppercase tracking-wide"
                    style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 10px rgba(0,184,217,0.2)" }}
                  >
                    {user?.role === 'RECRUTEUR' ? 'Publier' : 'Mon profil'}
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                      className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold transition-transform hover:scale-105"
                      style={{ backgroundColor: "#00b8d9" }}
                    >
                      {initials}
                    </button>
                    
                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 pb-3 border-b border-gray-100 text-center">
                          <p className="text-xs text-gray-500 mb-2">Profil non complet</p>
                          <Link href={dashboardUrl} onClick={() => setDropdownOpen(false)} className="block w-full py-2 text-sm font-bold text-[#0a1628] border border-[#0a1628] rounded-lg hover:bg-gray-50 transition-colors">
                            Créer mon profil
                          </Link>
                        </div>
                        <div className="py-2 flex flex-col">
                          <Link href={`${dashboardUrl}/profil`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Mon profil IT <span className="ml-auto text-[10px] font-bold text-[#00b8d9]">NEW !</span>
                          </Link>
                          <Link href={`${dashboardUrl}/cv`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Mes documents
                          </Link>
                          <Link href={`${dashboardUrl}/candidatures`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            Mes candidatures
                          </Link>
                          <Link href={`${dashboardUrl}/alertes`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            Mes alertes
                          </Link>
                          <Link href={`${dashboardUrl}/favoris`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors border-b border-gray-50">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            Mes favoris
                          </Link>
                          <Link href={`${dashboardUrl}/messagerie`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            Messagerie
                          </Link>
                          <Link href={`${dashboardUrl}/deals`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors border-b border-gray-50">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                            FreelanceIT Deals
                          </Link>
                          <Link href={`${dashboardUrl}/parametres`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#00b8d9] transition-colors">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Mon compte
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              window.location.href = "/";
                            }}
                            className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-500 transition-colors mt-2 border-t border-gray-100 pt-3"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Se déconnecter
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="text-sm font-semibold text-gray-600 hover:text-[#0a1628] flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Se connecter
                  </button>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="px-5 py-2.5 text-xs font-extrabold text-white rounded-full transition-all hover:-translate-y-0.5 ml-2 uppercase tracking-wide cursor-pointer"
                    style={{ backgroundColor: "#0a1628" }}
                  >
                    Déposer une offre
                  </button>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="px-5 py-2.5 text-xs font-extrabold text-white rounded-full transition-all hover:-translate-y-0.5 uppercase tracking-wide cursor-pointer"
                    style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 10px rgba(0,184,217,0.2)" }}
                  >
                    Déposer un CV
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-600"
            >
              {mobileOpen ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 p-4 space-y-3">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-sm font-bold py-2.5 px-3 rounded-lg transition-colors"
                  style={{
                    color: active ? "#00b8d9" : "#374151",
                    backgroundColor: active ? "rgba(0,184,217,0.06)" : "transparent",
                    borderLeft: active ? "3px solid #00b8d9" : "3px solid transparent",
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-4 flex flex-col gap-2">
               {!user && (
                 <>
                   <button onClick={() => { setMobileOpen(false); setShowLogin(true); }} className="w-full py-3 text-xs font-extrabold text-white rounded-full bg-[#0a1628] uppercase cursor-pointer">Déposer une offre</button>
                   <button onClick={() => { setMobileOpen(false); setShowLogin(true); }} className="w-full py-3 text-xs font-extrabold text-white rounded-full bg-[#00b8d9] uppercase cursor-pointer">Déposer un CV</button>
                 </>
               )}
            </div>
          </div>
        )}
      </nav>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />
      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} />
      <CreateOfferModal isOpen={showCreateOffer} onClose={() => setShowCreateOffer(false)} />
      <UploadCVModal isOpen={showUploadCV} onClose={() => setShowUploadCV(false)} />
    </>
  );
}
