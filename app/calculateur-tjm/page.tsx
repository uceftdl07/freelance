"use client";

import { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import {
  HiOutlineCalculator,
  HiArrowRight,
  HiCheckCircle,
  HiInformationCircle,
  HiArrowTrendingUp,
} from "react-icons/hi2";

const TECH_TJM: Record<string, { junior: number; senior: number; lead: number }> = {
  "React":         { junior: 450, senior: 750, lead: 1000 },
  "Next.js":       { junior: 480, senior: 780, lead: 1050 },
  "TypeScript":    { junior: 450, senior: 750, lead: 1000 },
  "Vue.js":        { junior: 400, senior: 680, lead: 900 },
  "Angular":       { junior: 420, senior: 700, lead: 950 },
  "Node.js":       { junior: 430, senior: 720, lead: 950 },
  "Python":        { junior: 420, senior: 730, lead: 980 },
  "Java":          { junior: 400, senior: 700, lead: 950 },
  "Go":            { junior: 500, senior: 820, lead: 1100 },
  "C#":            { junior: 390, senior: 680, lead: 920 },
  "PHP":           { junior: 320, senior: 550, lead: 750 },
  "AWS":           { junior: 500, senior: 850, lead: 1150 },
  "Azure":         { junior: 480, senior: 820, lead: 1100 },
  "DevOps":        { junior: 500, senior: 850, lead: 1150 },
  "Kubernetes":    { junior: 500, senior: 850, lead: 1150 },
  "Docker":        { junior: 430, senior: 720, lead: 950 },
  "Terraform":     { junior: 480, senior: 800, lead: 1100 },
  "Data Science":  { junior: 500, senior: 850, lead: 1150 },
  "Spark":         { junior: 550, senior: 900, lead: 1200 },
  "Databricks":    { junior: 580, senior: 950, lead: 1250 },
  "SQL":           { junior: 350, senior: 600, lead: 800 },
  "MongoDB":       { junior: 400, senior: 680, lead: 900 },
  "GraphQL":       { junior: 450, senior: 750, lead: 1000 },
};

const REMOTE_BONUS: Record<string, number> = {
  onsite: 0,
  hybrid: 0.05,
  full_remote: 0.10,
};

const LOCATION_FACTOR: Record<string, number> = {
  casablanca: 1.0,
  rabat: 0.95,
  marrakech: 0.90,
  other: 0.85,
};

const WORKING_DAYS = 220;

export default function CalculateurTjmPage() {
  const [tech, setTech] = useState("React");
  const [level, setLevel] = useState<"junior" | "senior" | "lead">("senior");
  const [remote, setRemote] = useState<"onsite" | "hybrid" | "full_remote">("hybrid");
  const [location, setLocation] = useState("casablanca");
  const [daysPerMonth, setDaysPerMonth] = useState(18);
  const [englishBonus, setEnglishBonus] = useState(false);
  const [certBonus, setCertBonus] = useState(false);

  const result = useMemo(() => {
    const base = TECH_TJM[tech]?.[level] ?? 600;
    const remoteMult = 1 + REMOTE_BONUS[remote];
    const locFactor = LOCATION_FACTOR[location] ?? 1;
    const bonuses = (englishBonus ? 0.05 : 0) + (certBonus ? 0.08 : 0);
    const tjm = Math.round(base * remoteMult * locFactor * (1 + bonuses));
    const monthly = Math.round(tjm * daysPerMonth);
    const annual = Math.round(tjm * WORKING_DAYS);
    const market = TECH_TJM[tech]?.[level] ?? base;
    const vsMarket = Math.round(((tjm - market) / market) * 100);
    return { tjm, monthly, annual, vsMarket };
  }, [tech, level, remote, location, daysPerMonth, englishBonus, certBonus]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50">

        {/* Hero */}
        <section className="bg-[#0a1628] py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "rgba(0,184,217,0.15)" }}>
              <HiOutlineCalculator className="w-7 h-7" style={{ color: "#00b8d9" }} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Calculateur TJM Freelance
            </h1>
            <p className="text-gray-400 text-base max-w-xl mx-auto">
              Estimez votre tarif journalier moyen selon votre stack, niveau et contexte — adapté au marché IT marocain.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Form */}
            <div className="lg:col-span-3 space-y-6">

              {/* Tech */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Votre technologie principale</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(TECH_TJM).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTech(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        tech === t
                          ? "text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#00b8d9] hover:text-[#00b8d9]"
                      }`}
                      style={tech === t ? { backgroundColor: "#00b8d9" } : {}}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Niveau d&apos;expérience</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["junior", "senior", "lead"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                        level === l
                          ? "border-[#00b8d9] text-[#00b8d9] bg-[#00b8d9]/5"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <div>{l === "lead" ? "Lead / Expert" : l.charAt(0).toUpperCase() + l.slice(1)}</div>
                      <div className="text-xs font-semibold mt-0.5 opacity-60">
                        {l === "junior" ? "0–3 ans" : l === "senior" ? "3–7 ans" : "7+ ans"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Remote & Location */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Mode de travail</label>
                  <select
                    value={remote}
                    onChange={(e) => setRemote(e.target.value as typeof remote)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00b8d9]"
                  >
                    <option value="onsite">100% Présentiel</option>
                    <option value="hybrid">Hybride (+5%)</option>
                    <option value="full_remote">Full Remote (+10%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ville principale</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#00b8d9]"
                  >
                    <option value="casablanca">Casablanca</option>
                    <option value="rabat">Rabat (-5%)</option>
                    <option value="marrakech">Marrakech (-10%)</option>
                    <option value="other">Autre ville (-15%)</option>
                  </select>
                </div>
              </div>

              {/* Days per month */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Jours facturés / mois :{" "}
                  <span style={{ color: "#00b8d9" }}>{daysPerMonth} jours</span>
                </label>
                <p className="text-xs text-gray-400 mb-4">
                  Inclut congés, prospection, formation (~{20 - daysPerMonth} jours non facturés)
                </p>
                <input
                  type="range"
                  min={10}
                  max={22}
                  value={daysPerMonth}
                  onChange={(e) => setDaysPerMonth(Number(e.target.value))}
                  className="w-full accent-[#00b8d9]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>10j</span><span>15j</span><span>18j</span><span>22j</span>
                </div>
              </div>

              {/* Bonus checkboxes */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Bonus compétitifs</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={englishBonus}
                      onChange={(e) => setEnglishBonus(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#00b8d9]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#00b8d9] transition-colors">
                      Anglais professionnel (+5%)
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={certBonus}
                      onChange={(e) => setCertBonus(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#00b8d9]"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-[#00b8d9] transition-colors">
                      Certification reconnue AWS / Azure / GCP (+8%)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Result panel */}
            <div className="lg:col-span-2">
              <div className="sticky top-6 space-y-4">

                {/* Main result */}
                <div className="bg-[#0a1628] rounded-2xl p-7 text-center shadow-xl">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Votre TJM estimé</div>
                  <div className="text-6xl font-black text-white mb-1">
                    {result.tjm}<span className="text-2xl text-gray-400">€</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-5">par jour (HT)</div>

                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold mb-6 ${
                    result.vsMarket >= 0
                      ? "bg-emerald-900/40 text-emerald-400"
                      : "bg-red-900/30 text-red-400"
                  }`}>
                    <HiArrowTrendingUp className="w-3.5 h-3.5" />
                    {result.vsMarket >= 0 ? "+" : ""}{result.vsMarket}% vs marché {tech}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">Mensuel ({daysPerMonth}j)</div>
                      <div className="text-lg font-black text-white">{result.monthly.toLocaleString("fr-FR")}€</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">Annuel</div>
                      <div className="text-lg font-black text-white">{result.annual.toLocaleString("fr-FR")}€</div>
                    </div>
                  </div>
                </div>

                {/* Market comparison */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <HiInformationCircle className="w-4 h-4 text-[#00b8d9]" />
                    <span className="text-sm font-bold text-gray-700">Fourchette marché {tech}</span>
                  </div>
                  <div className="space-y-2">
                    {(["junior", "senior", "lead"] as const).map((l) => (
                      <div key={l} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                        <span className={`text-xs font-bold ${level === l ? "text-[#00b8d9]" : "text-gray-500"}`}>
                          {l === "lead" ? "Lead" : l.charAt(0).toUpperCase() + l.slice(1)}
                          {level === l && " ← vous"}
                        </span>
                        <span className={`text-sm font-black ${level === l ? "text-[#00b8d9]" : "text-gray-700"}`}>
                          {TECH_TJM[tech]?.[l] ?? "—"}€/j
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
                  <div className="text-sm font-bold text-emerald-700 mb-3">Augmenter votre TJM</div>
                  <ul className="space-y-2">
                    {[
                      "Passez une certification cloud",
                      "Renforcez votre présence GitHub",
                      "Proposez du full remote (clients internationaux)",
                      "Complétez votre profil FreelanceIT",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-xs text-emerald-800">
                        <HiCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Link
                  href="/offres"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white text-sm font-bold transition-transform hover:-translate-y-0.5 shadow-md"
                  style={{ backgroundColor: "#00b8d9" }}
                >
                  Voir les missions à {result.tjm}€+ <HiArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/stats-tjm"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:border-[#00b8d9] hover:text-[#00b8d9] transition-colors"
                >
                  Barème TJM complet →
                </Link>
              </div>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
