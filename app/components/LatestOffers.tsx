"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiMapPin,
  HiClock,
  HiCurrencyEuro,
  HiBuildingOffice2,
  HiCheckBadge,
  HiArrowPath,
} from "react-icons/hi2";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ApiJob {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  contractType: string;
  tjm: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  tags: string[];
  createdAt: string;
  recruiter?: {
    profileRecruteur?: {
      id?: string | null;
      verificationStatus?: string | null;
    } | null;
  };
}

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

function formatSalary(job: ApiJob) {
  if (job.contractType === "FREELANCE" && job.tjm) return `${job.tjm}€/j`;
  if (job.salaryMin && job.salaryMax)
    return `${Math.round(job.salaryMin / 1000)}-${Math.round(job.salaryMax / 1000)}K€`;
  if (job.salaryMin) return `${Math.round(job.salaryMin / 1000)}K€+`;
  return null;
}

const tabs = [
  { key: "FREELANCE", label: "Freelance" },
  { key: "CDI", label: "CDI / CDD" },
];

function JobMiniCard({ job }: { job: ApiJob }) {
  const salary = formatSalary(job);
  const isVerified =
    job.recruiter?.profileRecruteur?.verificationStatus === "VERIFIED";
  const recruiterId = job.recruiter?.profileRecruteur?.id;
  const initials = (job.company || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(0,184,217,0.3)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{
              background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
              color: "rgba(10,22,40,0.6)",
            }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-[15px] leading-tight group-hover:text-[#00b8d9] transition-colors truncate">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
              <HiBuildingOffice2 className="w-3.5 h-3.5 flex-shrink-0" />
              {recruiterId ? (
                <Link
                  href={`/entreprise/${recruiterId}`}
                  className="truncate hover:text-[#00b8d9] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {job.company}
                </Link>
              ) : (
                <span className="truncate">{job.company}</span>
              )}
              {isVerified && (
                <HiCheckBadge
                  className="w-3.5 h-3.5 text-[#00b8d9] flex-shrink-0"
                  title="Entreprise vérifiée"
                />
              )}
            </div>
          </div>
        </div>
        <span
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0"
          style={{
            backgroundColor:
              job.contractType === "FREELANCE"
                ? "rgba(0,184,217,0.1)"
                : "rgba(99,102,241,0.1)",
            color:
              job.contractType === "FREELANCE" ? "#00b8d9" : "#6366f1",
          }}
        >
          {job.contractType === "FREELANCE" ? "Freelance" : job.contractType}
        </span>
      </div>

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
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <HiMapPin className="w-3.5 h-3.5" />
          {job.location}
        </span>
        {salary && (
          <span className="flex items-center gap-1 font-medium text-gray-600">
            <HiCurrencyEuro className="w-3.5 h-3.5" />
            {salary}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <HiClock className="w-3.5 h-3.5" />
          {formatDate(job.createdAt)}
        </span>
      </div>

      <Link
        href={`/offres/${job.id}`}
        className="mt-4 w-full py-2.5 text-sm font-semibold rounded-xl border transition-all duration-200 cursor-pointer block text-center"
        style={{
          color: "#00b8d9",
          backgroundColor: "rgba(0,184,217,0.05)",
          borderColor: "rgba(0,184,217,0.2)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#00b8d9";
          e.currentTarget.style.color = "#ffffff";
          e.currentTarget.style.borderColor = "#00b8d9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0,184,217,0.05)";
          e.currentTarget.style.color = "#00b8d9";
          e.currentTarget.style.borderColor = "rgba(0,184,217,0.2)";
        }}
      >
        Découvrir →
      </Link>
    </div>
  );
}

export default function LatestOffers() {
  const [active, setActive] = useState("FREELANCE");
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(
      `${API_BASE}/jobs?contractType=${active}&limit=6`
    )
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.jobs) {
          setJobs(json.data.jobs.slice(0, 6));
        } else {
          setJobs([]);
        }
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [active]);

  const displayedTab = tabs.find((t) => t.key === active)!;

  return (
    <section
      id="offres"
      className="py-16 sm:py-20"
      style={{ backgroundColor: "#f8fafc" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight">
            Dernières <span style={{ color: "#00b8d9" }}>offres</span>
          </h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            Découvrez les opportunités les plus récentes dans la tech française.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-xl p-1.5 border border-gray-100 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className="px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer"
                style={
                  active === tab.key
                    ? {
                        backgroundColor: "#00b8d9",
                        color: "#ffffff",
                        boxShadow: "0 4px 14px rgba(0,184,217,0.25)",
                      }
                    : { color: "#64748b" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-400">
            <HiArrowPath className="w-6 h-6 animate-spin mr-2" />
            Chargement des offres…
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">
              Aucune offre {displayedTab.label} disponible pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <JobMiniCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href={`/offres?contractType=${active}`}
            className="inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            style={{
              color: "#00b8d9",
              border: "2px solid rgba(0,184,217,0.2)",
            }}
          >
            Voir toutes les offres →
          </Link>
        </div>
      </div>
    </section>
  );
}
