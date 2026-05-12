"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiArrowRight,
  HiTag,
  HiCheckCircle,
} from "react-icons/hi2";
import { ARTICLES, CATEGORIES, ARTICLES_PER_PAGE } from "./data";

export default function BlogPage() {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState("");
  const [newsletterDone, setNewsletterDone] = useState(false);

  const filtered = activeCat
    ? ARTICLES.filter((a) => a.category === activeCat)
    : ARTICLES;

  const totalPages = Math.ceil(filtered.length / ARTICLES_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ARTICLES_PER_PAGE,
    page * ARTICLES_PER_PAGE
  );

  const featured = paginated[0];
  const rest = paginated.slice(1);

  const handleCatClick = (key: string) => {
    setActiveCat((prev) => (prev === key ? null : key));
    setPage(1);
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setNewsletterDone(true);
  };

  const catCounts = CATEGORIES.map((c) => ({
    ...c,
    count: ARTICLES.filter((a) => a.category === c.key).length,
  }));

  const topArticles = ARTICLES.slice(0, 5);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fafc]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-4 font-medium">
              <Link href="/" className="hover:text-[#00b8d9] transition-colors">Accueil</Link>
              <span className="text-gray-300">/</span>
              <span className="text-[#0a1628]">Actualités et Conseils IT</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0a1628] tracking-tight">
              Plongez au cœur de l&apos;actualité Data, IA &amp; Cloud
            </h1>
            <p className="mt-4 text-gray-600 max-w-3xl leading-relaxed">
              Des articles de fond rédigés par des praticiens : architectures ML en production, pipelines de données, agents IA, MLOps et tendances du marché tech. Pas de buzzwords, que de la substance.
            </p>
          </div>
        </div>

        {/* Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Articles column */}
            <div className="lg:col-span-8">
              {/* Featured */}
              {featured && (
                <Link href={`/blog/${featured.slug}`} className="block mb-8 group">
                  <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
                    <div className="relative h-64 overflow-hidden bg-gray-200">
                      <img
                        src={featured.image}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span
                          className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white rounded-md shadow-md"
                          style={{ backgroundColor: featured.categoryColor }}
                        >
                          {featured.category}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-6 right-6">
                        <h2 className="text-xl font-bold text-white leading-tight">
                          {featured.title}
                        </h2>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{featured.abstract}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {featured.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] rounded-md font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                          {featured.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <HiOutlineClock className="w-4 h-4 text-gray-400" />
                          {featured.readTime} lecture
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {rest.map((article) => (
                  <Link key={article.id} href={`/blog/${article.slug}`} className="block group">
                    <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-gray-100 flex flex-col h-full">
                      <div className="relative h-44 overflow-hidden bg-gray-200">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white rounded-md shadow-md"
                            style={{ backgroundColor: article.categoryColor }}
                          >
                            {article.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h2 className="text-[15px] font-bold text-[#0a1628] group-hover:text-[#00b8d9] transition-colors leading-snug mb-2">
                          {article.title}
                        </h2>
                        <p className="text-xs text-gray-600 line-clamp-3 mb-4 flex-1">
                          {article.abstract}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {article.tags.slice(0, 3).map((t) => (
                            <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-medium">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 pt-3 border-t border-gray-50">
                          <span className="flex items-center gap-1">
                            <HiOutlineCalendar className="w-3.5 h-3.5 text-gray-400" />
                            {article.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <HiOutlineClock className="w-3.5 h-3.5 text-gray-400" />
                            {article.readTime} lecture
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="w-10 h-10 flex items-center justify-center rounded-lg font-bold border transition-colors"
                        style={
                          page === n
                            ? { backgroundColor: "#0a1628", color: "#fff", borderColor: "#0a1628" }
                            : { backgroundColor: "#fff", color: "#64748b", borderColor: "#e2e8f0" }
                        }
                      >
                        {n}
                      </button>
                    ))}
                    {page < totalPages && (
                      <button
                        onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="px-4 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 font-bold border border-gray-200 hover:border-[#00b8d9] hover:text-[#00b8d9] transition-colors"
                      >
                        Suivant <HiArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <p>Aucun article dans cette catégorie.</p>
                  <button onClick={() => setActiveCat(null)} className="mt-3 text-sm text-[#00b8d9] hover:underline">
                    Voir tous les articles
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">

              {/* Catégories */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-[#0a1628] mb-4 flex items-center gap-2">
                  <HiTag className="w-4 h-4 text-[#00b8d9]" />
                  Catégories
                </h3>
                <ul className="space-y-2">
                  {catCounts.map((cat) => (
                    <li key={cat.key}>
                      <button
                        onClick={() => handleCatClick(cat.key)}
                        className="w-full flex items-center justify-between group text-left rounded-lg px-2 py-1.5 transition-colors"
                        style={
                          activeCat === cat.key
                            ? { backgroundColor: `${cat.color}15` }
                            : {}
                        }
                      >
                        <span
                          className="text-sm font-medium flex items-center gap-2 transition-colors"
                          style={{ color: activeCat === cat.key ? cat.color : "#374151" }}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.label}
                        </span>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {cat.count}
                        </span>
                      </button>
                    </li>
                  ))}
                  {activeCat && (
                    <li>
                      <button
                        onClick={() => { setActiveCat(null); setPage(1); }}
                        className="w-full text-xs text-[#00b8d9] hover:underline text-left px-2 mt-1"
                      >
                        × Voir tous les articles
                      </button>
                    </li>
                  )}
                </ul>
              </div>

              {/* Les plus consultés */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#00b8d9]/5 rounded-bl-full" />
                <h3 className="text-base font-bold text-[#0a1628] mb-5 flex items-center gap-2 relative z-10">
                  <span className="w-1.5 h-6 bg-[#00b8d9] rounded-full" />
                  Les plus consultés
                </h3>
                <ul className="space-y-4 relative z-10">
                  {topArticles.map((article, i) => (
                    <li key={article.id}>
                      <Link href={`/blog/${article.slug}`} className="flex gap-3 group">
                        <div className="w-7 h-7 rounded-full bg-[#00b8d9]/10 text-[#00b8d9] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#00b8d9] group-hover:text-white transition-colors">
                          {i + 1}
                        </div>
                        <p className="text-sm font-semibold text-gray-700 group-hover:text-[#00b8d9] transition-colors leading-snug">
                          {article.title}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter */}
              <div className="bg-[#0a1628] rounded-2xl p-6 shadow-xl relative overflow-hidden text-center">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00b8d9]/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#00b8d9]/20 rounded-full blur-2xl" />
                <h3 className="text-base font-bold text-white mb-2 relative z-10">
                  Newsletter Data &amp; IA
                </h3>
                <p className="text-xs text-gray-300 mb-5 relative z-10">
                  Un condensé hebdomadaire : Data Science, MLOps et IA générative.
                </p>
                {newsletterDone ? (
                  <div className="relative z-10 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00b8d9]/20 text-[#00b8d9]">
                    <HiCheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-semibold">Inscription enregistrée !</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletter} className="relative z-10 space-y-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      className="w-full px-4 py-2.5 text-sm text-gray-900 rounded-xl outline-none focus:ring-2 focus:ring-[#00b8d9]"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 text-sm font-extrabold text-white rounded-xl transition-transform hover:-translate-y-0.5 shadow-lg"
                      style={{ backgroundColor: "#00b8d9" }}
                    >
                      S&apos;inscrire gratuitement
                    </button>
                  </form>
                )}
              </div>

              {/* Communauté */}
              <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 rounded-2xl p-6 shadow-sm text-center">
                <h3 className="text-base font-bold text-violet-900 mb-2">
                  Communauté tech
                </h3>
                <p className="text-sm text-violet-700/80 mb-4">
                  Posez vos questions sur l&apos;architecture de vos pipelines, débattez des meilleures pratiques MLOps ou partagez vos retours d&apos;expérience.
                </p>
                <Link
                  href="/communaute"
                  className="inline-block px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-colors bg-violet-600 hover:bg-violet-700"
                >
                  Rejoindre la communauté
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
