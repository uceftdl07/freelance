"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../lib/api";
import ContactModal from "../ContactModal";

import {
  HiMagnifyingGlass,
  HiAdjustmentsHorizontal,
  HiOutlineCurrencyEuro,
  HiChatBubbleLeftEllipsis,
  HiMapPin,
  HiTrophy,
} from "react-icons/hi2";

type Talent = {
  id: string;       // profile id
  userId: string;   // user id (needed for messaging)
  firstName: string;
  lastName: string;
  availability: string;
  title: string;
  location: string;
  skills: string[];
  tjm: number | null;
};

const QUIZ_SKILLS = ["Python", "JavaScript", "React", "SQL", "DevOps", "Data Science", "Spark", "Databricks", "AWS", "Azure", "TypeScript", "Next.js", "MongoDB"];

function availabilityColor(availability: string) {
  if (availability === "DISPONIBLE") return "bg-emerald-100 text-emerald-700";
  if (availability === "BIENTOT_DISPONIBLE") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-500";
}

function availabilityLabel(availability: string) {
  if (availability === "DISPONIBLE") return "Disponible";
  if (availability === "BIENTOT_DISPONIBLE") return "Bientôt dispo";
  return "En mission";
}

export default function CVthequePage() {
  const PAGE_SIZE = 8;
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("");
  const [maxTjm, setMaxTjm] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [quizFilter, setQuizFilter] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedAvailability, setAppliedAvailability] = useState("");
  const [appliedMaxTjm, setAppliedMaxTjm] = useState("");
  const [appliedQuizFilter, setAppliedQuizFilter] = useState("");
  const [sortBy, setSortBy] = useState<"PERTINENCE" | "TJM_ASC" | "TJM_DESC">("PERTINENCE");

  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ContactModal state
  const [contactTarget, setContactTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchTalents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedQuery) params.append("search", appliedQuery);
      if (appliedAvailability) params.append("availability", appliedAvailability);
      if (appliedMaxTjm) params.append("maxTjm", appliedMaxTjm);
      if (appliedQuizFilter) params.append("quizSkill", appliedQuizFilter);
      params.append("limit", "50");

      const res = await apiRequest<{ candidates: Talent[] }>(`/search/candidates?${params.toString()}`);
      if (res.success && res.data) {
        setTalents(res.data.candidates || []);
      } else {
        setError("Erreur lors du chargement des profils.");
      }
    } catch {
      setError("Erreur lors du chargement des profils.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedQuery, appliedAvailability, appliedMaxTjm, appliedQuizFilter]);

  const applyFilters = () => {
    setAppliedQuery(query.trim());
    setAppliedAvailability(availability);
    setAppliedMaxTjm(maxTjm);
    setAppliedQuizFilter(quizFilter);
    setVisibleCount(PAGE_SIZE);
  };

  const resetFilters = () => {
    setQuery("");
    setAvailability("");
    setMaxTjm("");
    setQuizFilter("");
    setAppliedQuery("");
    setAppliedAvailability("");
    setAppliedMaxTjm("");
    setAppliedQuizFilter("");
    setVisibleCount(PAGE_SIZE);
  };

  const cycleSort = () => {
    setSortBy((current) => {
      if (current === "PERTINENCE") return "TJM_ASC";
      if (current === "TJM_ASC") return "TJM_DESC";
      return "PERTINENCE";
    });
    setVisibleCount(PAGE_SIZE);
  };

  const filteredTalents = useMemo(() => {
    let base = talents;
    if (sortBy === "TJM_ASC") base = [...base].sort((a, b) => (a.tjm ?? 0) - (b.tjm ?? 0));
    else if (sortBy === "TJM_DESC") base = [...base].sort((a, b) => (b.tjm ?? 0) - (a.tjm ?? 0));
    return base;
  }, [talents, sortBy]);

  const sortLabel =
    sortBy === "PERTINENCE" ? "Pertinence" : sortBy === "TJM_ASC" ? "TJM croissant" : "TJM décroissant";
  const displayedTalents = filteredTalents.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredTalents.length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recherche de profils (CVthèque)</h1>
        <p className="text-sm text-gray-500">Trouvez les meilleurs freelances et candidats pour vos projets tech.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-2 flex flex-col md:flex-row rounded-3xl shadow-sm border border-gray-100 gap-2">
        <div className="flex-1 flex items-center bg-gray-50 rounded-2xl px-5 py-3 border border-transparent focus-within:border-[#00b8d9]/50 transition-colors">
          <HiMagnifyingGlass className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Métier, compétence, technologie..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="bg-transparent w-full text-sm text-gray-700 outline-none placeholder-gray-400"
          />
        </div>

        <div className="flex items-center bg-gray-50 rounded-2xl px-5 py-3 border border-transparent focus-within:border-[#00b8d9]/50 transition-colors md:w-52">
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="bg-transparent w-full text-sm text-gray-700 outline-none cursor-pointer"
          >
            <option value="">Disponibilité</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="BIENTOT_DISPONIBLE">Bientôt disponible</option>
            <option value="EN_MISSION">En mission</option>
          </select>
        </div>

        <div className="flex items-center bg-gray-50 rounded-2xl px-5 py-3 border border-transparent focus-within:border-[#00b8d9]/50 transition-colors md:w-40">
          <HiOutlineCurrencyEuro className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="number"
            placeholder="TJM Max"
            value={maxTjm}
            onChange={(e) => setMaxTjm(e.target.value)}
            className="bg-transparent w-full text-sm text-gray-700 outline-none placeholder-gray-400"
          />
        </div>

        <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-transparent focus-within:border-[#00b8d9]/50 transition-colors md:w-52">
          <HiTrophy className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <select
            value={quizFilter}
            onChange={(e) => setQuizFilter(e.target.value)}
            className="bg-transparent w-full text-sm text-gray-700 outline-none cursor-pointer"
          >
            <option value="">QCM validé</option>
            {QUIZ_SKILLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <button
          onClick={resetFilters}
          className="px-5 flex items-center justify-center text-gray-500 hover:text-[#00b8d9] hover:bg-cyan-50 rounded-2xl transition-colors"
          title="Réinitialiser les filtres"
        >
          <HiAdjustmentsHorizontal className="w-5 h-5" />
        </button>
        <button
          onClick={applyFilters}
          className="px-8 py-3 rounded-2xl text-white font-bold text-sm transition-transform hover:-translate-y-0.5 shadow-md flex-shrink-0"
          style={{ backgroundColor: "#00b8d9" }}
        >
          Rechercher
        </button>
      </div>

      {/* Results Meta */}
      {error ? (
        <div className="text-center py-8 text-red-500 text-sm">{error}</div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-gray-700">
              <span style={{ color: "#00b8d9" }}>{filteredTalents.length}</span> profils correspondants
            </p>
            {appliedQuizFilter && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <HiTrophy className="w-3.5 h-3.5" /> {appliedQuizFilter} validé
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Trier par :{" "}
            <button
              onClick={cycleSort}
              className="font-semibold text-gray-800 hover:text-[#00b8d9] cursor-pointer"
            >
              {sortLabel} ▾
            </button>
          </div>
        </div>
      )}

      {/* Talent Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="w-20 h-20 rounded-full bg-gray-200" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedTalents.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Aucun profil trouvé. Essayez d'autres filtres.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedTalents.map((talent) => (
            <div
              key={talent.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-[#00b8d9]/30 transition-all duration-300 group flex flex-col relative overflow-hidden"
            >
              {/* Avatar & Name */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-md bg-gradient-to-br from-[#0a1628] to-indigo-900 mb-3">
                  {talent.firstName[0]}{talent.lastName[0]}
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-[#00b8d9] transition-colors">
                  {talent.firstName} {talent.lastName}
                </h3>
                <span className={`mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${availabilityColor(talent.availability)}`}>
                  {availabilityLabel(talent.availability)}
                </span>
              </div>

              {/* Info & Tags */}
              <div className="flex-1 text-center mb-5">
                {talent.title && (
                  <p className="font-bold text-[#0a1628] text-sm mb-3">{talent.title}</p>
                )}
                {talent.location && (
                  <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-4">
                    <HiMapPin className="w-3.5 h-3.5 text-gray-400" /> {talent.location}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {(talent.skills || []).slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded text-[11px] font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* TJM & Actions */}
              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">TJM</span>
                  <span className="font-black text-gray-900">
                    {talent.tjm != null ? `${talent.tjm}€` : "N/A"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setContactTarget({
                        id: talent.userId,
                        name: `${talent.firstName} ${talent.lastName}`,
                      })
                    }
                    className="p-2 text-[#00b8d9] bg-[#00b8d9]/10 hover:bg-[#00b8d9] hover:text-white rounded-xl transition-colors"
                    title="Contacter"
                  >
                    <HiChatBubbleLeftEllipsis className="w-5 h-5" />
                  </button>
                  <Link
                    href={`/dashboard/recruteur/recherche-talents/${talent.id}`}
                    className="px-5 py-2 text-xs font-bold text-[#00b8d9] bg-[#00b8d9]/10 hover:bg-[#00b8d9] hover:text-white rounded-xl transition-colors inline-block text-center"
                  >
                    Voir le profil
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      <div className="flex justify-center pt-8">
        <button
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          disabled={!canLoadMore}
          className="px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {canLoadMore ? "Afficher plus de profils" : "Tous les profils sont affichés"}
        </button>
      </div>

      {/* Contact Modal */}
      {contactTarget && (
        <ContactModal
          isOpen={!!contactTarget}
          onClose={() => setContactTarget(null)}
          candidateId={contactTarget.id}
          candidateName={contactTarget.name}
        />
      )}
    </div>
  );
}
