"use client";

import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "../../lib/api";
import {
  HiCheckCircle, HiXCircle, HiEye, HiClock, HiExclamationCircle,
} from "react-icons/hi2";

interface Author {
  id: string;
  email: string;
  role: string;
  profileCandidat?: { firstName: string; lastName: string } | null;
  profileRecruteur?: { firstName: string; lastName: string; company: string } | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  status: string;
  rejectReason: string | null;
  createdAt: string;
  author: Author;
}

const TYPE_LABEL: Record<string, string> = { ARTICLE: "Article", DOCUMENT: "Document", QUESTION: "Question" };
const CAT_LABEL: Record<string, string> = { GENERAL: "Général", RETOUR_XP: "Retour XP", CONSEIL: "Conseil", OUTIL: "Outil", JURIDIQUE: "Juridique" };
const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED"];

function authorName(a: Author) {
  if (a.profileCandidat) return `${a.profileCandidat.firstName} ${a.profileCandidat.lastName}`;
  if (a.profileRecruteur) return `${a.profileRecruteur.firstName} ${a.profileRecruteur.lastName}`;
  return a.email;
}

export default function AdminCommunautePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiRequest<{ posts: Post[] }>(`/admin/community?status=${tab}`);
    if (r.success && r.data) setPosts(r.data.posts);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const moderate = async (id: string, action: "APPROVE" | "REJECT") => {
    const body: Record<string, string> = { action };
    if (action === "REJECT" && rejectReason.trim()) body.rejectReason = rejectReason.trim();
    const r = await apiRequest(`/admin/community/${id}/moderate`, { method: "PATCH", body: JSON.stringify(body) });
    if (r.success) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      showToast(action === "APPROVE" ? "Post approuvé !" : "Post rejeté.");
      setExpanded(null);
      setRejectReason("");
    } else showToast(r.message || "Erreur.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#0a1628] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Modération communauté</h1>
        <p className="text-sm text-gray-500 mt-0.5">Approuvez ou rejetez les posts soumis par les membres.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer"
            style={tab === s
              ? { backgroundColor: "#00b8d9", color: "#fff" }
              : { backgroundColor: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }
            }
          >
            {s === "PENDING" ? "En attente" : s === "APPROVED" ? "Approuvés" : "Rejetés"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <HiCheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucun post {tab === "PENDING" ? "en attente" : tab === "APPROVED" ? "approuvé" : "rejeté"}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600">{TYPE_LABEL[post.type] || post.type}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">{CAT_LABEL[post.category] || post.category}</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">{post.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Par <span className="font-semibold text-gray-600">{authorName(post.author)}</span>
                      {" · "}{new Date(post.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setExpanded(expanded === post.id ? null : post.id)}
                      className="p-2 text-gray-400 hover:text-[#00b8d9] hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                      title="Voir le contenu"
                    >
                      <HiEye className="w-5 h-5" />
                    </button>
                    {tab === "PENDING" && (
                      <>
                        <button
                          onClick={() => moderate(post.id, "APPROVE")}
                          className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Approuver"
                        >
                          <HiCheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setExpanded(post.id === expanded ? null : post.id + "_reject")}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Rejeter"
                        >
                          <HiXCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content preview */}
                {expanded === post.id && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed border border-gray-100">
                    {post.content}
                  </div>
                )}

                {/* Reject form */}
                {expanded === post.id + "_reject" && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-red-500 font-semibold">
                      <HiExclamationCircle className="w-4 h-4" /> Raison du rejet (optionnel)
                    </div>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      placeholder="Ex: contenu inapproprié, hors sujet…"
                      className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm focus:border-red-400 outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => moderate(post.id, "REJECT")}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        Confirmer le rejet
                      </button>
                      <button
                        onClick={() => { setExpanded(null); setRejectReason(""); }}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Reject reason display */}
                {post.status === "REJECTED" && post.rejectReason && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                    <HiClock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    Raison : {post.rejectReason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
