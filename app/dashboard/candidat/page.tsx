"use client";

import Link from "next/link";
import {
  HiOutlineEye,
  HiOutlineBriefcase,
  HiOutlineSparkles,
  HiArrowRight,
  HiTrophy,
} from "react-icons/hi2";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { apiRequest } from "../../lib/api";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_BASE = RAW_API_URL.endsWith("/api")
  ? RAW_API_URL
  : `${RAW_API_URL.replace(/\/$/, "")}/api`;

type CompletionSource = {
  form?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    title?: string;
    bio?: string;
    skills?: string[];
    yearsOfExperience?: number;
    availability?: string;
    tjm?: number;
    location?: string;
    linkedIn?: string;
    portfolioUrl?: string;
  };
  experiences?: Array<unknown>;
  educations?: Array<unknown>;
};

type CompletionResult = {
  percent: number;
  missing: Array<{ label: string; step: number }>;
};

function analyzeProfileCompletion(source: CompletionSource): CompletionResult {
  const form = source.form || {};
  const checks = [
    { label: "Prénom", ok: Boolean(form.firstName?.trim()), step: 1, weight: 8 },
    { label: "Nom", ok: Boolean(form.lastName?.trim()), step: 1, weight: 8 },
    { label: "Email", ok: Boolean(form.email?.trim()), step: 1, weight: 8 },
    { label: "Téléphone", ok: Boolean(form.phone?.trim()), step: 1, weight: 4 },
    { label: "Localisation", ok: Boolean(form.location?.trim()), step: 1, weight: 4 },
    { label: "LinkedIn", ok: Boolean(form.linkedIn?.trim()), step: 1, weight: 3 },
    { label: "Titre professionnel", ok: Boolean(form.title?.trim()), step: 2, weight: 10 },
    { label: "Bio", ok: Boolean(form.bio?.trim()), step: 2, weight: 8 },
    { label: "Compétences", ok: Array.isArray(form.skills) && form.skills.length > 0, step: 5, weight: 12 },
    {
      label: "Années d'expérience",
      ok: typeof form.yearsOfExperience === "number" && form.yearsOfExperience > 0,
      step: 2,
      weight: 6,
    },
    { label: "TJM", ok: typeof form.tjm === "number" && form.tjm > 0, step: 2, weight: 4 },
    { label: "Disponibilité", ok: Boolean(form.availability), step: 2, weight: 4 },
    { label: "Portfolio", ok: Boolean(form.portfolioUrl?.trim()), step: 2, weight: 5 },
    { label: "Au moins 1 expérience", ok: Array.isArray(source.experiences) && source.experiences.length > 0, step: 3, weight: 12 },
    { label: "Au moins 1 formation", ok: Array.isArray(source.educations) && source.educations.length > 0, step: 4, weight: 8 },
  ];

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const completedWeight = checks
    .filter((check) => check.ok)
    .reduce((sum, check) => sum + check.weight, 0);

  const missing = checks
    .filter((check) => !check.ok)
    .map((check) => ({ label: check.label, step: check.step }));

  return {
    percent: Math.round((completedWeight / totalWeight) * 100),
    missing,
  };
}

type MatchJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  contractType: string;
  tjm: number | null;
  tags: string[];
  score: number;
};

export default function CandidatDashboard() {
  const { token, user } = useAuth();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [missingFields, setMissingFields] = useState<Array<{ label: string; step: number }>>([]);
  const [matches, setMatches] = useState<MatchJob[]>([]);
  const [matchTotal, setMatchTotal] = useState(0);
  const [appsCount, setAppsCount] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [m, a, n] = await Promise.all([
        apiRequest<{ jobs: MatchJob[]; total: number }>("/match/candidate"),
        apiRequest<{ applications: Array<{ status: string }>; total: number }>("/applications/mine"),
        apiRequest<{ notifications: Array<{ type: string }>; unreadCount: number }>("/notifications"),
      ]);
      if (m.success && m.data) {
        setMatches(m.data.jobs);
        setMatchTotal(m.data.total);
      }
      if (a.success && a.data) {
        const active = a.data.applications.filter((x) => !["REJECTED", "WITHDRAWN"].includes(x.status));
        setAppsCount(active.length);
      }
      if (n.success && n.data) {
        setProfileViews(n.data.notifications.filter((x) => x.type === "PROFILE_SAVED" || x.type === "MESSAGE_RECEIVED").length);
      }
    })();
  }, [token]);

  useEffect(() => {
    const loadCompletion = async () => {
      if (!token) return;

      // 1) Prefer draft data (most up-to-date while editing)
      try {
        const draftRes = await fetch(`${API_BASE}/profile/draft`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (draftRes.ok) {
          const draftJson = await draftRes.json();
          if (draftJson?.success && draftJson?.data?.form) {
            const result = analyzeProfileCompletion(draftJson.data);
            setProfileCompletion(result.percent);
            setMissingFields(result.missing);
            return;
          }
        }
      } catch {
        // Continue with published profile fallback.
      }

      // 2) Fallback to published profile
      try {
        const meRes = await fetch(`${API_BASE}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) return;

        const meJson = await meRes.json();
        const p = meJson?.data?.profile;
        const email = meJson?.data?.email;
        if (!p) return;

        if (p.firstName) setFirstName(p.firstName);
        if (p.lastName) setLastName(p.lastName);

        const skills = Array.isArray(p.skills)
          ? p.skills
          : typeof p.skills === "string"
            ? (() => {
                try {
                  const parsed = JSON.parse(p.skills);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              })()
            : [];

        // Also read localStorage for experiences/educations (set by ProfileBuilder)
        let lsExperiences: unknown[] = [];
        let lsEducations: unknown[] = [];
        try {
          const lsExp = localStorage.getItem("profileBuilder_experiences");
          const lsEdu = localStorage.getItem("profileBuilder_educations");
          if (lsExp) lsExperiences = JSON.parse(lsExp);
          if (lsEdu) lsEducations = JSON.parse(lsEdu);
        } catch { /* ignore */ }

        const result = analyzeProfileCompletion({
          form: {
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email || email,
            phone: p.phone,
            title: p.title,
            bio: p.bio,
            skills,
            yearsOfExperience: p.yearsOfExperience,
            availability: p.availability,
            tjm: p.tjm,
            location: p.location,
            linkedIn: p.linkedIn,
            portfolioUrl: p.portfolioUrl,
          },
          experiences: lsExperiences,
          educations: lsEducations,
        });
        setProfileCompletion(result.percent);
        setMissingFields(result.missing);
      } catch {
        // Keep default 0 on failure.
      }
    };

    loadCompletion();
  }, [token]);

  const completionHint = useMemo(() => {
    if (profileCompletion >= 100) return "Profil complet. Excellent, vous maximisez votre visibilité.";
    if (profileCompletion >= 80) return "Profil presque complet. Ajoutez les derniers détails pour atteindre 100%.";
    if (profileCompletion >= 50) return "Bon début. Complétez votre expérience et vos compétences pour booster vos matchs.";
    return "Commencez par les informations essentielles pour améliorer votre visibilité.";
  }, [profileCompletion]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome banner */}
      <div className="relative rounded-3xl p-8 overflow-hidden shadow-sm" style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2c4e 100%)" }}>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00b8d9] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-[#00b8d9] opacity-10 rounded-full blur-2xl translate-y-1/2"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Bonjour {firstName ? `${firstName}${lastName ? ` ${lastName}` : ""}` : user?.email ? user.email.split("@")[0] : ""} 👋
          </h1>
          <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
            Bienvenue sur votre espace candidat. C'est ici que vous gérez vos informations, vos candidatures et que vous découvrez les missions qui matchent avec votre profil.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Progress & Main Stats */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Profile Completion Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 w-full">
                <div className="flex justify-between items-end mb-2">
                  <h3 className="font-bold text-gray-800 text-lg">Complétion du profil</h3>
                  <span className="text-sm font-extrabold" style={{ color: "#00b8d9" }}>{profileCompletion}%</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-1000 ease-out relative" 
                    style={{ width: `${profileCompletion}%`, backgroundColor: "#00b8d9" }}
                  >
                    <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 font-medium">{completionHint}</p>
                {missingFields.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {missingFields.slice(0, 4).map((item) => (
                      <Link
                        key={item.label}
                        href={`/dashboard/candidat/profil?step=${item.step}`}
                        className="px-2 py-1 text-[11px] rounded-md border border-gray-200 text-gray-600 hover:border-[#00b8d9] hover:text-[#00b8d9] transition-colors"
                      >
                        + {item.label}
                      </Link>
                    ))}
                    {missingFields.length > 4 && (
                      <span className="px-2 py-1 text-[11px] rounded-md bg-gray-100 text-gray-500">
                        +{missingFields.length - 4} autres
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 w-full sm:w-auto">
                <Link 
                  href="/dashboard/candidat/profil"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-[#00b8d9]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl inline-flex justify-center items-center gap-2"
                  style={{ backgroundColor: "#00b8d9" }}
                >
                  Compléter mon profil
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <HiOutlineEye className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-[#0a1628] mb-1">{profileViews}</p>
              <p className="text-sm font-medium text-gray-500">Vues / interactions</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <HiOutlineBriefcase className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-[#0a1628] mb-1">{appsCount}</p>
              <p className="text-sm font-medium text-gray-500">Candidatures en cours</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 rounded-xl bg-[#00b8d9]/10 text-[#00b8d9] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <HiOutlineSparkles className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-[#0a1628] mb-1">{matchTotal}</p>
              <p className="text-sm font-medium text-gray-500">Offres matchées</p>
            </div>

          </div>

        </div>

        {/* Right Column (4 cols): Secondary info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Matches Preview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Derniers matchs</h3>
            
            <div className="space-y-4">
              {matches.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Aucun match pour le moment. Ajoutez des compétences à votre profil.</p>
              ) : (
                matches.slice(0, 3).map((job) => (
                  <Link
                    key={job.id}
                    href={`/offres/${job.id}`}
                    className="block group border border-gray-50 bg-gray-50 rounded-xl p-4 hover:border-[#00b8d9]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-[#0a1628] text-sm group-hover:text-[#00b8d9] transition-colors line-clamp-1">{job.title}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00b8d9]/10 text-[#00b8d9] flex-shrink-0">
                        {job.score}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {job.company} • {job.remote ? "Remote" : job.location}
                    </p>
                  </Link>
                ))
              )}
            </div>

            <Link href="/dashboard/candidat/offres" className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-[#00b8d9] hover:text-[#0092ad] transition-colors w-full py-2 bg-[#00b8d9]/5 rounded-xl">
              Voir tous les matchs <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quiz CTA */}
          <Link href="/dashboard/candidat/quiz" className="block group">
            <div className="rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              style={{ background: "linear-gradient(135deg, #0a1628, #111d33)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#00b8d9]/20 flex items-center justify-center">
                  <HiTrophy className="w-5 h-5 text-[#00b8d9]" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Tests techniques</p>
                  <p className="text-xs text-gray-400">Score visible par les recruteurs</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Python, React, SQL, DevOps… Certifiez vos compétences avec des QCM de 10 questions.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-[#00b8d9] group-hover:gap-3 transition-all">
                Passer un test <HiArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
