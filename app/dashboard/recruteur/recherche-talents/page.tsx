"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { 
  HiMagnifyingGlass, 
  HiAdjustmentsHorizontal,
  HiOutlineUser,
  HiOutlineCurrencyEuro,
  HiMapPin
} from "react-icons/hi2";

type Talent = {
  id: string;
  firstName: string;
  lastName: string;
  availability: string;
  color: string;
  title: string;
  location: string;
  tags: string[];
  tjm: number;
};

export default function CVthequePage() {
  const PAGE_SIZE = 8;
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("");
  const [maxTjm, setMaxTjm] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedAvailability, setAppliedAvailability] = useState("");
  const [appliedMaxTjm, setAppliedMaxTjm] = useState("");
  const [sortBy, setSortBy] = useState<"PERTINENCE" | "TJM_ASC" | "TJM_DESC">("PERTINENCE");

  // Ajout pour charger les vrais profils
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTalents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedQuery) params.append("search", appliedQuery);
      if (appliedAvailability) params.append("availability", appliedAvailability);
      if (appliedMaxTjm) params.append("maxTjm", appliedMaxTjm);
      params.append("limit", "50");
      const res = await fetch(`/api/search/candidates?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTalents(data.data.candidates || []);
      } else {
        setError("Erreur lors du chargement des profils.");
      }
    } catch (e) {
      setError("Erreur lors du chargement des profils.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalents();
    // eslint-disable-next-line
  }, [appliedQuery, appliedAvailability, appliedMaxTjm]);

  const applyFilters = () => {
    setAppliedQuery(query.trim().toLowerCase());
    setAppliedAvailability(availability);
    setAppliedMaxTjm(maxTjm);
    setVisibleCount(PAGE_SIZE);
  };

  const resetFilters = () => {
    setQuery("");
    setAvailability("");
    setMaxTjm("");
    setAppliedQuery("");
    setAppliedAvailability("");
    setAppliedMaxTjm("");
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

  // Tri et filtrage côté client si besoin
  const filteredTalents = useMemo(() => {
    let base = talents;
    if (sortBy === "TJM_ASC") {
      base = [...base].sort((a, b) => (a.tjm || 0) - (b.tjm || 0));
    } else if (sortBy === "TJM_DESC") {
      base = [...base].sort((a, b) => (b.tjm || 0) - (a.tjm || 0));
    }
    return base;
  }, [talents, sortBy]);

  const sortLabel = sortBy === "PERTINENCE" ? "Pertinence" : sortBy === "TJM_ASC" ? "TJM croissant" : "TJM decroissant";
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
        {/* Search */}
        <div className="flex-1 flex items-center bg-gray-50 rounded-2xl px-5 py-3 border border-transparent focus-within:border-[#00b8d9]/50 transition-colors">
          <HiMagnifyingGlass className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Métier, compétence, technologie..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent w-full text-sm text-gray-700 outline-none placeholder-gray-400"
          />
        </div>

        {/* Availability */}
        <div className="flex items-center bg-gray-50 rounded-2xl px-5 py-3 border border-transparent focus-within:border-[#00b8d9]/50 transition-colors md:w-48">
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="bg-transparent w-full text-sm text-gray-700 outline-none cursor-pointer">
            <option value="">Disponibilité</option>
            <option value="immediat">Immédiate</option>
            <option value="1mois">Dans 1 mois</option>
            <option value="ecoute">À l'écoute</option>
          </select>
        </div>

        {/* TJM Max */}
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

        {/* Filters & Button */}
        <button onClick={resetFilters} className="px-5 flex items-center justify-center text-gray-500 hover:text-[#00b8d9] hover:bg-cyan-50 rounded-2xl transition-colors">
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
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-700">
          <span className="text-[#00b8d9]">{filteredTalents.length}</span> profils correspondants
        </p>
        <div className="text-sm text-gray-500">
          Trier par : <button onClick={cycleSort} className="font-semibold text-gray-800 hover:text-[#00b8d9] cursor-pointer">{sortLabel} ▾</button>
        </div>
      </div>

      {/* Talent Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedTalents.map((talent) => (
          <div key={talent.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-[#00b8d9]/30 transition-all duration-300 group flex flex-col relative overflow-hidden">
            
            {/* Top: Avatar & Name */}
            <div className="flex flex-col items-center text-center mb-5 relative z-10">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-md bg-gradient-to-br from-[#0a1628] to-indigo-900">
                  {talent.firstName[0]}{talent.lastName[0]}
                </div>
                {talent.availability === "Disponible" && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full"></div>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-[#00b8d9] transition-colors">{talent.firstName} {talent.lastName}</h3>
              <span className={`mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-block ${talent.color}`}>
                {talent.availability}
              </span>
            </div>

            {/* Center: Info & Tags */}
            <div className="flex-1 text-center mb-5 relative z-10">
              <p className="font-bold text-[#0a1628] text-sm mb-3">{talent.title}</p>
              
              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-4 font-medium">
                <HiMapPin className="w-3.5 h-3.5 text-gray-400" /> {talent.location}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {talent.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded text-[11px] font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom: TJM & Button */}
            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">TJM</span>
                <span className="font-black text-gray-900">{talent.tjm}€</span>
              </div>
              <Link href={`/dashboard/recruteur/recherche-talents/${talent.id}`} className="px-5 py-2 text-xs font-bold text-[#00b8d9] bg-[#00b8d9]/10 hover:bg-[#00b8d9] hover:text-white rounded-xl transition-colors inline-block text-center">
                Voir le profil
              </Link>
            </div>
            
          </div>
        ))}
      </div>

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

    </div>
  );
}
