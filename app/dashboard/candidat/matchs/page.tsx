"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";
import {
  HiSparkles,
  HiMapPin,
  HiCurrencyEuro,
  HiBuildingOffice2,
  HiCheckCircle,
  HiXCircle,
  HiArrowPath,
  HiInformationCircle,
} from "react-icons/hi2";

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
  createdAt: string;
};

function ScoreRing({ score }: { score: number }) {
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90">
        <circle cx="26" cy="26" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="4" />
        <circle
          cx="26" cy="26" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700">Excellent</span>;
  if (score >= 60) return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-700">Bon match</span>;
  if (score >= 40) return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-700">Partiel</span>;
  return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500">Faible</span>;
}

const CONTRACT_LABEL: Record<string, string> = { FREELANCE: "Freelance", CDI: "CDI", CDD: "CDD", STAGE: "Stage" };

export default function MatchsPage() {
  const [matches, setMatches] = useState<MatchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    const res = await apiRequest<{ jobs: MatchJob[]; total: number }>("/match/candidate");
    if (res.success && res.data) {
      setMatches(res.data.jobs);
      setTotal(res.data.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = matches.filter((m) => m.score >= minScore);
  const avgScore = matches.length > 0
    ? Math.round(matches.reduce((a, b) => a + b.score, 0) / matches.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="rounded-3xl p-7 text-white overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #0a1628 0%, #111d33 100%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00b8d9] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#00b8d9]/20 flex items-center justify-center">
              <HiSparkles className="w-5 h-5 text-[#00b8d9]" />
            </div>
            <div>
              <h1 className="text-xl font-black">Mes offres matchées</h1>
              <p className="text-gray-400 text-xs">Basé sur vos compétences, expérience et disponibilité</p>
            </div>
          </div>

          {/* Stats row */}
          {!loading && matches.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                <div className="text-xl font-black text-white">{total}</div>
                <div className="text-[11px] text-gray-400">offres matchées</div>
              </div>
              <div className="bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                <div className="text-xl font-black" style={{ color: "#00b8d9" }}>{avgScore}%</div>
                <div className="text-[11px] text-gray-400">score moyen</div>
              </div>
              <div className="bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                <div className="text-xl font-black text-white">{matches.filter(m => m.score >= 70).length}</div>
                <div className="text-[11px] text-gray-400">bons matchs (≥70%)</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-start gap-3">
        <HiInformationCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <span className="font-bold">Comment le score est calculé ?</span>
          <span className="text-blue-600"> — Compétences (70%) + Expérience (15%) + Disponibilité (15%). Un score ≥ 70% = profil très compatible.</span>
        </div>
      </div>

      {/* Filter by score */}
      {!loading && matches.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-gray-700">Filtrer :</span>
          {[0, 40, 60, 80].map((s) => (
            <button
              key={s}
              onClick={() => setMinScore(s)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                minScore === s
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#00b8d9] hover:text-[#00b8d9]"
              }`}
              style={minScore === s ? { backgroundColor: "#00b8d9" } : {}}
            >
              {s === 0 ? "Tous" : `≥ ${s}%`}
            </button>
          ))}
          <span className="text-sm text-gray-400 ml-2">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
          <button
            onClick={load}
            className="ml-auto p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-[#00b8d9] hover:text-[#00b8d9] transition-all"
            title="Rafraîchir"
          >
            <HiArrowPath className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
          <HiSparkles className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700 mb-1">
            {matches.length === 0 ? "Aucun match pour le moment" : "Aucun résultat pour ce filtre"}
          </h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            {matches.length === 0
              ? "Ajoutez des compétences à votre profil pour voir apparaître les offres compatibles."
              : "Essayez un score minimum moins élevé."}
          </p>
          {matches.length === 0 && (
            <Link
              href="/dashboard/candidat/profil"
              className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ backgroundColor: "#00b8d9" }}
            >
              Compléter mon profil
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#00b8d9]/30 transition-all p-5 flex gap-5">

              {/* Score ring */}
              <ScoreRing score={job.score} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-gray-900 text-base leading-tight">{job.title}</h3>
                      <ScoreBadge score={job.score} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <HiBuildingOffice2 className="w-3.5 h-3.5" />
                      <span>{job.company}</span>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex-shrink-0"
                    style={{
                      backgroundColor: job.contractType === "FREELANCE" ? "rgba(0,184,217,0.1)" : "rgba(99,102,241,0.1)",
                      color: job.contractType === "FREELANCE" ? "#00b8d9" : "#6366f1",
                    }}
                  >
                    {CONTRACT_LABEL[job.contractType] || job.contractType}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 my-2">
                  {job.tags.slice(0, 6).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[11px] font-semibold text-gray-600">
                      {tag}
                    </span>
                  ))}
                  {job.tags.length > 6 && (
                    <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[11px] text-gray-400">
                      +{job.tags.length - 6}
                    </span>
                  )}
                </div>

                {/* Meta + CTA */}
                <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <HiMapPin className="w-3.5 h-3.5" />
                      {job.remote ? "Remote" : job.location}
                    </span>
                    {job.tjm && (
                      <span className="flex items-center gap-1 font-semibold text-gray-700">
                        <HiCurrencyEuro className="w-3.5 h-3.5" />
                        {job.tjm}€/j
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/offres/${job.id}`}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-transform hover:-translate-y-0.5 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: "#00b8d9" }}
                  >
                    Voir l&apos;offre →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA to complete profile */}
      {!loading && matches.length > 0 && avgScore < 70 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <HiCheckCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Améliorez votre score moyen ({avgScore}%)</p>
              <p className="text-xs text-amber-700 mt-0.5">Ajoutez plus de compétences et complétez votre profil pour accéder à de meilleures opportunités.</p>
            </div>
          </div>
          <Link
            href="/dashboard/candidat/profil"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0"
            style={{ backgroundColor: "#f59e0b" }}
          >
            Compléter le profil
          </Link>
        </div>
      )}

      {/* No profile skills warning */}
      {!loading && matches.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-3">
          <HiXCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="font-bold text-gray-800 mb-1">Profil incomplet</p>
            <p>Le matching nécessite au minimum des <strong>compétences</strong> dans votre profil. Rendez-vous dans <Link href="/dashboard/candidat/profil" className="text-[#00b8d9] font-bold underline">Mon profil</Link> → étape 5 pour les ajouter.</p>
          </div>
        </div>
      )}

    </div>
  );
}
