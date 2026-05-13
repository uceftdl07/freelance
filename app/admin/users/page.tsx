"use client";

import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "../../lib/api";
import {
  HiMagnifyingGlass, HiTrash, HiPencilSquare, HiXMark, HiCheckCircle,
} from "react-icons/hi2";

interface User {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  profileCandidat?: { firstName: string; lastName: string } | null;
  profileRecruteur?: { firstName: string; lastName: string; company: string } | null;
}

const ROLES = ["CANDIDAT", "RECRUTEUR", "ADMIN"];

function userName(u: User) {
  if (u.profileCandidat) return `${u.profileCandidat.firstName} ${u.profileCandidat.lastName}`;
  if (u.profileRecruteur) return `${u.profileRecruteur.firstName} ${u.profileRecruteur.lastName} (${u.profileRecruteur.company})`;
  return "—";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    const r = await apiRequest<{ users: User[]; total: number; pages: number }>(`/admin/users?${params}`);
    if (r.success && r.data) {
      setUsers(r.data.users);
      setTotal(r.data.total);
      setPages(r.data.pages);
    }
    setLoading(false);
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleUpdateRole = async () => {
    if (!editing || !newRole) return;
    const r = await apiRequest(`/admin/users/${editing.id}`, { method: "PATCH", body: JSON.stringify({ role: newRole }) });
    if (r.success) {
      setUsers((prev) => prev.map((u) => u.id === editing.id ? { ...u, role: newRole } : u));
      showToast("Rôle mis à jour.");
      setEditing(null);
    } else showToast(r.message || "Erreur.");
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Supprimer ${u.email} ? Cette action est irréversible.`)) return;
    const r = await apiRequest(`/admin/users/${u.id}`, { method: "DELETE" });
    if (r.success) { setUsers((prev) => prev.filter((x) => x.id !== u.id)); showToast("Utilisateur supprimé."); }
    else showToast(r.message || "Erreur.");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#0a1628] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} utilisateurs au total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#00b8d9] outline-none"
        >
          <option value="">Tous les rôles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-400">Chargement…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Nom</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Rôle</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Inscrit le</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0a1628] to-indigo-900 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {u.email[0].toUpperCase()}
                      </div>
                      <span className="text-gray-800 font-medium truncate max-w-[180px]">{u.email}</span>
                      {u.isVerified && <HiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{userName(u)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.role === "ADMIN" ? "bg-red-100 text-red-600" : u.role === "RECRUTEUR" ? "bg-violet-100 text-violet-600" : "bg-cyan-100 text-cyan-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { setEditing(u); setNewRole(u.role); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#00b8d9] hover:bg-cyan-50 transition-colors cursor-pointer"
                        title="Modifier le rôle"
                      >
                        <HiPencilSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              style={p === page
                ? { backgroundColor: "#00b8d9", color: "#fff" }
                : { backgroundColor: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }
              }
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Edit role modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <button onClick={() => setEditing(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer">
              <HiXMark className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-gray-900 mb-1">Modifier le rôle</h2>
            <p className="text-xs text-gray-500 mb-4">{editing.email}</p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-4 focus:border-[#00b8d9] outline-none"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button
              onClick={handleUpdateRole}
              className="w-full py-3 rounded-xl text-sm font-bold text-white cursor-pointer"
              style={{ backgroundColor: "#00b8d9" }}
            >
              Confirmer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
