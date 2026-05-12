"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { apiRequest } from "../../lib/api";
import LoginModal from "../../components/LoginModal";
import RegisterModal from "../../components/RegisterModal";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  HiMapPin,
  HiOutlineBriefcase,
  HiCurrencyEuro,
  HiOutlineCalendarDays,
  HiHeart,
  HiOutlineHeart,
  HiCheckCircle,
  HiShare,
  HiXMark,
  HiPaperAirplane,
  HiUser,
} from "react-icons/hi2";

interface JobOffer {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  remote: boolean;
  contractType: string;
  tjm: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  tags: string[];
  status: string;
  createdAt: string;
  recruiter?: {
    email?: string;
    profileRecruteur?: { company?: string | null; firstName?: string | null; lastName?: string | null; website?: string | null; description?: string | null; sector?: string | null; verificationStatus?: string | null } | null;
  };
}

const CONTRACT_LABELS: Record<string, string> = { FREELANCE: "Freelance", CDI: "CDI", CDD: "CDD" };

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
      style={{ transition: "opacity 0.3s,transform 0.3s", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)" }}
    >
      <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold shadow-2xl bg-[#0a1628] text-white border border-[#00b8d9]/30">
        <HiCheckCircle className="w-5 h-5 text-[#00b8d9]" /> {message}
      </div>
    </div>
  );
}

function ApplyModal({
  isOpen, onClose, jobTitle, jobId,
}: { isOpen: boolean; onClose: () => void; jobTitle: string; jobId: string }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!jobId) { setError("Identifiant d'offre manquant."); return; }
    setSubmitting(true); setError(null);
    const res = await apiRequest<{ id: string }>("/applications", {
      method: "POST",
      body: JSON.stringify({ jobId, coverLetter: coverLetter.trim() || null }),
    });
    setSubmitting(false);
    if (!res.success) { setError(res.message || "Erreur lors de l'envoi."); return; }
    setSubmitted(true);
  };

  const resetAndClose = () => {
    setCoverLetter(""); setSubmitted(false); setSubmitting(false); setError(null); onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetAndClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative px-8 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #0a1628 0%, #111d33 100%)" }}>
          <button onClick={resetAndClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer">
            <HiXMark className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#00b8d9]/20 flex items-center justify-center">
              <HiPaperAirplane className="w-5 h-5 text-[#00b8d9]" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Postuler à cette mission</h2>
          </div>
          <p className="text-sm text-gray-400">{jobTitle}</p>
        </div>

        <div className="px-8 py-6 space-y-5">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-50">
                <HiCheckCircle className="w-9 h-9 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Candidature envoyée !</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Votre profil a été transmis au recruteur. Vous serez notifié de la suite.
              </p>
              <button onClick={resetAndClose} className="px-6 py-3 text-sm font-bold text-white rounded-xl cursor-pointer" style={{ backgroundColor: "#00b8d9" }}>
                Retour à l&apos;offre
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#00b8d9]/5 border border-[#00b8d9]/20">
                <HiUser className="w-5 h-5 text-[#00b8d9] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-bold text-gray-800">Votre profil sera utilisé comme CV.</span><br />
                  Le recruteur verra votre profil candidat (expériences, formations, compétences). Inutile de joindre un fichier.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Message de motivation <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={5}
                  placeholder="Présentez-vous en quelques lignes et expliquez pourquoi cette mission vous intéresse…"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none resize-none"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-600">{error}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 text-sm font-extrabold text-white rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: "#00b8d9", boxShadow: "0 8px 20px rgba(0,184,217,0.3)" }}
              >
                <HiPaperAirplane className="w-5 h-5" />
                {submitting ? "Envoi en cours…" : "Envoyer ma candidature"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OffreDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params?.id || "";
  const { user } = useAuth();

  const [job, setJob] = useState<JobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      setLoading(true); setError(null);
      const res = await apiRequest<JobOffer>(`/jobs/${jobId}`);
      if (res.success && res.data) setJob(res.data);
      else setError(res.message || "Offre introuvable.");
      setLoading(false);
    })();
  }, [jobId]);

  useEffect(() => {
    if (!job) return;
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("freelanceit_savedOffers") || "[]");
      setIsSaved(saved.includes(job.id));
    } catch {}
  }, [job]);

  const showToast = (msg: string) => {
    setToastMsg(msg); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const handleSave = () => {
    if (!user) { setShowLogin(true); return; }
    if (!job) return;
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("freelanceit_savedOffers") || "[]");
      if (isSaved) {
        localStorage.setItem("freelanceit_savedOffers", JSON.stringify(saved.filter((id) => id !== job.id)));
        setIsSaved(false); showToast("Offre retirée des favoris");
      } else {
        if (!saved.includes(job.id)) saved.push(job.id);
        localStorage.setItem("freelanceit_savedOffers", JSON.stringify(saved));
        const details: Record<string, JobOffer> = JSON.parse(localStorage.getItem("freelanceit_savedOffersData") || "{}");
        details[job.id] = job;
        localStorage.setItem("freelanceit_savedOffersData", JSON.stringify(details));
        setIsSaved(true); showToast("Offre sauvegardée !");
        setTimeout(() => router.push("/dashboard/candidat/favoris"), 600);
      }
    } catch { showToast("Erreur lors de la sauvegarde"); }
  };

  const handleApply = () => {
    if (!user) { setShowLogin(true); return; }
    setShowApplyModal(true);
  };

  const handleShare = async () => {
    if (!job) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: job.title, text: `${job.title} — ${job.company}`, url });
      else { await navigator.clipboard.writeText(url); showToast("Lien copié !"); }
    } catch {}
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-slate-50 py-20 text-center text-gray-500">Chargement de l&apos;offre…</main>
        <Footer />
      </>
    );
  }
  if (error || !job) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-slate-50 py-20 text-center">
          <p className="text-red-500 text-sm">{error || "Offre introuvable."}</p>
          <button onClick={() => router.push("/offres")} className="mt-4 px-5 py-2 text-sm font-bold text-white rounded-xl" style={{ backgroundColor: "#00b8d9" }}>
            Retour aux offres
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const tjmLabel =
    job.tjm != null
      ? `${job.tjm}€/jour`
      : job.salaryMin && job.salaryMax
        ? `${job.salaryMin}€ - ${job.salaryMax}€`
        : "À définir";
  const HeartIcon = isSaved ? HiHeart : HiOutlineHeart;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50 pb-20">
        {/* Hero */}
        <div className="bg-[#0a1628] pt-12 pb-24 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00b8d9] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0 text-3xl font-black text-[#0a1628]">
              {job.company.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-white">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight leading-tight">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  <HiOutlineBriefcase className="w-4 h-4 text-[#00b8d9]" /> {job.company}
                  {job.recruiter?.profileRecruteur?.verificationStatus === "VERIFIED" && (
                    <span title="Entreprise vérifiée" className="ml-1 inline-flex items-center gap-1 text-emerald-400 font-bold text-xs">
                      ✓ Vérifié
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  <HiMapPin className="w-4 h-4 text-[#00b8d9]" /> {job.location}{job.remote ? " · Remote" : ""}
                </span>
                <span className="flex items-center gap-1.5 bg-[#00b8d9]/20 px-3 py-1.5 rounded-lg border border-[#00b8d9]/30 text-[#00b8d9] font-bold">
                  {CONTRACT_LABELS[job.contractType] || job.contractType}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  <HiCurrencyEuro className="w-4 h-4 text-[#00b8d9]" /> {tjmLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#00b8d9] rounded-full"></span> Description du poste
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">{job.description}</p>
              </div>

              {job.tags.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">Compétences requises</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded text-xs font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(job.recruiter?.profileRecruteur?.description || job.recruiter?.profileRecruteur?.sector || job.recruiter?.profileRecruteur?.website) && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[#00b8d9] rounded-full"></span>
                    À propos de l&apos;entreprise
                    {job.recruiter.profileRecruteur.verificationStatus === "VERIFIED" && (
                      <span title="Entreprise vérifiée" className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        ✓ Vérifié
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#00b8d9] flex items-center justify-center text-white font-black text-lg">
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">{job.company}</p>
                      {job.recruiter.profileRecruteur.sector && (
                        <p className="text-xs text-gray-500">{job.recruiter.profileRecruteur.sector}</p>
                      )}
                    </div>
                  </div>
                  {job.recruiter.profileRecruteur.description && (
                    <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap mb-4">
                      {job.recruiter.profileRecruteur.description}
                    </p>
                  )}
                  {job.recruiter.profileRecruteur.website && (
                    <a
                      href={job.recruiter.profileRecruteur.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#00b8d9] hover:underline"
                    >
                      🌐 {job.recruiter.profileRecruteur.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 relative">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 sticky top-24">
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                      <HiOutlineCalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Publiée le</p>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(job.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleApply}
                    className="w-full py-4 text-sm font-extrabold text-white rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: "#00b8d9", boxShadow: "0 8px 20px rgba(0,184,217,0.3)" }}
                  >
                    Postuler à cette mission
                  </button>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      style={
                        isSaved
                          ? { backgroundColor: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }
                          : { backgroundColor: "#fff", color: "#4b5563", border: "1px solid #e5e7eb" }
                      }
                    >
                      <HeartIcon className="w-5 h-5" style={{ color: isSaved ? "#ef4444" : "#9ca3af" }} />
                      {isSaved ? "Sauvegardée" : "Sauvegarder"}
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-3 text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl cursor-pointer"
                      title="Partager"
                    >
                      <HiShare className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-center text-gray-400 mt-4">Réf. {job.id.slice(0, 8)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        jobTitle={job.title}
        jobId={job.id}
      />

      <Toast message={toastMsg} visible={toastVisible} />

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />
      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} />
    </>
  );
}
