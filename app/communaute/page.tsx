"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import { useAuth } from "../lib/AuthContext";
import { apiRequest } from "../lib/api";
import {
  HiUserGroup, HiPencilSquare, HiXMark, HiPaperAirplane,
  HiDocumentText, HiChatBubbleLeftRight, HiLightBulb,
  HiEye, HiClock, HiCheckCircle, HiMagnifyingGlass,
} from "react-icons/hi2";

// ─── Types ───────────────────────────────────────────────────────

interface Author {
  id: string;
  role: string;
  profileCandidat?: { firstName: string; lastName: string; avatarUrl: string | null } | null;
  profileRecruteur?: { firstName: string; lastName: string; company: string; avatarUrl: string | null } | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  tags: string[];
  views: number;
  createdAt: string;
  author: Author;
}

// ─── Helpers ──────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  ARTICLE: HiDocumentText,
  DOCUMENT: HiDocumentText,
  QUESTION: HiChatBubbleLeftRight,
};
const TYPE_LABEL: Record<string, string> = { ARTICLE: "Article", DOCUMENT: "Document", QUESTION: "Question" };
const CAT_LABEL: Record<string, string> = { GENERAL: "Général", RETOUR_XP: "Retour XP", CONSEIL: "Conseil", OUTIL: "Outil", JURIDIQUE: "Juridique" };
const CAT_COLOR: Record<string, string> = { GENERAL: "#6b7280", RETOUR_XP: "#10b981", CONSEIL: "#00b8d9", OUTIL: "#f59e0b", JURIDIQUE: "#6366f1" };

function authorName(a: Author): string {
  if (a.profileCandidat) return `${a.profileCandidat.firstName} ${a.profileCandidat.lastName}`;
  if (a.profileRecruteur) return `${a.profileRecruteur.firstName} ${a.profileRecruteur.lastName}`;
  return "Anonyme";
}

function authorSub(a: Author): string {
  if (a.role === "RECRUTEUR" && a.profileRecruteur) return a.profileRecruteur.company;
  return a.role === "CANDIDAT" ? "Freelance IT" : a.role;
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return "Hier";
  return `Il y a ${d} jours`;
}

// ─── Create Post Modal ────────────────────────────────────────────

function CreatePostModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ title: "", content: "", type: "ARTICLE", category: "GENERAL", tags: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || form.content.trim().length < 20) {
      setError("Titre requis et contenu minimum 20 caractères."); return;
    }
    setError(""); setSaving(true);
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const r = await apiRequest("/community", { method: "POST", body: JSON.stringify({ ...form, tags }) });
    setSaving(false);
    if (r.success) { setDone(true); setTimeout(() => { onSuccess(); onClose(); }, 1800); }
    else setError(r.message || "Erreur.");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ animation: "fadeInUp 0.3s ease" }}>
        <div className="px-7 pt-7 pb-5" style={{ background: "linear-gradient(135deg,#0a1628,#111d33)" }}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"><HiXMark className="w-5 h-5" /></button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00b8d9]/20 flex items-center justify-center"><HiPencilSquare className="w-5 h-5 text-[#00b8d9]" /></div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Partager avec la communauté</h2>
              <p className="text-xs text-gray-400">Votre post sera visible après validation par l&apos;équipe.</p>
            </div>
          </div>
        </div>

        <div className="px-7 py-6 space-y-4">
          {done ? (
            <div className="text-center py-6">
              <HiCheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
              <p className="text-lg font-bold text-gray-900">Post soumis !</p>
              <p className="text-sm text-gray-500 mt-1">Il sera publié après validation.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#00b8d9]">
                    <option value="ARTICLE">Article</option>
                    <option value="DOCUMENT">Document</option>
                    <option value="QUESTION">Question</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Catégorie</label>
                  <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#00b8d9]">
                    <option value="GENERAL">Général</option>
                    <option value="RETOUR_XP">Retour XP</option>
                    <option value="CONSEIL">Conseil</option>
                    <option value="OUTIL">Outil</option>
                    <option value="JURIDIQUE">Juridique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Titre <span className="text-red-400">*</span></label>
                <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Mon retour d'expérience sur le freelance IT au Maroc" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#00b8d9]" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Contenu <span className="text-red-400">*</span></label>
                <textarea value={form.content} onChange={(e) => set("content", e.target.value)} rows={5} placeholder="Partagez votre expérience, conseil, question…" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#00b8d9] resize-none" />
                <p className="text-xs text-gray-400 text-right mt-0.5">{form.content.length} / 10000</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Tags <span className="text-gray-400 font-normal">(séparés par des virgules)</span></label>
                <input type="text" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="React, Freelance, Maroc" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#00b8d9]" />
              </div>

              {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

              <button onClick={submit} disabled={saving} className="w-full py-3.5 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:enabled:-translate-y-0.5 transition-all" style={{ backgroundColor: "#00b8d9", boxShadow: "0 8px 20px rgba(0,184,217,0.3)" }}>
                <HiPaperAirplane className="w-4 h-4" />
                {saving ? "Envoi…" : "Soumettre le post"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const Icon = TYPE_ICON[post.type] || HiDocumentText;
  const catColor = CAT_COLOR[post.category] || "#6b7280";
  const name = authorName(post.author);

  return (
    <div onClick={onClick} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#00b8d9]/20 transition-all cursor-pointer group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#00b8d9]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#00b8d9]/20 transition-colors">
          <Icon className="w-4.5 h-4.5 text-[#00b8d9]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: catColor + "15", color: catColor }}>{CAT_LABEL[post.category]}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{TYPE_LABEL[post.type]}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#00b8d9] transition-colors leading-snug">{post.title}</h3>
        </div>
      </div>

      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">{post.content}</p>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.slice(0, 4).map((t) => (
            <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-100">{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#0a1628,#00b8d9)" }}>
            {initials(name)}
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-700">{name}</p>
            <p className="text-[10px] text-gray-400">{authorSub(post.author)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><HiEye className="w-3.5 h-3.5" />{post.views}</span>
          <span className="flex items-center gap-1"><HiClock className="w-3.5 h-3.5" />{timeAgo(post.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Post Detail Modal ────────────────────────────────────────────

function PostDetailModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const name = authorName(post.author);
  const catColor = CAT_COLOR[post.category] || "#6b7280";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-7 pt-7 pb-5 flex-shrink-0" style={{ background: "linear-gradient(135deg,#0a1628,#111d33)" }}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"><HiXMark className="w-5 h-5" /></button>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: catColor + "30", color: catColor }}>{CAT_LABEL[post.category]}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{TYPE_LABEL[post.type]}</span>
          </div>
          <h2 className="text-lg font-extrabold text-white leading-snug">{post.title}</h2>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#00b8d9,#0a1628)" }}>
              {initials(name)}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{name}</p>
              <p className="text-[10px] text-gray-400">{authorSub(post.author)} · {timeAgo(post.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="px-7 py-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</p>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
              {post.tags.map((t) => (
                <span key={t} className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-500">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function CommunautePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Post | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const r = await apiRequest<{ posts: Post[]; total: number; pages: number }>(`/community?${params}`);
    if (r.success && r.data) {
      setPosts(r.data.posts);
      setTotal(r.data.total);
      setPages(r.data.pages);
    }
    setLoading(false);
  }, [page, search, category]);

  useEffect(() => { load(); }, [load]);

  const handlePublish = () => {
    if (!user) { setShowLogin(true); return; }
    setShowCreate(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8fafc" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-16" style={{ background: "linear-gradient(135deg,#0a1628,#1a2c4e)" }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00b8d9] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#00b8d9]/20 flex items-center justify-center">
                  <HiUserGroup className="w-5 h-5 text-[#00b8d9]" />
                </div>
                <h1 className="text-3xl font-extrabold text-white">Communauté</h1>
              </div>
              <p className="text-indigo-200 text-sm max-w-lg">Partagez vos expériences, conseils et ressources avec la communauté freelance IT du Maroc.</p>
              <p className="text-xs text-gray-500 mt-2">{total} publication{total !== 1 ? "s" : ""} approuvée{total !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={handlePublish}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-all hover:-translate-y-0.5 cursor-pointer"
              style={{ backgroundColor: "#00b8d9", boxShadow: "0 6px 16px rgba(0,184,217,0.4)" }}
            >
              <HiPencilSquare className="w-4 h-4" />
              Publier un post
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-6 py-6 w-full">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["", "RETOUR_XP", "CONSEIL", "OUTIL", "JURIDIQUE"].map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                style={category === cat
                  ? { backgroundColor: "#00b8d9", color: "#fff" }
                  : { backgroundColor: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }
                }
              >
                {cat === "" ? "Tout" : CAT_LABEL[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="max-w-5xl mx-auto px-6 pb-16 w-full">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Chargement…</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <HiLightBulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun post pour le moment.</p>
            <button onClick={handlePublish} className="mt-4 text-sm text-[#00b8d9] font-bold hover:underline cursor-pointer">
              Soyez le premier à partager →
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onClick={() => setSelected(post)} />
              ))}
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-9 h-9 rounded-xl text-sm font-bold transition-colors cursor-pointer"
                    style={p === page ? { backgroundColor: "#00b8d9", color: "#fff" } : { backgroundColor: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); load(); }} />}
      {selected && <PostDetailModal post={selected} onClose={() => setSelected(null)} />}
      {showLogin && <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />}
      {showRegister && <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} />}
    </div>
  );
}
