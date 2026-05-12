"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { HiOutlineCalendar, HiOutlineClock, HiArrowRight, HiTag } from "react-icons/hi2";

const ARTICLES = [
  {
    id: 1,
    category: "INTELLIGENCE ARTIFICIELLE",
    title: "RAG vs Fine-tuning : quelle stratégie pour vos LLMs en production ?",
    abstract:
      "Le Retrieval-Augmented Generation (RAG) et le fine-tuning sont les deux grandes approches pour spécialiser un LLM sur votre domaine. Mais laquelle choisir ? RAG offre une mise à jour temps réel des connaissances sans coût de réentraînement, tandis que le fine-tuning améliore le style et la cohérence des réponses. On décortique les critères de choix : coût GPU, fraîcheur des données, latence et qualité attendue.",
    date: "8 mai 2026",
    readTime: "9 min",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=600&q=80",
    color: "#8b5cf6",
    author: "Sarah M.",
    tags: ["LLM", "RAG", "Fine-tuning", "NLP"],
  },
  {
    id: 2,
    category: "DATA ENGINEERING",
    title: "dbt, Airflow, Spark : construire une stack data moderne en 2026",
    abstract:
      "Les pipelines de données ont radicalement évolué. L'approche ELT a remplacé l'ETL classique, dbt transforme le SQL en asset versionnable, et les architectures Lakehouse unifient le data lake et le data warehouse. Retour d'expérience sur une migration complète vers une stack Snowflake + dbt Core + Airflow + Great Expectations — et les pièges à éviter.",
    date: "5 mai 2026",
    readTime: "11 min",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
    color: "#00b8d9",
    author: "Karim B.",
    tags: ["dbt", "Airflow", "Snowflake", "ELT"],
  },
  {
    id: 3,
    category: "MLOPS",
    title: "MLflow, Evidently, Prometheus : monitorer vos modèles ML en production",
    abstract:
      "Un modèle déployé n'est pas un modèle terminé. Le data drift, le concept drift et la dégradation silencieuse des performances sont les ennemis invisibles du MLOps. Découvrez comment mettre en place une surveillance complète avec MLflow pour le tracking, Evidently AI pour la détection de drift, et Grafana/Prometheus pour les métriques opérationnelles.",
    date: "2 mai 2026",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    color: "#10b981",
    author: "Léa D.",
    tags: ["MLOps", "MLflow", "Monitoring", "Drift"],
  },
  {
    id: 4,
    category: "CLOUD & INFRASTRUCTURE",
    title: "Kubernetes pour la Data : déployer Spark, Kafka et Flink sur K8s",
    abstract:
      "Kubernetes est devenu le standard pour les workloads data distribués. Spark on K8s remplace les clusters YARN figés, Kafka géré par Strimzi simplifie les opérations, et Flink offre du streaming sub-seconde. Cet article couvre les patterns d'architecture, la gestion des ressources GPU, et les stratégies de résilience pour les jobs critiques.",
    date: "28 avril 2026",
    readTime: "12 min",
    image: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=600&q=80",
    color: "#f59e0b",
    author: "Nicolas P.",
    tags: ["Kubernetes", "Spark", "Kafka", "Flink"],
  },
  {
    id: 5,
    category: "INTELLIGENCE ARTIFICIELLE",
    title: "Agents IA autonomes : architectures multi-agents avec LangGraph",
    abstract:
      "Les agents IA de 2026 ne se contentent plus de répondre à des prompts — ils planifient, utilisent des outils, s'auto-corrigent et collaborent entre eux. LangGraph apporte la notion de graphe d'états pour orchestrer des workflows complexes. On explore un cas concret : un agent de veille technologique qui scrape, résume et classe automatiquement des sources hétérogènes.",
    date: "24 avril 2026",
    readTime: "10 min",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80",
    color: "#ec4899",
    author: "Amina F.",
    tags: ["Agents", "LangGraph", "LLM", "Automation"],
  },
  {
    id: 6,
    category: "DATA SCIENCE",
    title: "Causalité vs corrélation : les erreurs classiques en analyse de données",
    abstract:
      "Les dashboards sont remplis de corrélations séduisantes qui masquent des biais de confusion. Le framework de Judea Pearl — DAGs causaux, do-calculus — permet de raisonner rigoureusement sur les effets réels. Cet article illustre, sur des cas réels en marketing et RH, comment passer de l'observation à la décision causale avec DoWhy et CausalML.",
    date: "20 avril 2026",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=600&q=80",
    color: "#ef4444",
    author: "Thomas R.",
    tags: ["Causalité", "DoWhy", "Stats", "Biais"],
  },
];

const TOP_ARTICLES = [
  "Vector databases : Pinecone, Weaviate ou pgvector ?",
  "Transformer l'architecture en 15 min avec Claude API",
  "Data Mesh : décentraliser la gouvernance des données",
  "Prompt engineering avancé : chain-of-thought et few-shot",
  "LLM quantization : rouler un 70B sur un seul GPU A100",
];

const CATEGORIES = [
  { label: "Intelligence Artificielle", count: 24, color: "#8b5cf6" },
  { label: "Data Engineering", count: 18, color: "#00b8d9" },
  { label: "MLOps", count: 12, color: "#10b981" },
  { label: "Cloud & Infra", count: 15, color: "#f59e0b" },
  { label: "Data Science", count: 21, color: "#ef4444" },
  { label: "Freelance IT", count: 9, color: "#ec4899" },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fafc]">

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-4 font-medium">
              <span>Accueil</span>
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

        {/* 2-Column Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Left Column: Articles (70%) */}
            <div className="lg:col-span-8">
              {/* Featured article */}
              <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group cursor-pointer mb-8">
                <div className="relative h-64 overflow-hidden bg-gray-200">
                  <img
                    src={ARTICLES[0].image}
                    alt={ARTICLES[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span
                      className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white rounded-md shadow-md"
                      style={{ backgroundColor: ARTICLES[0].color }}
                    >
                      {ARTICLES[0].category}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-6 right-6">
                    <h2 className="text-xl font-bold text-white leading-tight">
                      {ARTICLES[0].title}
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">{ARTICLES[0].abstract}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {ARTICLES[0].tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] rounded-md font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                      {ARTICLES[0].date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <HiOutlineClock className="w-4 h-4 text-gray-400" />
                      {ARTICLES[0].readTime} lecture
                    </span>
                  </div>
                </div>
              </article>

              {/* Grid articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {ARTICLES.slice(1).map((article) => (
                  <article
                    key={article.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group flex flex-col cursor-pointer"
                  >
                    <div className="relative h-44 overflow-hidden bg-gray-200">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span
                          className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white rounded-md shadow-md"
                          style={{ backgroundColor: article.color }}
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
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-12 flex justify-center">
                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0a1628] text-white font-bold shadow-md">
                    1
                  </button>
                  {[2, 3].map((n) => (
                    <button
                      key={n}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 font-bold border border-gray-200 hover:border-[#00b8d9] hover:text-[#00b8d9] transition-colors"
                    >
                      {n}
                    </button>
                  ))}
                  <span className="px-2 text-gray-400">...</span>
                  <button className="px-4 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 font-bold border border-gray-200 hover:border-[#00b8d9] hover:text-[#00b8d9] transition-colors">
                    Suivant <HiArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Sidebar */}
            <div className="lg:col-span-4 space-y-8">

              {/* Catégories */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-[#0a1628] mb-4 flex items-center gap-2">
                  <HiTag className="w-4 h-4 text-[#00b8d9]" />
                  Catégories
                </h3>
                <ul className="space-y-2">
                  {CATEGORIES.map((cat) => (
                    <li
                      key={cat.label}
                      className="flex items-center justify-between group cursor-pointer"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-[#00b8d9] transition-colors flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.label}
                      </span>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {cat.count}
                      </span>
                    </li>
                  ))}
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
                  {TOP_ARTICLES.map((article, i) => (
                    <li key={i} className="flex gap-3 group cursor-pointer">
                      <div className="w-7 h-7 rounded-full bg-[#00b8d9]/10 text-[#00b8d9] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#00b8d9] group-hover:text-white transition-colors">
                        {i + 1}
                      </div>
                      <p className="text-sm font-semibold text-gray-700 group-hover:text-[#00b8d9] transition-colors leading-snug">
                        {article}
                      </p>
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
                  Un condensé hebdomadaire des meilleures ressources en Data Science, MLOps et IA générative.
                </p>
                <div className="relative z-10 space-y-2">
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    className="w-full px-4 py-2.5 text-sm text-gray-900 rounded-xl outline-none focus:ring-2 focus:ring-[#00b8d9]"
                  />
                  <button
                    className="w-full py-2.5 text-sm font-extrabold text-white rounded-xl transition-transform hover:-translate-y-0.5 shadow-lg"
                    style={{ backgroundColor: "#00b8d9" }}
                  >
                    S&apos;inscrire gratuitement
                  </button>
                </div>
              </div>

              {/* Forum */}
              <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 rounded-2xl p-6 shadow-sm text-center">
                <h3 className="text-base font-bold text-violet-900 mb-2">
                  Communauté tech
                </h3>
                <p className="text-sm text-violet-700/80 mb-4">
                  Posez vos questions sur l&apos;architecture de vos pipelines, débattez des meilleures pratiques MLOps ou partagez vos retours d&apos;expérience avec d&apos;autres praticiens.
                </p>
                <button className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-colors bg-violet-600 hover:bg-violet-700">
                  Rejoindre la communauté
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
