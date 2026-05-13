"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowTrendingUp, HiArrowRight } from "react-icons/hi2";

type TechStat = {
  skill: string;
  junior: number;
  senior: number;
  lead: number;
  demand: "high" | "medium" | "low";
};

const demandColor = {
  high: "text-emerald-600 bg-emerald-50",
  medium: "text-amber-600 bg-amber-50",
  low: "text-gray-500 bg-gray-100",
};
const demandLabel = { high: "Forte", medium: "Modérée", low: "Faible" };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Fallback data so the section is never empty (SSR + hydration safe)
const FALLBACK: TechStat[] = [
  { skill: "React",        junior: 450, senior: 750, lead: 1000, demand: "high" },
  { skill: "AWS",          junior: 500, senior: 850, lead: 1150, demand: "high" },
  { skill: "Python",       junior: 420, senior: 730, lead: 980,  demand: "high" },
  { skill: "DevOps",       junior: 500, senior: 850, lead: 1150, demand: "high" },
  { skill: "Data Science", junior: 500, senior: 850, lead: 1150, demand: "high" },
  { skill: "TypeScript",   junior: 450, senior: 750, lead: 1000, demand: "high" },
  { skill: "Spark",        junior: 550, senior: 900, lead: 1200, demand: "high" },
  { skill: "Node.js",      junior: 430, senior: 720, lead: 950,  demand: "high" },
];

export default function TjmStatsSection() {
  const [stats, setStats] = useState<TechStat[]>(FALLBACK);

  useEffect(() => {
    fetch(`${API_BASE}/stats/tjm`)
      .then((r) => r.json())
      .then((r) => {
        if (r.success && r.data?.stats?.length > 0) {
          setStats(r.data.stats.slice(0, 8));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 bg-[#0a1628]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border"
              style={{ color: "#00b8d9", backgroundColor: "rgba(0,184,217,0.08)", borderColor: "rgba(0,184,217,0.2)" }}>
              <HiArrowTrendingUp className="w-3.5 h-3.5" />
              Transparence marché
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              TJM par technologie<br />
              <span style={{ color: "#00b8d9" }}>au Maroc</span>
            </h2>
            <p className="text-gray-400 text-sm mt-3 max-w-md">
              Tarifs journaliers moyens pratiqués — basés sur les offres publiées sur la plateforme.
            </p>
          </div>
          <Link
            href="/stats-tjm"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors flex-shrink-0"
            style={{ color: "#00b8d9", borderColor: "rgba(0,184,217,0.3)" }}
          >
            Voir tous les TJM <HiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.skill}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 hover:border-[#00b8d9]/30 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black bg-white/10 group-hover:bg-[#00b8d9]/20 transition-colors">
                  {s.skill.slice(0, 2).toUpperCase()}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${demandColor[s.demand]}`}>
                  {demandLabel[s.demand]}
                </span>
              </div>

              <div className="font-bold text-white mb-1 text-sm">{s.skill}</div>

              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-500">Junior</span>
                  <span className="text-[11px] font-semibold text-gray-400">{s.junior}€/j</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-400">Senior</span>
                  <span className="text-sm font-black text-white">{s.senior}€/j</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-500">Lead</span>
                  <span className="text-[11px] font-semibold text-gray-400">{s.lead}€/j</span>
                </div>
              </div>

              {/* Visual bar: junior → lead */}
              <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: "#00b8d9", width: `${Math.round((s.senior / s.lead) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <p className="text-sm text-gray-500">
            * Données issues des offres FreelanceIT.ma + benchmarks marché. TJM en euros HT.
          </p>
          <Link
            href="/stats-tjm"
            className="px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-transform hover:-translate-y-0.5 shadow-lg flex-shrink-0"
            style={{ backgroundColor: "#00b8d9" }}
          >
            Barème complet — 25 technos →
          </Link>
        </div>

      </div>
    </section>
  );
}
