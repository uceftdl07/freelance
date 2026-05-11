"use client";

import { useState, useMemo, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import { useAuth } from "../lib/AuthContext";
import {
  HiUserGroup,
  HiChatBubbleLeftRight,
  HiGlobeAlt,
  HiRocketLaunch,
  HiCheckCircle,
  HiChatBubbleLeft,
  HiCalendarDays,
  HiMapPin,
  HiSignal,
  HiArrowTopRightOnSquare,
  HiEnvelope,
  HiSparkles,
  HiMagnifyingGlass,
  HiXMark,
} from "react-icons/hi2";

// ─── Mock Data ──────────────────────────────────────────────────

const FORUM_TOPICS = [
  {
    id: 1,
    title: "TJM moyen pour un dev React en 2026 ?",
    author: "Yassine B.",
    replies: 24,
    tags: ["React", "TJM", "Freelance"],
    time: "Il y a 2h",
    hot: true,
  },
  {
    id: 2,
    title: "Avis sur le portage salarial vs. micro-entreprise",
    author: "Sophie M.",
    replies: 18,
    tags: ["Portage", "Statut", "Juridique"],
    time: "Il y a 5h",
    hot: true,
  },
  {
    id: 3,
    title: "Retour d'expérience : passer de CDI à freelance",
    author: "Thomas L.",
    replies: 31,
    tags: ["Transition", "Conseil"],
    time: "Il y a 1j",
    hot: false,
  },
  {
    id: 4,
    title: "Meilleurs outils de facturation pour indépendants ?",
    author: "Léa D.",
    replies: 12,
    tags: ["Outils", "Facturation"],
    time: "Il y a 2j",
    hot: false,
  },
];

const EVENTS = [
  {
    id: 1,
    title: "FreelanceIT Meetup Paris",
    date: "15 Mai 2026",
    time: "19:00 — 22:00",
    location: "Station F, Paris",
    type: "En présentiel",
    description:
      "Rejoignez 150+ freelances IT pour une soirée de networking, lightning talks et discussions informelles autour du freelancing tech.",
    spots: 42,
  },
  {
    id: 2,
    title: "Webinar : Optimiser son profil freelance",
    date: "22 Mai 2026",
    time: "14:00 — 15:30",
    location: "En ligne",
    type: "Webinar",
    description:
      "Découvrez les meilleures pratiques pour vous démarquer sur les plateformes et décrocher des missions premium.",
    spots: 118,
  },
  {
    id: 3,
    title: "Workshop : Négocier son TJM",
    date: "5 Juin 2026",
    time: "10:00 — 12:30",
    location: "Le Wagon, Lyon",
    type: "Workshop",
    description:
      "Un atelier interactif pour apprendre à valoriser vos compétences et négocier des tarifs à votre juste valeur.",
    spots: 25,
  },
];

const MENTORS = [
  {
    id: 1,
    name: "Alexandre Dupont",
    role: "Staff Engineer · 12 ans XP",
    tags: ["React", "Node.js", "Architecture"],
    avatar: "AD",
    color: "#00b8d9",
    rating: 4.9,
    sessions: 86,
  },
  {
    id: 2,
    name: "Claire Fontaine",
    role: "Lead DevOps · 10 ans XP",
    tags: ["AWS", "Kubernetes", "CI/CD"],
    avatar: "CF",
    color: "#8b5cf6",
    rating: 4.8,
    sessions: 64,
  },
  {
    id: 3,
    name: "Marc Benali",
    role: "CTO Freelance · 15 ans XP",
    tags: ["Strategy", "Scale-up", "Consulting"],
    avatar: "MB",
    color: "#10b981",
    rating: 5.0,
    sessions: 120,
  },
];

// ─── Toast Component ────────────────────────────────────────────
function Toast({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
      style={{
        transition: "opacity 0.3s ease, transform 0.3s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold shadow-2xl"
        style={{
          backgroundColor: "#0a1628",
          color: "#fff",
          border: "1px solid rgba(0,184,217,0.3)",
        }}
      >
        <HiCheckCircle className="w-5 h-5 text-[#00b8d9]" />
        {message}
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────
function EmptyState({ query, section }: { query: string; section: string }) {
  return (
    <div className="text-center py-12">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: "rgba(0,184,217,0.08)" }}
      >
        <HiMagnifyingGlass className="w-7 h-7 text-[#00b8d9]" />
      </div>
      <p className="text-sm font-bold text-gray-700 mb-1">
        Aucun résultat dans {section}
      </p>
      <p className="text-xs text-gray-400">
        Aucun élément ne correspond à &quot;<span className="font-semibold text-[#00b8d9]">{query}</span>&quot;
      </p>
    </div>
  );
}

// ─── Category Cards ─────────────────────────────────────────────
const CATEGORIES = [
  {
    icon: HiChatBubbleLeftRight,
    title: "Forum d'entraide",
    desc: "Posez vos questions, partagez vos expériences",
    anchor: "#forum",
  },
  {
    icon: HiGlobeAlt,
    title: "Événements",
    desc: "Meetups, webinars et conférences tech",
    anchor: "#evenements",
  },
  {
    icon: HiRocketLaunch,
    title: "Mentorat",
    desc: "Connectez-vous avec des experts du secteur",
    anchor: "#mentorat",
  },
];

// ─── Main Page ──────────────────────────────────────────────────
export default function CommunautePage() {
  const { user } = useAuth();
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([]);
  const [contactedMentors, setContactedMentors] = useState<number[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  };

  const handleEventRegister = (eventId: number) => {
    if (!user) { setShowLogin(true); return; }
    if (registeredEvents.includes(eventId)) return;
    setRegisteredEvents((prev) => [...prev, eventId]);
    showToast("Inscription confirmée !");
  };

  const handleMentorContact = (mentorId: number) => {
    if (!user) { setShowLogin(true); return; }
    if (contactedMentors.includes(mentorId)) return;
    setContactedMentors((prev) => [...prev, mentorId]);
    showToast("Demande envoyée !");
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmail("");
    showToast("Abonnement réussi !");
  };

  // ── Tag click → populate search ──
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    searchInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Filtering logic ──
  const q = searchQuery.trim().toLowerCase();

  const filteredForum = useMemo(
    () =>
      q === ""
        ? FORUM_TOPICS
        : FORUM_TOPICS.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
              t.author.toLowerCase().includes(q)
          ),
    [q]
  );

  const filteredEvents = useMemo(
    () =>
      q === ""
        ? EVENTS
        : EVENTS.filter(
            (e) =>
              e.title.toLowerCase().includes(q) ||
              e.description.toLowerCase().includes(q) ||
              e.type.toLowerCase().includes(q) ||
              e.location.toLowerCase().includes(q)
          ),
    [q]
  );

  const filteredMentors = useMemo(
    () =>
      q === ""
        ? MENTORS
        : MENTORS.filter(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              m.tags.some((tag) => tag.toLowerCase().includes(q)) ||
              m.role.toLowerCase().includes(q)
          ),
    [q]
  );

  const totalResults = filteredForum.length + filteredEvents.length + filteredMentors.length;

  return (
    <>
      <Navbar />
      <main className="flex-1" style={{ backgroundColor: "#f8fafc" }}>
        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden pt-16 pb-20 px-4"
          style={{
            background:
              "linear-gradient(135deg, #0a1628 0%, #111d33 60%, #0d2137 100%)",
          }}
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00b8d9] opacity-[0.04] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#8b5cf6] opacity-[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,184,217,0.2), rgba(139,92,246,0.15))",
                border: "1px solid rgba(0,184,217,0.15)",
              }}
            >
              <HiUserGroup className="w-10 h-10 text-[#00b8d9]" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight">
              La Communauté{" "}
              <span style={{ color: "#00b8d9" }}>FreelanceIT</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg mb-10 leading-relaxed">
              Rejoignez des milliers de freelances et recruteurs IT pour
              échanger, partager et grandir ensemble.
            </p>

            {/* ── Search Bar ── */}
            <div className="max-w-xl mx-auto mb-12">
              <div
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all"
                style={{
                  backgroundColor: "rgba(255,255,255,0.07)",
                  border: searchQuery
                    ? "1px solid rgba(0,184,217,0.4)"
                    : "1px solid rgba(255,255,255,0.1)",
                  boxShadow: searchQuery
                    ? "0 0 20px rgba(0,184,217,0.1)"
                    : "none",
                }}
              >
                <HiMagnifyingGlass className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher : React, DevOps, TJM, Meetup…"
                  className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
                  >
                    <HiXMark className="w-4 h-4" />
                  </button>
                )}
              </div>
              {q && (
                <p className="text-xs text-gray-500 mt-2.5">
                  <span className="font-bold text-[#00b8d9]">{totalResults}</span>{" "}
                  résultat{totalResults !== 1 ? "s" : ""} pour &quot;{searchQuery}&quot;
                </p>
              )}
            </div>

            {/* ── Category Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {CATEGORIES.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.title}
                    href={item.anchor}
                    className="group block bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-[#00b8d9]/30 hover:bg-white/[0.1]"
                  >
                    <Icon className="w-8 h-8 mx-auto mb-3 text-[#00b8d9] group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="font-bold text-white text-sm mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Section A: Forum ── */}
        <section id="forum" className="scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,184,217,0.1)" }}
              >
                <HiChatBubbleLeft className="w-5 h-5 text-[#00b8d9]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Discussions Récentes
                </h2>
                <p className="text-sm text-gray-500">
                  Les sujets les plus populaires du moment
                </p>
              </div>
            </div>

            {filteredForum.length > 0 ? (
              <div className="space-y-3">
                {filteredForum.map((topic) => (
                  <div
                    key={topic.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-[#00b8d9]/20 transition-all cursor-pointer group flex items-start sm:items-center gap-4 flex-col sm:flex-row"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0a1628] to-[#111d33] flex items-center justify-center text-xs font-bold text-[#00b8d9] flex-shrink-0">
                      {topic.author.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {topic.hot && (
                          <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                            🔥 Populaire
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-gray-800 group-hover:text-[#00b8d9] transition-colors truncate">
                        {topic.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span>{topic.author}</span>
                        <span>•</span>
                        <span>{topic.time}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                      {topic.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={(e) => { e.stopPropagation(); handleTagClick(tag); }}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-100 hover:border-[#00b8d9]/30 hover:text-[#00b8d9] hover:bg-[#00b8d9]/5 transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-400 flex-shrink-0">
                      <HiChatBubbleLeftRight className="w-4 h-4" />
                      <span>{topic.replies}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState query={searchQuery} section="les discussions" />
            )}

            {filteredForum.length > 0 && !q && (
              <div className="text-center mt-6">
                <button className="inline-flex items-center gap-2 text-sm font-bold text-[#00b8d9] hover:underline cursor-pointer">
                  Voir toutes les discussions
                  <HiArrowTopRightOnSquare className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <hr className="border-gray-200" />
        </div>

        {/* ── Section B: Events ── */}
        <section id="evenements" className="scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(139,92,246,0.1)" }}
              >
                <HiCalendarDays className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Prochains Événements
                </h2>
                <p className="text-sm text-gray-500">
                  Meetups, webinars et ateliers à ne pas manquer
                </p>
              </div>
            </div>

            {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {filteredEvents.map((event) => {
                const isRegistered = registeredEvents.includes(event.id);
                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-[#8b5cf6]/20 transition-all group"
                  >
                    {/* Event Header */}
                    <div
                      className="px-6 pt-6 pb-4"
                      style={{
                        background:
                          "linear-gradient(135deg, #0a1628 0%, #111d33 100%)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor:
                              event.type === "En présentiel"
                                ? "rgba(16,185,129,0.15)"
                                : event.type === "Webinar"
                                ? "rgba(0,184,217,0.15)"
                                : "rgba(245,158,11,0.15)",
                            color:
                              event.type === "En présentiel"
                                ? "#10b981"
                                : event.type === "Webinar"
                                ? "#00b8d9"
                                : "#f59e0b",
                          }}
                        >
                          {event.type === "En présentiel" && (
                            <HiMapPin className="w-3 h-3 inline mr-1" />
                          )}
                          {event.type === "Webinar" && (
                            <HiSignal className="w-3 h-3 inline mr-1" />
                          )}
                          {event.type}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-1 group-hover:text-[#00b8d9] transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                        <span className="flex items-center gap-1">
                          <HiCalendarDays className="w-3.5 h-3.5" />
                          {event.date}
                        </span>
                        <span>{event.time}</span>
                      </div>
                    </div>

                    {/* Event Body */}
                    <div className="px-6 py-5 space-y-4">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <HiMapPin className="w-3.5 h-3.5" />
                          {event.location}
                        </span>
                        <span className="font-semibold">
                          {event.spots} places restantes
                        </span>
                      </div>

                      <button
                        onClick={() => handleEventRegister(event.id)}
                        disabled={isRegistered}
                        className="w-full py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-default"
                        style={{
                          backgroundColor: isRegistered
                            ? "rgba(16,185,129,0.08)"
                            : "#00b8d9",
                          color: isRegistered ? "#10b981" : "#fff",
                          border: isRegistered
                            ? "1px solid rgba(16,185,129,0.2)"
                            : "none",
                          boxShadow: isRegistered
                            ? "none"
                            : "0 6px 16px rgba(0,184,217,0.3)",
                        }}
                      >
                        {isRegistered ? (
                          <>
                            <HiCheckCircle className="w-4.5 h-4.5" />
                            Inscrit
                          </>
                        ) : (
                          "S'inscrire"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            ) : (
              <EmptyState query={searchQuery} section="les événements" />
            )}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <hr className="border-gray-200" />
        </div>

        {/* ── Section C: Mentors ── */}
        <section id="mentorat" className="scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
              >
                <HiSparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Nos Mentors
                </h2>
                <p className="text-sm text-gray-500">
                  Des experts prêts à vous accompagner
                </p>
              </div>
            </div>

            {filteredMentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {filteredMentors.map((mentor) => {
                const isContacted = contactedMentors.includes(mentor.id);
                return (
                  <div
                    key={mentor.id}
                    className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-emerald-100 transition-all group text-center"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-black text-white group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: mentor.color }}
                    >
                      {mentor.avatar}
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mb-0.5">
                      {mentor.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">{mentor.role}</p>

                    <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        ⭐ <span className="font-bold text-gray-700">{mentor.rating}</span>
                      </span>
                      <span>
                        <span className="font-bold text-gray-700">{mentor.sessions}</span> sessions
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                      {mentor.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-100 hover:border-[#00b8d9]/30 hover:text-[#00b8d9] hover:bg-[#00b8d9]/5 transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleMentorContact(mentor.id)}
                      disabled={isContacted}
                      className="w-full py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-default"
                      style={{
                        backgroundColor: isContacted
                          ? "rgba(16,185,129,0.08)"
                          : "transparent",
                        color: isContacted ? "#10b981" : "#0a1628",
                        border: isContacted
                          ? "1px solid rgba(16,185,129,0.2)"
                          : "1px solid #e5e7eb",
                      }}
                    >
                      {isContacted ? (
                        <>
                          <HiCheckCircle className="w-4.5 h-4.5" />
                          Demande envoyée
                        </>
                      ) : (
                        <>
                          <HiEnvelope className="w-4.5 h-4.5" />
                          Contacter
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            ) : (
              <EmptyState query={searchQuery} section="les mentors" />
            )}
          </div>
        </section>

        {/* ── Newsletter CTA ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div
            className="rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #0a1628 0%, #111d33 100%)",
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00b8d9] opacity-[0.06] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10">
              <HiUserGroup className="w-10 h-10 text-[#00b8d9] mx-auto mb-4" />
              <h3 className="text-xl font-extrabold text-white mb-2">
                Rejoignez la communauté
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                Recevez chaque semaine les meilleures discussions, événements et
                opportunités de mentorat.
              </p>
              <form
                onSubmit={handleNewsletter}
                className="flex items-center gap-2 max-w-md mx-auto"
              >
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-xl flex-1"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <HiEnvelope className="w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 text-white text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
                  style={{
                    backgroundColor: "#00b8d9",
                    boxShadow: "0 6px 16px rgba(0,184,217,0.3)",
                  }}
                >
                  S&apos;abonner
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer
        onNewsletterSubmit={(submittedEmail: string) => {
          if (submittedEmail.trim()) showToast("Abonnement réussi !");
        }}
      />

      <Toast message={toastMsg} visible={toastVisible} />

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </>
  );
}
