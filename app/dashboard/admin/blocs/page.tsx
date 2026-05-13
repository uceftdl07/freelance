"use client";

import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "../../../lib/api";
import { HiPlus, HiPencilSquare, HiTrash, HiXMark, HiEye, HiEyeSlash } from "react-icons/hi2";

interface Block {
  id: string;
  page: string;
  title: string | null;
  content: string;
  type: string;
  isVisible: boolean;
  order: number;
}

const PAGES = ["HOME", "OFFRES", "COMMUNAUTE", "GLOBAL"];
const TYPES = ["BANNER", "ALERT", "INFO", "PROMO"];
const TYPE_COLORS: Record<string, string> = {
  BANNER: "#00b8d9", ALERT: "#ef4444", INFO: "#6366f1", PROMO: "#f59e0b",
};

const emptyBlock = { page: "HOME", title: "", content: "", type: "BANNER", isVisible: true, order: 0 };

export default function AdminBlocsPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "create" | Block>(null);
  const [form, setForm] = useState(emptyBlock);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    const r = await apiRequest<{ blocks: Block[] }>("/admin/blocks");
    if (r.success && r.data) setBlocks(r.data.blocks);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(emptyBlock); setModal("create"); };
  const openEdit = (b: Block) => {
    setForm({ page: b.page, title: b.title || "", content: b.content, type: b.type, isVisible: b.isVisible, order: b.order });
    setModal(b);
  };

  const handleSave = async () => {
    setSaving(true);
    const isEdit = modal !== "create" && modal !== null;
    const endpoint = isEdit ? `/admin/blocks/${(modal as Block).id}` : "/admin/blocks";
    const method = isEdit ? "PATCH" : "POST";
    const r = await apiRequest(endpoint, { method, body: JSON.stringify({ ...form, order: Number(form.order) }) });
    setSaving(false);
    if (r.success) { showToast(isEdit ? "Bloc mis à jour." : "Bloc créé."); setModal(null); load(); }
    else showToast(r.message || "Erreur.");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce bloc ?")) return;
    const r = await apiRequest(`/admin/blocks/${id}`, { method: "DELETE" });
    if (r.success) { setBlocks((prev) => prev.filter((b) => b.id !== id)); showToast("Bloc supprimé."); }
  };

  const toggleVisibility = async (b: Block) => {
    const r = await apiRequest(`/admin/blocks/${b.id}`, { method: "PATCH", body: JSON.stringify({ isVisible: !b.isVisible }) });
    if (r.success) setBlocks((prev) => prev.map((x) => x.id === b.id ? { ...x, isVisible: !x.isVisible } : x));
  };

  const grouped = PAGES.reduce((acc, p) => {
    acc[p] = blocks.filter((b) => b.page === p);
    return acc;
  }, {} as Record<string, Block[]>);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#0a1628] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Blocs de contenu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les bannières et messages affichés sur les pages du site.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 12px rgba(0,184,217,0.3)" }}
        >
          <HiPlus className="w-4 h-4" /> Nouveau bloc
        </button>
      </div>

      {loading ? <p className="text-sm text-gray-400">Chargement…</p> : (
        <div className="space-y-6">
          {PAGES.map((page) => (
            <div key={page}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{page}</h2>
              {grouped[page].length === 0 ? (
                <p className="text-xs text-gray-300 italic">Aucun bloc pour cette page.</p>
              ) : (
                <div className="space-y-2">
                  {grouped[page].sort((a, b) => a.order - b.order).map((b) => (
                    <div key={b.id} className={`bg-white rounded-xl p-4 shadow-sm border ${b.isVisible ? "border-gray-100" : "border-gray-100 opacity-50"}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[b.type] || "#6b7280" }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: (TYPE_COLORS[b.type] || "#6b7280") + "20", color: TYPE_COLORS[b.type] || "#6b7280" }}>{b.type}</span>
                            {b.title && <span className="text-sm font-bold text-gray-900">{b.title}</span>}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{b.content}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => toggleVisibility(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#00b8d9] hover:bg-cyan-50 transition-colors cursor-pointer" title={b.isVisible ? "Masquer" : "Afficher"}>
                            {b.isVisible ? <HiEye className="w-4 h-4" /> : <HiEyeSlash className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#00b8d9] hover:bg-cyan-50 transition-colors cursor-pointer">
                            <HiPencilSquare className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{modal === "create" ? "Nouveau bloc" : "Modifier le bloc"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><HiXMark className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Page</label>
                <select value={form.page} onChange={(e) => setForm((f) => ({ ...f, page: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#00b8d9]">
                  {PAGES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#00b8d9]">
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Titre (optionnel)</label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Nouveau sur FreelanceIT !" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#00b8d9]" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Contenu <span className="text-red-400">*</span></label>
              <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={3} placeholder="Texte de la bannière…" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#00b8d9] resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Ordre</label>
                <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#00b8d9]" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isVisible} onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))} className="w-4 h-4 accent-[#00b8d9]" />
                  <span className="text-sm font-semibold text-gray-700">Visible</span>
                </label>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving || !form.content.trim()} className="w-full py-3 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-50" style={{ backgroundColor: "#00b8d9" }}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
