"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "../../lib/api";
import {
  HiOutlineMapPin,
  HiOutlineCurrencyEuro,
  HiOutlineBriefcase,
  HiOutlineAcademicCap,
  HiOutlineGlobeAlt,
  HiOutlineLink,
  HiShare,
  HiCheckCircle,
} from "react-icons/hi2";

type Experience = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
};
type Education = {
  id: string;
  degree: string;
  school: string;
  startDate: string;
  endDate: string | null;
};
type PublicProfile = {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  bio: string | null;
  skills: string[];
  yearsOfExperience: number | null;
  availability: string;
  portfolioUrl: string | null;
  linkedIn: string | null;
  tjm: number | null;
  location: string | null;
  avatarUrl: string | null;
  experiences: Experience[];
  educations: Education[];
};

const AVAIL_LABEL: Record<string, string> = {
  DISPONIBLE: "Disponible",
  EN_MISSION: "En mission",
  BIENTOT_DISPONIBLE: "Bientôt disponible",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "Aujourd'hui";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await apiRequest<PublicProfile>(`/profiles/${id}`);
      if (r.success && r.data) setProfile(r.data);
      setLoading(false);
    })();
  }, [id]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: `Profil de ${profile?.firstName}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">Chargement…</div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-700 font-semibold">Profil introuvable</p>
        <Link href="/" className="text-sm text-[#00b8d9] font-bold hover:underline">Retour à l&apos;accueil</Link>
      </div>
    );
  }

  const initials = (profile.firstName[0] + profile.lastName[0]).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2c4e 100%)" }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00b8d9] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg" style={{ background: "linear-gradient(135deg, #00b8d9, #0a1628)" }}>
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-white">{profile.firstName} {profile.lastName}</h1>
              {profile.title && <p className="text-indigo-100 text-base mt-1">{profile.title}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-indigo-100">
                {profile.location && (
                  <span className="flex items-center gap-1.5"><HiOutlineMapPin className="w-4 h-4" />{profile.location}</span>
                )}
                {profile.tjm && (
                  <span className="flex items-center gap-1.5"><HiOutlineCurrencyEuro className="w-4 h-4" />{profile.tjm}€/jour</span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#00b8d9]/20 text-[#00b8d9] border border-[#00b8d9]/30">
                  {AVAIL_LABEL[profile.availability] || profile.availability}
                </span>
              </div>
            </div>
            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-sm font-bold rounded-xl border border-white/20 transition-colors cursor-pointer">
              {copied ? <><HiCheckCircle className="w-4 h-4" />Lien copié</> : <><HiShare className="w-4 h-4" />Partager</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {profile.bio && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">À propos</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{profile.bio}</p>
          </section>
        )}

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Compétences</h2>
          {profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="px-3 py-1 rounded-full text-xs font-bold bg-[#00b8d9]/10 text-[#00b8d9]">{s}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Aucune compétence renseignée</p>
          )}
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><HiOutlineBriefcase className="w-5 h-5 text-[#00b8d9]" /> Expériences</h2>
          {profile.experiences.length > 0 ? (
            <div className="space-y-5">
              {profile.experiences.map((e) => (
                <div key={e.id} className="border-l-2 border-[#00b8d9]/30 pl-4">
                  <p className="text-sm font-bold text-gray-900">{e.title}</p>
                  <p className="text-sm text-gray-600">{e.company}{e.location ? ` · ${e.location}` : ""}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDate(e.startDate)} — {fmtDate(e.endDate)}</p>
                  {e.description && <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{e.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Aucune expérience renseignée</p>
          )}
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><HiOutlineAcademicCap className="w-5 h-5 text-[#00b8d9]" /> Formation</h2>
          {profile.educations.length > 0 ? (
            <div className="space-y-4">
              {profile.educations.map((ed) => (
                <div key={ed.id} className="border-l-2 border-[#00b8d9]/30 pl-4">
                  <p className="text-sm font-bold text-gray-900">{ed.degree}</p>
                  <p className="text-sm text-gray-600">{ed.school}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDate(ed.startDate)} — {fmtDate(ed.endDate)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Aucune formation renseignée</p>
          )}
        </section>

        {(profile.portfolioUrl || profile.linkedIn) && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Liens</h2>
            <div className="space-y-2">
              {profile.portfolioUrl && (
                <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#00b8d9] hover:underline">
                  <HiOutlineGlobeAlt className="w-4 h-4" /> Portfolio
                </a>
              )}
              {profile.linkedIn && (
                <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#00b8d9] hover:underline">
                  <HiOutlineLink className="w-4 h-4" /> LinkedIn
                </a>
              )}
            </div>
          </section>
        )}

        <div className="text-center pt-6 pb-12">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            Profil FreelanceIT
          </Link>
        </div>
      </div>
    </div>
  );
}
