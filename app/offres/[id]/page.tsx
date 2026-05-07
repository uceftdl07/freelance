"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import LoginModal from "../../components/LoginModal";
import RegisterModal from "../../components/RegisterModal";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { 
  HiMapPin, 
  HiOutlineBriefcase, 
  HiCurrencyEuro, 
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiHeart,
  HiOutlineHeart,
  HiCheckCircle,
  HiShare,
  HiXMark,
  HiArrowUpTray,
  HiDocumentText,
  HiPaperAirplane,
} from "react-icons/hi2";

// ─── Job Data (would come from API/params in production) ─────────
const JOB_DATA = {
  id: "QONTO-FE-2026-04",
  title: "Développeur Fullstack React / Node.js Senior",
  company: "Qonto",
  location: "Paris / Hybride",
  type: "Freelance",
  tjm: "650€ - 750€/j",
  logo: "Q",
  startDate: "ASAP / Dans le mois",
  duration: "6 mois (renouvelable)",
  tags: ["React", "Node.js", "TypeScript", "PostgreSQL", "Kafka", "Kubernetes"],
};

// ─── Toast Component ─────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
      style={{
        transition: "opacity 0.3s ease, transform 0.3s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold shadow-2xl"
        style={{
          backgroundColor: "#0a1628",
          color: "#fff",
          border: "1px solid rgba(0,184,217,0.3)",
          backdropFilter: "blur(12px)",
        }}
      >
        <HiCheckCircle className="w-5 h-5 text-[#00b8d9]" />
        {message}
      </div>
    </div>
  );
}

// ─── Apply Modal ─────────────────────────────────────────────────
function ApplyModal({
  isOpen,
  onClose,
  jobTitle,
  jobRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobRef: string;
}) {
  const { token } = useAuth();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const handleSubmit = async () => {
    if (!token) {
      setError("Vous devez être connecté pour postuler.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      if (cvFile) formData.append("cv", cvFile);
      formData.append("coverLetter", coverLetter);
      formData.append("jobRef", jobRef);

      const res = await fetch(`${API_BASE}/cv/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setSubmitting(false);
        return;
      }

      if (res.status === 403) {
        setError("Seuls les candidats peuvent postuler.");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setSubmitted(true);
    } catch {
      setError("Impossible de contacter le serveur.");
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setCvFile(null);
    setCoverLetter("");
    setSubmitted(false);
    setSubmitting(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={resetAndClose}
        style={{ animation: "fadeIn 0.2s ease" }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "fadeInUp 0.35s ease" }}
      >
        {/* Header */}
        <div
          className="relative px-8 pt-8 pb-6"
          style={{
            background: "linear-gradient(135deg, #0a1628 0%, #111d33 100%)",
          }}
        >
          <button
            onClick={resetAndClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <HiXMark className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#00b8d9]/20 flex items-center justify-center">
              <HiPaperAirplane className="w-5 h-5 text-[#00b8d9]" />
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Postuler à cette mission
            </h2>
          </div>
          <p className="text-sm text-gray-400">{jobTitle}</p>
          <span className="inline-block mt-2 text-[11px] font-bold text-[#00b8d9] bg-[#00b8d9]/10 px-2.5 py-1 rounded-full">
            Réf. {jobRef}
          </span>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {submitted ? (
            /* ─── Success State ─── */
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
              >
                <HiCheckCircle className="w-9 h-9 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Candidature envoyée !
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Votre candidature a été transmise à l&apos;équipe de recrutement. Vous serez notifié de la suite.
              </p>
              <button
                onClick={resetAndClose}
                className="px-6 py-3 text-sm font-bold text-white rounded-xl transition-transform hover:-translate-y-0.5 cursor-pointer"
                style={{
                  backgroundColor: "#00b8d9",
                  boxShadow: "0 6px 16px rgba(0,184,217,0.3)",
                }}
              >
                Retour à l&apos;offre
              </button>
            </div>
          ) : (
            /* ─── Form State ─── */
            <>
              {/* CV Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  CV / Curriculum Vitae *
                </label>
                <input
                  ref={cvInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => cvInputRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer"
                  style={{
                    borderColor: cvFile ? "#00b8d9" : "#e2e8f0",
                    backgroundColor: cvFile
                      ? "rgba(0,184,217,0.04)"
                      : "#fafafa",
                  }}
                >
                  {cvFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700">
                      <HiDocumentText className="w-5 h-5 text-[#00b8d9]" />
                      {cvFile.name}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <HiArrowUpTray className="w-6 h-6 mx-auto text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        Cliquez pour télécharger votre CV
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF, DOC ou DOCX (max. 5 Mo)
                      </p>
                    </div>
                  )}
                </button>
              </div>

              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Message de motivation{" "}
                  <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                  placeholder="Présentez-vous en quelques lignes et expliquez pourquoi cette mission vous intéresse…"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none transition-all resize-none"
                />
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    color: "#dc2626",
                  }}
                >
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!cvFile || submitting}
                className="w-full py-4 text-sm font-extrabold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 hover:enabled:shadow-xl"
                style={{
                  backgroundColor: "#00b8d9",
                  boxShadow: cvFile
                    ? "0 8px 20px rgba(0,184,217,0.3)"
                    : "none",
                }}
              >
                {submitting ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <HiPaperAirplane className="w-5 h-5" />
                    Envoyer ma candidature
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-gray-400">
                En postulant, vous acceptez que vos informations soient partagées
                avec le recruteur.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function OffreDetailsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Check if this offer is already saved
  useEffect(() => {
    try {
      const saved: string[] = JSON.parse(
        localStorage.getItem("freelanceit_savedOffers") || "[]"
      );
      if (saved.includes(JOB_DATA.id)) {
        setIsSaved(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // ── Show Toast helper ──
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  // ── 1. Save / Unsave handler ── requires auth ──
  const handleSave = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    try {
      const saved: string[] = JSON.parse(
        localStorage.getItem("freelanceit_savedOffers") || "[]"
      );

      if (isSaved) {
        // Unsave
        const updated = saved.filter((id) => id !== JOB_DATA.id);
        localStorage.setItem(
          "freelanceit_savedOffers",
          JSON.stringify(updated)
        );
        setIsSaved(false);
        showToast("Offre retirée des favoris");
      } else {
        // Save — also store the full offer data for the favoris page
        if (!saved.includes(JOB_DATA.id)) {
          saved.push(JOB_DATA.id);
        }
        localStorage.setItem(
          "freelanceit_savedOffers",
          JSON.stringify(saved)
        );

        // Store full offer details for display on favoris page
        const details: Record<string, typeof JOB_DATA> = JSON.parse(
          localStorage.getItem("freelanceit_savedOffersData") || "{}"
        );
        details[JOB_DATA.id] = JOB_DATA;
        localStorage.setItem(
          "freelanceit_savedOffersData",
          JSON.stringify(details)
        );

        setIsSaved(true);
        showToast("Offre sauvegardée !");

        // Redirect to favoris page after a brief moment
        setTimeout(() => {
          router.push("/dashboard/candidat/favoris");
        }, 600);
      }
    } catch {
      showToast("Erreur lors de la sauvegarde");
    }
  };

  // ── 2. Apply handler — requires auth ──
  const handleApply = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setShowApplyModal(true);
  };

  // ── 3. Share handler ──
  const handleShare = async () => {
    const shareData = {
      title: JOB_DATA.title,
      text: `${JOB_DATA.title} — ${JOB_DATA.company} (${JOB_DATA.tjm})`,
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        showToast("Lien copié !");
      }
    } catch (err: unknown) {
      // User cancelled the share dialog — not an error
      if (err instanceof Error && err.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(shareData.url);
          showToast("Lien copié !");
        } catch {
          showToast("Impossible de copier le lien");
        }
      }
    }
  };

  const HeartIcon = isSaved ? HiHeart : HiOutlineHeart;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50 pb-20">
        
        {/* Hero Section */}
        <div className="bg-[#0a1628] pt-12 pb-24 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00b8d9] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0 text-3xl font-black text-[#0a1628]">
              {JOB_DATA.logo}
            </div>
            
            <div className="flex-1 text-white">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight leading-tight">
                {JOB_DATA.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <HiOutlineBriefcase className="w-4 h-4 text-[#00b8d9]" /> {JOB_DATA.company}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <HiMapPin className="w-4 h-4 text-[#00b8d9]" /> {JOB_DATA.location}
                </span>
                <span className="flex items-center gap-1.5 bg-[#00b8d9]/20 px-3 py-1.5 rounded-lg border border-[#00b8d9]/30 text-[#00b8d9] font-bold">
                  {JOB_DATA.type}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                  <HiCurrencyEuro className="w-4 h-4 text-[#00b8d9]" /> {JOB_DATA.tjm}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Content (70%) */}
            <div className="lg:col-span-8 space-y-8">
              
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#00b8d9] rounded-full"></span> À propos de l'entreprise
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm mb-4">
                  Qonto est la solution de gestion financière leader en Europe pour les PME et les indépendants. Fondée en 2016, l'entreprise a pour mission de simplifier le quotidien bancaire et comptable de ses clients.
                </p>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Notre équipe Tech est composée de 300 passionnés répartis dans plusieurs squads agiles. Nous valorisons la qualité du code, l'entraide et l'innovation continue.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#00b8d9] rounded-full"></span> Vos missions
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm mb-4">
                  En tant que Développeur Fullstack Senior, vous intégrerez la squad &quot;Core Banking&quot; et interviendrez sur des projets critiques :
                </p>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-3">
                    <HiCheckCircle className="w-5 h-5 text-[#00b8d9] flex-shrink-0 mt-0.5" />
                    <span>Conception et développement de nouvelles features métiers en React et Node.js.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <HiCheckCircle className="w-5 h-5 text-[#00b8d9] flex-shrink-0 mt-0.5" />
                    <span>Optimisation des performances et refactoring de l&apos;architecture micro-services existante.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <HiCheckCircle className="w-5 h-5 text-[#00b8d9] flex-shrink-0 mt-0.5" />
                    <span>Mentorat des développeurs plus juniors et participation active aux code reviews.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <HiCheckCircle className="w-5 h-5 text-[#00b8d9] flex-shrink-0 mt-0.5" />
                    <span>Garantir la sécurité et la scalabilité des applications (plus de 300 000 clients actifs).</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#00b8d9] rounded-full"></span> Profil recherché
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm mb-4">
                  Nous recherchons un profil expérimenté, autonome et moteur au sein de son équipe :
                </p>
                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2"></span>
                    <span>Au moins 5 ans d&apos;expérience significative en développement web, idéalement en environnement produit/SaaS.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2"></span>
                    <span>Excellente maîtrise de React, TypeScript et Node.js.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2"></span>
                    <span>Bonnes connaissances en bases de données relationnelles (PostgreSQL).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2"></span>
                    <span>Sensibilité aux bonnes pratiques (Clean Code, TDD, CI/CD).</span>
                  </li>
                </ul>
                
                <h3 className="font-bold text-gray-800 mb-3 text-sm">Stack Technique</h3>
                <div className="flex flex-wrap gap-2">
                  {JOB_DATA.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded text-xs font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Sidebar (30%) */}
            <div className="lg:col-span-4 relative">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 sticky top-24">
                
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                      <HiOutlineCalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Début de mission</p>
                      <p className="text-sm font-bold text-gray-900">{JOB_DATA.startDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                      <HiOutlineClock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Durée estimée</p>
                      <p className="text-sm font-bold text-gray-900">{JOB_DATA.duration}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* ── Apply Button ── */}
                  <button
                    id="btn-apply"
                    onClick={handleApply}
                    className="w-full py-4 text-sm font-extrabold text-white rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: "#00b8d9", boxShadow: "0 8px 20px rgba(0,184,217,0.3)" }}
                  >
                    Postuler à cette mission
                  </button>
                  
                  <div className="flex items-center justify-between gap-3">
                    {/* ── Save Button ── */}
                    <button
                      id="btn-save"
                      onClick={handleSave}
                      className="flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      style={
                        isSaved
                          ? {
                              backgroundColor: "rgba(239,68,68,0.06)",
                              color: "#ef4444",
                              border: "1px solid rgba(239,68,68,0.2)",
                            }
                          : {
                              backgroundColor: "#fff",
                              color: "#4b5563",
                              border: "1px solid #e5e7eb",
                            }
                      }
                    >
                      <HeartIcon
                        className="w-5 h-5 transition-transform"
                        style={{
                          color: isSaved ? "#ef4444" : "#9ca3af",
                          transform: isSaved ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                      {isSaved ? "Sauvegardée" : "Sauvegarder"}
                    </button>

                    {/* ── Share Button ── */}
                    <button
                      id="btn-share"
                      onClick={handleShare}
                      className="p-3 text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                      title="Partager"
                    >
                      <HiShare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <p className="text-[11px] text-center text-gray-400 mt-4">
                  Référence : {JOB_DATA.id}
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />

      {/* Apply Modal */}
      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        jobTitle={JOB_DATA.title}
        jobRef={JOB_DATA.id}
      />

      {/* Toast Notification */}
      <Toast message={toastMsg} visible={toastVisible} />

      {/* Auth Modals */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />
      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} />
    </>
  );
}
