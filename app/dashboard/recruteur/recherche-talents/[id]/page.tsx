"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ContactModal from "../../ContactModal";
import { apiRequest } from "../../../../lib/api";
import {
  HiOutlineArrowLeft,
  HiOutlineHeart,
  HiOutlineChatBubbleLeftRight,
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineAcademicCap,
  HiOutlineComputerDesktop,
  HiOutlineCheckBadge,
  HiOutlineCurrencyEuro,
  HiHeart,
} from "react-icons/hi2";

type Experience = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  currentlyWorking: boolean;
};
type Education = {
  id: string;
  title: string;
  school: string;
  field: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
};
type CandidateProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  title: string | null;
  bio: string | null;
  skills: string[];
  yearsOfExperience: number | null;
  availability: string;
  portfolioUrl: string | null;
  tjm: number | null;
  location: string | null;
  phone: string | null;
  linkedIn: string | null;
  avatarUrl: string | null;
  experiences: Experience[];
  educations: Education[];
};

const availabilityLabel = (a: string) =>
  a === "DISPONIBLE" ? "Disponible" : a === "BIENTOT_DISPONIBLE" ? "Bientôt disponible" : "En mission";

const formatRange = (s: string | null, e: string | null, current?: boolean) => {
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "";
  if (!s && !e) return "";
  return `${fmt(s)} — ${current ? "Aujourd'hui" : fmt(e) || "?"}`;
};

export default function CandidateProfilePage() {
  const params = useParams<{ id: string }>();
  const candidateId = params?.id || "";
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiRequest<CandidateProfile>(`/search/candidates/${candidateId}`);
      if (res.success && res.data) setCandidate(res.data);
      else setError(res.message || "Erreur lors du chargement du profil");
      setLoading(false);
    })();
  }, [candidateId]);

  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem("freelanceit_savedCandidates") || "[]");
      setSaved(ids.includes(candidateId));
    } catch {
      setSaved(false);
    }
  }, [candidateId]);

  const showFeedback = (m: string) => {
    setFeedback(m);
    setTimeout(() => setFeedback(null), 2500);
  };

  const toggleSave = async () => {
    if (saving || !candidate) return;
    setSaving(true);
    const next = !saved;
    setSaved(next);
    try {
      if (next) {
        await apiRequest("/save-candidate", {
          method: "POST",
          body: JSON.stringify({ candidateId: candidate.userId, candidateType: "USER" }),
        });
      }
      const ids: string[] = JSON.parse(localStorage.getItem("freelanceit_savedCandidates") || "[]");
      const updated = next
        ? Array.from(new Set([...ids, candidateId]))
        : ids.filter((i) => i !== candidateId);
      localStorage.setItem("freelanceit_savedCandidates", JSON.stringify(updated));
      showFeedback(next ? "Profil sauvegardé." : "Profil retiré.");
    } catch {
      showFeedback("Action enregistrée localement.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Chargement…</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!candidate) return null;

  const fullName = `${candidate.firstName} ${candidate.lastName}`.trim();
  const initials = (candidate.firstName[0] || "") + (candidate.lastName[0] || "");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {feedback && (
        <div className="fixed top-6 right-6 z-[100] rounded-xl bg-[#0a1628] text-white px-4 py-2 text-sm font-semibold shadow-lg">
          {feedback}
        </div>
      )}

      <Link
        href="/dashboard/recruteur/recherche-talents"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#00b8d9] transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" /> Retour à la CVthèque
      </Link>

      {/* Hero */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-5 flex-1">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0a1628] to-indigo-900 flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0">
              {initials.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0a1628] tracking-tight">{fullName}</h1>
              {candidate.title && <p className="text-sm font-semibold text-gray-500 mt-0.5">{candidate.title}</p>}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {candidate.location && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <HiOutlineMapPin className="w-4 h-4 text-gray-400" /> {candidate.location}
                  </span>
                )}
                {candidate.yearsOfExperience != null && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <HiOutlineBriefcase className="w-4 h-4 text-gray-400" /> {candidate.yearsOfExperience} ans d&apos;exp.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap lg:justify-end">
            {candidate.tjm != null && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0a1628] rounded-xl">
                <HiOutlineCurrencyEuro className="w-5 h-5 text-[#00b8d9]" />
                <p className="text-white font-black text-sm leading-tight">
                  {candidate.tjm}€<span className="text-gray-400 font-medium text-xs"> /jour</span>
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-emerald-700">{availabilityLabel(candidate.availability)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setContactOpen(true)}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
              style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 14px rgba(0,184,217,0.3)" }}
            >
              <HiOutlineChatBubbleLeftRight className="w-5 h-5" /> Proposer une mission
            </button>
            <button
              onClick={toggleSave}
              disabled={saving}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                saved
                  ? "bg-rose-50 border-rose-200 text-rose-500"
                  : "bg-white border-gray-200 text-gray-400 hover:text-rose-500 hover:border-rose-200"
              } disabled:opacity-60`}
              title="Sauvegarder le profil"
            >
              {saved ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <HiOutlineCheckBadge className="w-5 h-5 text-[#00b8d9]" /> À propos
            </h2>
            {candidate.bio ? (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{candidate.bio}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucune description renseignée.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
              <HiOutlineBriefcase className="w-5 h-5 text-[#00b8d9]" /> Expériences
            </h2>
            {candidate.experiences.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucune expérience renseignée.</p>
            ) : (
              <div className="space-y-6">
                {candidate.experiences.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-[#00b8d9]/30 pl-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {exp.company}
                          {exp.location ? ` · ${exp.location}` : ""}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-gray-500">
                        {formatRange(exp.startDate, exp.endDate, exp.currentlyWorking)}
                      </p>
                    </div>
                    {exp.description && (
                      <p className="mt-2 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
              <HiOutlineAcademicCap className="w-5 h-5 text-[#00b8d9]" /> Formations
            </h2>
            {candidate.educations.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucune formation renseignée.</p>
            ) : (
              <div className="space-y-4">
                {candidate.educations.map((ed) => (
                  <div key={ed.id} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">🎓</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900">{ed.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ed.school}
                        {ed.field ? ` · ${ed.field}` : ""}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatRange(ed.startDate, ed.endDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <HiOutlineComputerDesktop className="w-4 h-4 text-[#00b8d9]" /> Compétences
            </h2>
            {candidate.skills.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Aucune compétence renseignée.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((s) => (
                  <span key={s} className="px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {(candidate.linkedIn || candidate.portfolioUrl || candidate.phone) && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Contact & liens</h2>
              <div className="space-y-2 text-xs text-gray-600">
                {candidate.phone && <p>📞 {candidate.phone}</p>}
                {candidate.linkedIn && (
                  <a href={candidate.linkedIn} target="_blank" rel="noopener" className="block text-[#00b8d9] hover:underline">
                    LinkedIn
                  </a>
                )}
                {candidate.portfolioUrl && (
                  <a href={candidate.portfolioUrl} target="_blank" rel="noopener" className="block text-[#00b8d9] hover:underline">
                    Portfolio
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        candidateId={candidate.userId}
        candidateName={fullName}
      />
    </div>
  );
}
