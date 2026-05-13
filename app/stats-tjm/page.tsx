"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import {
  HiArrowTrendingUp,
  HiChartBar,
  HiCpuChip,
  HiMagnifyingGlass,
  HiArrowDownTray,
} from "react-icons/hi2";

type TechStat = {
  skill: string;
  junior: number;
  senior: number;
  lead: number;
  demand: "high" | "medium" | "low";
  avgPosted: number | null;
  offersCount: number;
};

type Summary = {
  avgSeniorTjm: number;
  topTech: string;
  totalOffers: number;
  lastUpdated: string;
};

const demandLabel = { high: "Forte", medium: "Modérée", low: "Faible" };
const demandColor = {
  high: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-500",
};

const CATEGORIES: Record<string, string[]> = {
  "Frontend": ["React", "Next.js", "Vue.js", "Angular", "TypeScript"],
  "Backend": ["Node.js", "Python", "Java", "Go", "C#", "PHP"],
  "Cloud & DevOps": ["AWS", "Azure", "DevOps", "Docker", "Kubernetes", "Terraform"],
  "Data & IA": ["Data Science", "Spark", "Databricks", "SQL", "PostgreSQL", "MongoDB", "Elasticsearch"],
  "Autres": ["GraphQL"],
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function StatsTjmPage() {
  const [stats, setStats] = useState<TechStat[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [sortBy, setSortBy] = useState<"senior" | "junior" | "lead" | "demand">("demand");

  useEffect(() => {
    fetch(`${API_BASE}/stats/tjm`)
      .then((r) => r.json())
      .then((r) => {
        if (r.success) {
          setStats(r.data.stats);
          setSummary(r.data.summary);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ["Tous", ...Object.keys(CATEGORIES)];

  const filtered = stats
    .filter((s) => {
      if (search) {
        return s.skill.toLowerCase().includes(search.toLowerCase());
      }
      if (activeCategory !== "Tous") {
        return (CATEGORIES[activeCategory] || []).includes(s.skill);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "demand") {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.demand] - order[b.demand];
      }
      return b[sortBy] - a[sortBy];
    });

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50">

        {/* Hero */}
        <section className="bg-[#0a1628] py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 text-[#00b8d9] bg-[#00b8d9]/10 border border-[#00b8d9]/20">
              <HiArrowTrendingUp className="w-4 h-4" />
              Données marché — Maroc IT 2025
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight">
              Barème TJM par<br />
              <span style={{ color: "#00b8d9" }}>technologie au Maroc</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
              Consultez les tarifs journaliers moyens pratiqués au Maroc par stack technique et niveau d&apos;expérience. Données basées sur les offres publiées + benchmarks marché.
            </p>

            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="text-3xl font-black text-white">{summary.avgSeniorTjm}€</div>
                  <div className="text-xs text-gray-400 mt-1 font-semibold">TJM senior moyen</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="text-3xl font-black" style={{ color: "#00b8d9" }}>{summary.topTech}</div>
                  <div className="text-xs text-gray-400 mt-1 font-semibold">Techno la + demandée</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 col-span-2 sm:col-span-1">
                  <div className="text-3xl font-black text-white">{stats.length}</div>
                  <div className="text-xs text-gray-400 mt-1 font-semibold">Technologies analysées</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Controls */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-gray-200 flex-1 shadow-sm">
              <HiMagnifyingGlass className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Rechercher une technologie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent w-full text-sm outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            {/* Sort */}
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
              <HiChartBar className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-sm outline-none text-gray-700 cursor-pointer"
              >
                <option value="demand">Trier par demande</option>
                <option value="senior">TJM Senior ↓</option>
                <option value="lead">TJM Lead ↓</option>
                <option value="junior">TJM Junior ↓</option>
              </select>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setSearch(""); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? "text-white shadow-md"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#00b8d9] hover:text-[#00b8d9]"
                }`}
                style={activeCategory === cat ? { backgroundColor: "#00b8d9" } : {}}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-16 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Technologie</th>
                      <th className="text-center px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Demande</th>
                      <th className="text-right px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Junior</th>
                      <th className="text-right px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Senior</th>
                      <th className="text-right px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Lead / Expert</th>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Offres actives</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => (
                      <tr
                        key={s.skill}
                        className={`border-b border-gray-50 hover:bg-cyan-50/30 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/20"}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black"
                              style={{ backgroundColor: "#0a1628" }}>
                              {s.skill.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900">{s.skill}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${demandColor[s.demand]}`}>
                            {demandLabel[s.demand]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-semibold text-gray-700">{s.junior}€</span>
                          <span className="text-xs text-gray-400 ml-1">/j</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-black text-gray-900 text-base">{s.senior}€</span>
                          <span className="text-xs text-gray-400 ml-1">/j</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-semibold text-gray-700">{s.lead}€</span>
                          <span className="text-xs text-gray-400 ml-1">/j</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {s.offersCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#00b8d9]/10 text-[#00b8d9] text-xs font-bold">
                              {s.offersCount} offre{s.offersCount > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-16 text-gray-400 text-sm">Aucune technologie trouvée.</div>
                )}
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((s) => (
                  <div key={s.skill} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black"
                          style={{ backgroundColor: "#0a1628" }}>
                          {s.skill.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{s.skill}</div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${demandColor[s.demand]}`}>
                            {demandLabel[s.demand]}
                          </span>
                        </div>
                      </div>
                      {s.offersCount > 0 && (
                        <span className="text-xs font-bold text-[#00b8d9]">{s.offersCount} offre{s.offersCount > 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Junior", value: s.junior },
                        { label: "Senior", value: s.senior },
                        { label: "Lead", value: s.lead },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-3">
                          <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">{label}</div>
                          <div className="font-black text-gray-900 text-sm">{value}€<span className="text-[10px] text-gray-400">/j</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Note disclaimer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            * Données basées sur les offres publiées sur FreelanceIT.ma + benchmarks marché Maroc. TJM en euros HT.
            Mis à jour régulièrement.
          </p>

          {/* CTA */}
          <div className="mt-12 bg-[#0a1628] rounded-3xl p-8 sm:p-12 text-center">
            <HiCpuChip className="w-10 h-10 mx-auto mb-4" style={{ color: "#00b8d9" }} />
            <h2 className="text-2xl font-black text-white mb-3">Vérifiez votre TJM</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              Comparez votre tarif avec le marché et découvrez les missions qui correspondent à votre profil.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/offres"
                className="px-8 py-3 rounded-xl text-white font-bold text-sm transition-transform hover:-translate-y-0.5 shadow-md"
                style={{ backgroundColor: "#00b8d9" }}
              >
                Voir les offres
              </Link>
              <Link
                href="/dashboard/candidat/profil"
                className="px-8 py-3 rounded-xl font-bold text-sm border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                Compléter mon profil
              </Link>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
