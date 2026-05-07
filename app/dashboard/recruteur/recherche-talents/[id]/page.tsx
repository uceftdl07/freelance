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
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineGlobeAlt,
  HiOutlineComputerDesktop,
  HiOutlineCheckBadge,
  HiOutlineCurrencyEuro,
  HiOutlineCalendarDays,
  HiHeart,
} from "react-icons/hi2";

/* ───── Mock Data ───── */

const CANDIDATE = {
  name: "Thomas Lefèvre",
  avatar: "TL",
  avatarColor: "from-[#00b8d9] to-[#0a1628]",
  title: "Développeur Fullstack React / Node.js",
  location: "Paris, France",
  tjm: 550,
  experience: "5 ans",
  availability: "Disponible immédiatement",
  remote: "Hybride (2j télétravail)",
  zone: "Paris • Île-de-France • Remote",
  about:
    "Passionné par le développement web moderne, je conçois des applications performantes et scalables depuis 5 ans. Mon expertise couvre l'ensemble du stack JavaScript — de la conception d'APIs robustes en Node.js/Express au développement d'interfaces riches en React et Next.js. J'accorde une attention particulière à la qualité du code, aux tests automatisés et à l'expérience développeur (DX). Actuellement en recherche active de missions Freelance stimulantes dans des environnements tech-first.",
  skills: [
    "React", "Next.js", "TypeScript", "Node.js", "Express", "PostgreSQL",
    "MongoDB", "Prisma", "Docker", "AWS", "CI/CD", "Jest",
    "Tailwind CSS", "GraphQL", "Redis", "Git",
  ],
  languages: [
    { name: "Français", level: "Natif" },
    { name: "Anglais", level: "Courant (C1)" },
    { name: "Espagnol", level: "Intermédiaire (B1)" },
  ],
  experiences: [
    {
      id: 1,
      role: "Développeur Fullstack Senior",
      company: "Qonto",
      companyLogo: "Q",
      companyColor: "bg-indigo-500",
      type: "Freelance",
      dates: "Jan 2024 — Présent",
      duration: "1 an 4 mois",
      description: [
        "Refonte complète du dashboard client en React / TypeScript avec architecture micro-frontend.",
        "Mise en place d'un pipeline CI/CD avec GitHub Actions, réduisant le temps de déploiement de 60%.",
        "Collaboration avec 3 squads produit en méthodologie Agile (Scrum).",
      ],
    },
    {
      id: 2,
      role: "Développeur Backend Node.js",
      company: "BlaBlaCar",
      companyLogo: "B",
      companyColor: "bg-[#00b8d9]",
      type: "CDI",
      dates: "Sep 2021 — Déc 2023",
      duration: "2 ans 4 mois",
      description: [
        "Développement et maintenance d'APIs REST en Node.js / Express pour la plateforme de covoiturage.",
        "Migration de la base de données de MongoDB vers PostgreSQL avec Prisma ORM.",
        "Optimisation des performances (réduction de 40% du temps de réponse moyen des APIs).",
      ],
    },
    {
      id: 3,
      role: "Développeur Frontend React",
      company: "StartupFlow (Startup)",
      companyLogo: "S",
      companyColor: "bg-emerald-500",
      type: "CDI",
      dates: "Juil 2019 — Août 2021",
      duration: "2 ans 2 mois",
      description: [
        "Développement from scratch d'une application SaaS B2B en React et Redux.",
        "Intégration de systèmes de paiement (Stripe) et d'authentification (Auth0).",
        "Mentorat de 2 développeurs juniors.",
      ],
    },
  ],
  formations: [
    { diploma: "Master Informatique — spécialité Génie Logiciel", school: "Université Paris-Saclay", year: "2019" },
    { diploma: "Licence Informatique", school: "Université Paris-Saclay", year: "2017" },
  ],
  certifications: [
    "AWS Certified Solutions Architect – Associate",
    "Meta Front-End Developer Certificate",
  ],
};

/* ───── Component ───── */

export default function CandidateProfilePage() {
  const params = useParams<{ id: string }>();
  const candidateId = params?.id || "";
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const c = CANDIDATE;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("freelanceit_savedCandidates") || "[]";
      const ids: string[] = JSON.parse(raw);
      setSaved(ids.includes(candidateId));
    } catch {
      setSaved(false);
    }
  }, [candidateId]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 2500);
  };

  const toggleSave = async () => {
    if (saving) return;

    setSaving(true);
    const nextSaved = !saved;
    setSaved(nextSaved);

    try {
      if (nextSaved) {
        await apiRequest("/save-candidate", {
          method: "POST",
          body: JSON.stringify({ candidateId, candidateType: "PROFILE" }),
        });
      }

      const raw = localStorage.getItem("freelanceit_savedCandidates") || "[]";
      const current: string[] = JSON.parse(raw);
      const updated = nextSaved
        ? Array.from(new Set([...current, candidateId]))
        : current.filter((id) => id !== candidateId);
      localStorage.setItem("freelanceit_savedCandidates", JSON.stringify(updated));

      const rawMap = localStorage.getItem("freelanceit_savedCandidatesData") || "{}";
      const savedData = JSON.parse(rawMap) as Record<
        string,
        { id: string; name: string; title: string; location: string; tjm: number }
      >;

      if (nextSaved) {
        savedData[candidateId] = {
          id: candidateId,
          name: c.name,
          title: c.title,
          location: c.location,
          tjm: c.tjm,
        };
      } else {
        delete savedData[candidateId];
      }
      localStorage.setItem("freelanceit_savedCandidatesData", JSON.stringify(savedData));

      showFeedback(nextSaved ? "Profil sauvegarde." : "Profil retire des sauvegardes.");
    } catch {
      showFeedback("Action enregistree localement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {feedback && (
        <div className="fixed top-6 right-6 z-[100] rounded-xl bg-[#0a1628] text-white px-4 py-2 text-sm font-semibold shadow-lg">
          {feedback}
        </div>
      )}

      {/* Back */}
      <Link
        href="/dashboard/recruteur/recherche-talents"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#00b8d9] transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" /> Retour à la CVthèque
      </Link>

      {/* ─── Hero Card ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Avatar + Info */}
          <div className="flex items-center gap-5 flex-1">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${c.avatarColor} flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0`}>
              {c.avatar}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0a1628] tracking-tight">{c.name}</h1>
              <p className="text-sm font-semibold text-gray-500 mt-0.5">{c.title}</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <HiOutlineMapPin className="w-4 h-4 text-gray-400" /> {c.location}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <HiOutlineBriefcase className="w-4 h-4 text-gray-400" /> {c.experience} d&apos;exp.
                </span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-3 flex-wrap lg:justify-end">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0a1628] rounded-xl">
              <HiOutlineCurrencyEuro className="w-5 h-5 text-[#00b8d9]" />
              <div>
                <p className="text-white font-black text-sm leading-tight">{c.tjm}€<span className="text-gray-400 font-medium text-xs"> /jour</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-700">{c.availability}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setContactOpen(true)}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
              style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 14px rgba(0,184,217,0.3)" }}
            >
              <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
              Proposer une mission
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
              aria-label={saved ? "Retirer des sauvegardes" : "Sauvegarder le profil"}
            >
              {saved ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2-Column Body ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─── Main Column (70%) ─── */}
        <div className="lg:col-span-8 space-y-6">

          {/* About */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <HiOutlineCheckBadge className="w-5 h-5 text-[#00b8d9]" /> À propos
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{c.about}</p>
          </div>

          {/* Experiences */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
              <HiOutlineBriefcase className="w-5 h-5 text-[#00b8d9]" /> Expériences
            </h2>
            <div className="relative space-y-8">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gray-100"></div>

              {c.experiences.map((exp) => (
                <div key={exp.id} className="relative flex gap-5">
                  {/* Dot + Company logo */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`w-10 h-10 rounded-xl ${exp.companyColor} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                      {exp.companyLogo}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{exp.role}</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {exp.company} · <span className="text-[#00b8d9]">{exp.type}</span>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-gray-500">{exp.dates}</p>
                        <p className="text-[11px] text-gray-400">{exp.duration}</p>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {exp.description.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00b8d9] mt-1.5 flex-shrink-0"></span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formations */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
              <HiOutlineAcademicCap className="w-5 h-5 text-[#00b8d9]" /> Formations
            </h2>
            <div className="space-y-4">
              {c.formations.map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm flex-shrink-0">
                    🎓
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{f.diploma}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{f.school} · {f.year}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Certifications */}
            {c.certifications.length > 0 && (
              <div className="mt-6 pt-5 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Certifications</h3>
                <div className="flex flex-wrap gap-2">
                  {c.certifications.map((cert, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold">
                      <HiOutlineCheckBadge className="w-3.5 h-3.5" /> {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Sidebar (30%) ─── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Skills */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <HiOutlineComputerDesktop className="w-4 h-4 text-[#00b8d9]" /> Compétences techniques
            </h2>
            <div className="flex flex-wrap gap-2">
              {c.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:border-[#00b8d9] hover:text-[#00b8d9] transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <HiOutlineGlobeAlt className="w-4 h-4 text-[#00b8d9]" /> Langues
            </h2>
            <div className="space-y-3">
              {c.languages.map((lang, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{lang.name}</span>
                  <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">{lang.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mission Preferences */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <HiOutlineCalendarDays className="w-4 h-4 text-[#00b8d9]" /> Préférences de mission
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Mode de travail</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                  <HiOutlineComputerDesktop className="w-3.5 h-3.5 text-[#00b8d9]" /> {c.remote}
                </span>
              </div>
              <div className="h-px bg-gray-100"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Zone géographique</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                  <HiOutlineMapPin className="w-3.5 h-3.5 text-[#00b8d9]" /> {c.zone}
                </span>
              </div>
              <div className="h-px bg-gray-100"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Type de contrat</span>
                <span className="text-xs font-bold text-[#00b8d9]">Freelance uniquement</span>
              </div>
              <div className="h-px bg-gray-100"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Disponibilité</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {c.availability}
                </span>
              </div>
            </div>
          </div>

          {/* CTA sticky */}
          <div className="bg-gradient-to-br from-[#0a1628] to-[#1a2c4e] rounded-2xl p-6 text-center sticky top-24">
            <p className="text-white font-bold text-sm mb-1">Ce profil vous intéresse ?</p>
            <p className="text-gray-400 text-xs mb-4">Contactez {c.name.split(" ")[0]} directement.</p>
            <button
              onClick={() => setContactOpen(true)}
              className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
              style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 14px rgba(0,184,217,0.3)" }}
            >
              Proposer une mission
            </button>
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        candidateId={candidateId}
        candidateName={c.name}
      />
    </div>
  );
}
