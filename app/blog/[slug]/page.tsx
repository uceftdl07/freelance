"use client";

import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiArrowLeft,
  HiArrowRight,
} from "react-icons/hi2";
import { ARTICLES } from "../data";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = ARTICLES.find((a) => a.slug === slug);

  if (!article) return notFound();

  const idx = ARTICLES.findIndex((a) => a.slug === slug);
  const prev = idx > 0 ? ARTICLES[idx - 1] : null;
  const next = idx < ARTICLES.length - 1 ? ARTICLES[idx + 1] : null;

  const related = ARTICLES.filter(
    (a) => a.slug !== slug && a.category === article.category
  ).slice(0, 3);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fafc]">
        {/* Hero image */}
        <div className="relative h-72 md:h-96 bg-gray-900 overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 sm:px-6 pb-8">
            <span
              className="inline-block px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white rounded-md mb-3"
              style={{ backgroundColor: article.categoryColor }}
            >
              {article.category}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              {article.title}
            </h1>
          </div>
        </div>

        {/* Content area */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          {/* Breadcrumb + meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#00b8d9] transition-colors">Accueil</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-[#00b8d9] transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-[#0a1628] font-medium truncate max-w-[200px]">{article.title}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <HiOutlineCalendar className="w-4 h-4" />
                {article.date}
              </span>
              <span className="flex items-center gap-1.5">
                <HiOutlineClock className="w-4 h-4" />
                {article.readTime} lecture
              </span>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg font-semibold text-[11px]">
                {article.author} · {article.authorRole}
              </span>
            </div>
          </div>

          {/* Abstract */}
          <p className="text-base text-gray-600 leading-relaxed mb-8 p-5 bg-white rounded-xl border-l-4 border-[#00b8d9] shadow-sm">
            {article.abstract}
          </p>

          {/* Article body */}
          <div
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 article-body"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          <style jsx global>{`
            .article-body h2 {
              font-size: 1.2rem;
              font-weight: 700;
              color: #0a1628;
              margin-top: 2rem;
              margin-bottom: 0.75rem;
            }
            .article-body p {
              color: #374151;
              line-height: 1.75;
              margin-bottom: 1rem;
            }
            .article-body ul, .article-body ol {
              padding-left: 1.5rem;
              margin-bottom: 1rem;
            }
            .article-body li {
              color: #374151;
              line-height: 1.75;
              margin-bottom: 0.25rem;
            }
            .article-body ul li { list-style-type: disc; }
            .article-body ol li { list-style-type: decimal; }
            .article-body strong { color: #0a1628; font-weight: 600; }
            .article-body code {
              background: #f1f5f9;
              padding: 0.15rem 0.4rem;
              border-radius: 0.25rem;
              font-size: 0.875rem;
              color: #0a1628;
            }
            .article-body a { color: #00b8d9; }
            .article-body a:hover { text-decoration: underline; }
          `}</style>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-8">
            {article.tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-sm rounded-lg font-medium hover:border-[#00b8d9] hover:text-[#00b8d9] transition-colors cursor-default"
              >
                #{t}
              </span>
            ))}
          </div>

          {/* Prev / Next navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
            {prev ? (
              <Link
                href={`/blog/${prev.slug}`}
                className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#00b8d9] transition-colors group"
              >
                <HiArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-[#00b8d9] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase mb-1">Article précédent</p>
                  <p className="text-sm font-bold text-gray-700 group-hover:text-[#00b8d9] leading-snug line-clamp-2">
                    {prev.title}
                  </p>
                </div>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/blog/${next.slug}`}
                className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#00b8d9] transition-colors group text-right"
              >
                <div className="flex-1">
                  <p className="text-[11px] text-gray-400 font-semibold uppercase mb-1">Article suivant</p>
                  <p className="text-sm font-bold text-gray-700 group-hover:text-[#00b8d9] leading-snug line-clamp-2">
                    {next.title}
                  </p>
                </div>
                <HiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#00b8d9] flex-shrink-0 mt-0.5" />
              </Link>
            ) : <div />}
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-extrabold text-[#0a1628] mb-6">
                Articles similaires
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {related.map((a) => (
                  <Link key={a.id} href={`/blog/${a.slug}`} className="group block">
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                      <div className="h-32 overflow-hidden bg-gray-200">
                        <img
                          src={a.image}
                          alt={a.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-bold text-gray-800 group-hover:text-[#00b8d9] transition-colors leading-snug line-clamp-2">
                          {a.title}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-2">{a.readTime} lecture</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back */}
          <div className="mt-10 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl border-2 transition-all hover:-translate-y-0.5"
              style={{ color: "#00b8d9", borderColor: "rgba(0,184,217,0.3)" }}
            >
              <HiArrowLeft className="w-4 h-4" />
              Retour au blog
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
