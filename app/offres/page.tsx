"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  HiMagnifyingGlass,
  HiMapPin,
  HiBriefcase,
  HiClock,
  HiCurrencyEuro,
  HiArrowPath,
  HiBellAlert,
  HiChevronRight,
  HiOutlineBuildingOffice2,
  HiAdjustmentsHorizontal,
  HiXMark,
} from "react-icons/hi2";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
  createdAt: string;
}

const CONTRACT_LABELS: Record<string, string> = {
  FREELANCE: "Freelance",
  CDI: "CDI",
  CDD: "CDD",
};

const POPULAR_MISSIONS = [
  "Développeur Python", "Chef de projet IT", "Data Analyst", "DevOps Engineer", "Consultant SAP",
];

const TOP_CITIES = [
  "Paris", "Lyon", "Nantes", "Bordeaux", "Toulouse", "100% Remote",
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Il y a quelques minutes";
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return d.toLocaleDateString("fr-FR");
}

function OffresContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams?.get("search") || "");
  const [contractType, setContractType] = useState(searchParams?.get("contractType") || "");
  const [locationFilter, setLocationFilter] = useState(searchParams?.get("location") || "");

  // Re-sync state when URL params change (e.g. navbar submits new search)
  useEffect(() => {
    setSearch(searchParams?.get("search") || "");
    setLocationFilter(searchParams?.get("location") || "");
    setContractType(searchParams?.get("contractType") || "");
  }, [searchParams]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (contractType) params.set("contractType", contractType);
      if (locationFilter) params.set("location", locationFilter);

      const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data?.jobs) setJobs(json.data.jobs);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [search, contractType, locationFilter]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, 300);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  return (
    <>
      <Navbar />
      <main className="flex-1" style={{ backgroundColor: "#f8fafc" }}>

        {/* Header Search */}
        <div className="bg-[#0a1628] py-8 px-4 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full flex items-center bg-white rounded-xl px-4 py-3 shadow-inner">
              <HiMagnifyingGlass className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Métier, mot-clé ou entreprise"
                className="bg-transparent w-full text-sm text-gray-700 outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                  <HiXMark className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 w-full flex items-center bg-white rounded-xl px-4 py-3 shadow-inner">
              <HiMapPin className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Ville (Casablanca, Rabat...)"
                className="bg-transparent w-full text-sm text-gray-700 outline-none"
              />
            </div>
            <div className="w-full md:w-48 bg-white rounded-xl px-4 py-3 shadow-inner">
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="bg-transparent w-full text-sm text-gray-700 outline-none cursor-pointer"
              >
                <option value="">Type de contrat</option>
                <option value="FREELANCE">Freelance</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
              </select>
            </div>
            <button
              onClick={fetchJobs}
              className="w-full md:w-auto px-8 py-3 rounded-xl text-white font-bold text-sm shadow-lg"
              style={{ backgroundColor: "#00b8d9" }}
            >
              Rechercher
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left: Job Cards */}
            <div className="lg:col-span-8 space-y-4">
              <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <HiBriefcase className="w-5 h-5" style={{ color: "#00b8d9" }} />
                  Offres disponibles
                  <span className="text-gray-400 font-normal text-sm ml-1">
                    {loading ? "…" : `${jobs.length} offre${jobs.length !== 1 ? "s" : ""}`}
                  </span>
                </h1>
                <button
                  onClick={fetchJobs}
                  className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-[#00b8d9] hover:border-[#00b8d9] transition-all"
                >
                  <HiArrowPath className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                          <div className="h-3 bg-gray-200 rounded w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
                  <HiAdjustmentsHorizontal className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-700">Aucune offre trouvée</h3>
                  <p className="text-sm text-gray-400 mt-1">Modifiez vos critères ou revenez plus tard.</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5"
                  >
                    <div className="hidden sm:flex w-16 h-16 rounded-xl flex-shrink-0 items-center justify-center font-bold text-2xl text-white shadow-sm"
                      style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)" }}>
                      {job.company.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${job.contractType === "FREELANCE" ? "bg-[#00b8d9]/10 text-[#00b8d9]" : "bg-indigo-100 text-indigo-600"}`}>
                            {CONTRACT_LABELS[job.contractType] || job.contractType}
                          </span>
                          {job.remote && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-600">
                              Remote
                            </span>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <HiClock className="w-3.5 h-3.5" /> {formatDate(job.createdAt)}
                          </span>
                        </div>
                      </div>

                      <h2 className="text-lg font-bold text-[#0a1628] hover:text-[#00b8d9] transition-colors leading-tight mb-2">
                        {job.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-600 mb-3">
                        <span className="flex items-center gap-1 text-gray-900 font-bold">
                          <HiOutlineBuildingOffice2 className="w-4 h-4 text-gray-400" /> {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiMapPin className="w-4 h-4 text-gray-400" /> {job.location}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                        <div className="flex flex-wrap gap-2">
                          {job.tags.slice(0, 5).map((tag) => (
                            <span key={tag} className="px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded text-[11px] font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          {job.tjm != null && (
                            <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                              <HiCurrencyEuro className="w-4 h-4 text-gray-400" />
                              {job.tjm}€<span className="text-xs text-gray-500 font-normal">/jour</span>
                            </span>
                          )}
                          <Link
                            href={`/offres/${job.id}`}
                            className="px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm inline-block"
                            style={{ backgroundColor: "#00b8d9" }}
                          >
                            Voir l'offre
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right: Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Alerte Email */}
              <div className="bg-white rounded-xl border-l-4 p-5 shadow-sm"
                style={{ borderLeftColor: "#00b8d9", border: "1px solid #f1f5f9", borderLeft: "4px solid #00b8d9" }}>
                <div className="flex items-center gap-3 mb-2">
                  <HiBellAlert className="w-6 h-6" style={{ color: "#00b8d9" }} />
                  <h3 className="font-bold text-gray-900">Créer une alerte e-mail</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Soyez le premier informé des nouvelles missions correspondant à vos critères.
                </p>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg mb-2 outline-none focus:border-[#00b8d9]"
                />
                <button className="w-full py-2 text-sm font-bold text-white rounded-lg" style={{ backgroundColor: "#0a1628" }}>
                  M'alerter
                </button>
              </div>

              {/* Villes */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  Rechercher par ville
                </h3>
                <ul className="space-y-3">
                  {TOP_CITIES.map((city, i) => (
                    <li key={i}>
                      <button
                        onClick={() => setLocationFilter(city === "100% Remote" ? "" : city)}
                        className="w-full flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-sm text-gray-600 group-hover:text-[#00b8d9] transition-colors">{city}</span>
                        <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#00b8d9]" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missions populaires */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                  Missions populaires
                </h3>
                <ul className="space-y-3">
                  {POPULAR_MISSIONS.map((mission, i) => (
                    <li key={i}>
                      <button
                        onClick={() => setSearch(mission)}
                        className="w-full flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-sm text-gray-600 group-hover:text-[#00b8d9] transition-colors">{mission}</span>
                        <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#00b8d9]" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function OffresPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <HiArrowPath className="w-8 h-8 animate-spin" style={{ color: "#00b8d9" }} />
      </div>
    }>
      <OffresContent />
    </Suspense>
  );
}
