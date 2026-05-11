"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HiBriefcase,
  HiMagnifyingGlass,
  HiMapPin,
  HiClock,
  HiCurrencyEuro,
  HiBuildingOffice2,
  HiAdjustmentsHorizontal,
  HiXMark,
  HiArrowPath,
  HiSparkles,
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
}

const CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger",
  "Agadir", "Meknès", "Oujda", "Kenitra", "Tétouan",
  "Salé", "Mohammedia", "El Jadida", "Béni Mellal", "Nador",
];

const CONTRACT_LABELS: Record<string, string> = {
  FREELANCE: "Freelance",
  CDI: "CDI",
  CDD: "CDD",
};

export default function OffresPublicPage() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [contractType, setContractType] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (location) params.set("location", location);
      if (contractType) params.set("contractType", contractType);
      if (remoteOnly) params.set("remote", "true");

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data?.jobs) {
        setJobs(json.data.jobs);
      }
    } catch (err) {
      console.error("[Offres] Fetch error:", err);
      setJobs([]);
    }
    setLoading(false);
  }, [search, location, contractType, remoteOnly]);

  useEffect(() => {
    const timer = setTimeout(fetchJobs, 300);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Il y a quelques minutes";
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Il y a ${days}j`;
    return d.toLocaleDateString("fr-FR");
  };

  const activeFiltersCount = [location, contractType, remoteOnly].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ═══ Header ═══ */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #0a1628 0%, #111d33 100%)" }}
      >
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <HiBriefcase className="w-6 h-6" style={{ color: "#00b8d9" }} />
          Offres de mission
        </h2>
        <p className="text-gray-400 text-sm mb-5">
          Découvrez les meilleures opportunités dans la tech française.
        </p>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 focus-within:border-[#00b8d9] transition-all">
            <HiMagnifyingGlass className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, compétence, entreprise..."
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-500 hover:text-white cursor-pointer" aria-label="Effacer la recherche">
                <HiXMark className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: showFilters ? "rgba(0,184,217,0.15)" : "rgba(255,255,255,0.05)",
              color: showFilters ? "#00b8d9" : "#94a3b8",
              border: `1px solid ${showFilters ? "rgba(0,184,217,0.3)" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            <HiAdjustmentsHorizontal className="w-4 h-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <span
                className="ml-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: "#00b8d9", color: "#fff" }}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/5">
            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Localisation
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 rounded-xl border border-white/10 text-sm text-white outline-none focus:border-[#00b8d9] transition-all cursor-pointer"
                style={{ colorScheme: "dark" }}
              >
                <option value="">Toutes les villes</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Contract Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Type de contrat
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 rounded-xl border border-white/10 text-sm text-white outline-none focus:border-[#00b8d9] transition-all cursor-pointer"
                style={{ colorScheme: "dark" }}
              >
                <option value="">Tous les types</option>
                <option value="FREELANCE">Freelance</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
              </select>
            </div>

            {/* Remote */}
            <div className="flex items-end">
              <label className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-xl border border-white/10 w-full cursor-pointer hover:border-[#00b8d9] transition-all">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#00b8d9]"
                />
                <span className="text-sm text-gray-300 font-medium">🏠 Remote uniquement</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Results count ═══ */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-bold" style={{ color: "#00b8d9" }}>
            {jobs.length}
          </span>{" "}
          offre{jobs.length !== 1 ? "s" : ""} disponible{jobs.length !== 1 ? "s" : ""}
          {(search || activeFiltersCount > 0) && (
            <span
              className="inline-flex items-center gap-1 ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "rgba(0,184,217,0.1)", color: "#00b8d9" }}
            >
              <HiSparkles className="w-3 h-3" /> Filtré
            </span>
          )}
        </p>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-[#00b8d9] hover:text-[#00b8d9] transition-all cursor-pointer"
          title="Rafraîchir"
          aria-label="Rafraichir les offres"
        >
          <HiArrowPath className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ═══ Job Grid ═══ */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <HiArrowPath className="w-8 h-8 text-gray-300 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-gray-400">Chargement des offres...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <HiMagnifyingGlass className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">Aucune offre trouvée</h3>
          <p className="text-sm text-gray-400 mt-1">
            Essayez de modifier vos critères de recherche ou revenez plus tard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} formatDate={formatDate} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Job Card (inline, reusing design from homepage)
   ═══════════════════════════════════════════════ */

function JobCard({
  job,
  formatDate,
}: {
  job: JobOffer;
  formatDate: (d: string) => string;
}) {
  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(0, 184, 217, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0 text-lg font-bold"
            style={{
              background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
              color: "rgba(10, 22, 40, 0.6)",
            }}
          >
            {job.company.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-[15px] leading-tight group-hover:text-[#00b8d9] transition-colors truncate">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
              <HiBuildingOffice2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.company}</span>
            </div>
          </div>
        </div>
        <span
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0"
          style={{
            backgroundColor:
              job.contractType === "FREELANCE"
                ? "rgba(0, 184, 217, 0.1)"
                : "rgba(99, 102, 241, 0.1)",
            color: job.contractType === "FREELANCE" ? "#00b8d9" : "#6366f1",
          }}
        >
          {CONTRACT_LABELS[job.contractType] || job.contractType}
        </span>
      </div>

      {/* Description preview */}
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{job.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.remote && (
          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[11px] font-medium border border-emerald-100">
            🏠 Remote
          </span>
        )}
        {job.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-0.5 rounded-lg bg-gray-50 text-gray-500 text-[11px] font-medium border border-gray-100"
          >
            {tag}
          </span>
        ))}
        {job.tags.length > 4 && (
          <span className="px-2.5 py-0.5 rounded-lg bg-gray-50 text-gray-400 text-[11px] font-medium border border-gray-100">
            +{job.tags.length - 4}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <HiMapPin className="w-3.5 h-3.5" />
          {job.location}
        </span>
        {job.tjm && (
          <span className="flex items-center gap-1 font-medium text-gray-600">
            <HiCurrencyEuro className="w-3.5 h-3.5" />
            {job.tjm}€/j
          </span>
        )}
        <span className="flex items-center gap-1">
          <HiClock className="w-3.5 h-3.5" />
          {formatDate(job.createdAt)}
        </span>
      </div>

      {/* CTA */}
      <Link
        href={`/offres/${job.id}`}
        className="mt-4 w-full py-2.5 text-sm font-semibold rounded-xl border transition-all duration-200 text-center block"
        style={{
          color: "#00b8d9",
          backgroundColor: "rgba(0, 184, 217, 0.05)",
          borderColor: "rgba(0, 184, 217, 0.2)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#00b8d9";
          e.currentTarget.style.color = "#ffffff";
          e.currentTarget.style.borderColor = "#00b8d9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 184, 217, 0.05)";
          e.currentTarget.style.color = "#00b8d9";
          e.currentTarget.style.borderColor = "rgba(0, 184, 217, 0.2)";
        }}
      >
        Découvrir →
      </Link>
    </div>
  );
}
