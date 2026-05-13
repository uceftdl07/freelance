"use client";

import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "../../../lib/api";
import {
  HiBriefcase, HiCalendar, HiCurrencyDollar, HiCheckCircle,
  HiXCircle, HiClock, HiChevronDown, HiChevronUp,
} from "react-icons/hi2";

interface Timesheet {
  id: string;
  weekStart: string;
  daysWorked: number;
  description: string | null;
  status: string;
  rejectionNote: string | null;
  submittedAt: string | null;
  validatedAt: string | null;
}

interface Mission {
  id: string;
  title: string;
  status: string;
  tjm: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  candidate: { email: string; profileCandidat: { firstName: string; lastName: string } | null };
  timesheets: Timesheet[];
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: "Active",    color: "#10b981", bg: "#d1fae5" },
  PAUSED:    { label: "En pause",  color: "#f59e0b", bg: "#fef3c7" },
  COMPLETED: { label: "Terminée", color: "#6b7280", bg: "#f3f4f6" },
};

const TS_STYLE: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "Brouillon",  color: "#6b7280" },
  SUBMITTED: { label: "À valider",  color: "#6366f1" },
  VALIDATED: { label: "Validé ✓",  color: "#10b981" },
  REJECTED:  { label: "Rejeté",     color: "#ef4444" },
};

export default function RecruteurMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [rejectNote, setRejectNote] = useState<{ id: string; note: string } | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    const r = await apiRequest<{ missions: Mission[] }>("/missions/mine");
    if (r.success && r.data) setMissions(r.data.missions);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleValidate = async (tsId: string) => {
    const r = await apiRequest(`/missions/timesheets/${tsId}/validate`, { method: "PATCH" });
    if (r.success) { showToast("Timesheet validé !"); load(); }
    else showToast(r.message || "Erreur.");
  };

  const handleReject = async (tsId: string, note: string) => {
    const r = await apiRequest(`/missions/timesheets/${tsId}/reject`, { method: "PATCH", body: JSON.stringify({ note }) });
    if (r.success) { showToast("Timesheet rejeté."); setRejectNote(null); load(); }
    else showToast(r.message || "Erreur.");
  };

  const updateStatus = async (missionId: string, status: string) => {
    const r = await apiRequest(`/missions/${missionId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (r.success) { showToast(`Mission ${status === "COMPLETED" ? "terminée" : status === "PAUSED" ? "mise en pause" : "relancée"}.`); load(); }
    else showToast(r.message || "Erreur.");
  };

  const candidateName = (m: Mission) =>
    m.candidate.profileCandidat
      ? `${m.candidate.profileCandidat.firstName} ${m.candidate.profileCandidat.lastName}`
      : m.candidate.email;

  const totalValidated = (m: Mission) => m.timesheets.filter((t) => t.status === "VALIDATED").reduce((s, t) => s + t.daysWorked, 0);
  const totalCost = (m: Mission) => m.tjm ? totalValidated(m) * m.tjm : null;
  const pendingTs = (m: Mission) => m.timesheets.filter((t) => t.status === "SUBMITTED");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 bg-[#0a1628] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}

      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Mes missions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Validez les timesheets de vos freelances.</p>
      </div>

      {loading ? <p className="text-sm text-gray-400">Chargement…</p> : missions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <HiBriefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune mission. Les missions démarrent après signature d&apos;un contrat.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((m) => {
            const st = STATUS_STYLE[m.status] || STATUS_STYLE.COMPLETED;
            const validated = totalValidated(m);
            const cost = totalCost(m);
            const pending = pendingTs(m);
            const isOpen = expanded === m.id;

            return (
              <div key={m.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${pending.length > 0 ? "border-indigo-200" : "border-gray-100"}`}>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: st.bg }}>
                      <HiBriefcase className="w-5 h-5" style={{ color: st.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{m.title}</h3>
                        {pending.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-600">{pending.length} à valider</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Freelance : <span className="font-semibold text-gray-600">{candidateName(m)}</span></p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        {m.tjm && <span className="flex items-center gap-1"><HiCurrencyDollar className="w-3.5 h-3.5" />{m.tjm.toLocaleString()} MAD/j</span>}
                        {m.startDate && <span className="flex items-center gap-1"><HiCalendar className="w-3.5 h-3.5" />Depuis le {new Date(m.startDate).toLocaleDateString("fr-FR")}</span>}
                        <span className="flex items-center gap-1 font-semibold text-emerald-600"><HiCheckCircle className="w-3.5 h-3.5" />{validated}j validés</span>
                        {cost && <span className="font-bold text-gray-700">{cost.toLocaleString()} MAD total</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                      <button onClick={() => setExpanded(isOpen ? null : m.id)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                        {isOpen ? <HiChevronUp className="w-5 h-5" /> : <HiChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-5 space-y-4 border-t border-gray-50 pt-4">
                      {/* Mission status controls */}
                      {m.status !== "COMPLETED" && (
                        <div className="flex gap-2">
                          {m.status === "ACTIVE" && (
                            <button onClick={() => updateStatus(m.id, "PAUSED")} className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 cursor-pointer">⏸ Mettre en pause</button>
                          )}
                          {m.status === "PAUSED" && (
                            <button onClick={() => updateStatus(m.id, "ACTIVE")} className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 cursor-pointer">▶ Relancer</button>
                          )}
                          <button onClick={() => updateStatus(m.id, "COMPLETED")} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer">✓ Terminer la mission</button>
                        </div>
                      )}

                      {/* Timesheets list */}
                      {m.timesheets.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Aucun timesheet soumis.</p>
                      ) : (
                        <div className="space-y-2">
                          {m.timesheets.map((t) => {
                            const ts = TS_STYLE[t.status] || TS_STYLE.DRAFT;
                            const weekLabel = new Date(t.weekStart).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
                            const amount = m.tjm ? t.daysWorked * m.tjm : null;
                            return (
                              <div key={t.id} className={`px-4 py-3 rounded-xl border ${t.status === "SUBMITTED" ? "bg-indigo-50 border-indigo-100" : "bg-gray-50 border-gray-100"}`}>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-gray-700">Sem. du {weekLabel}</span>
                                      <span className="text-xs font-semibold text-gray-500">{t.daysWorked}j</span>
                                      {amount && <span className="text-xs font-bold text-emerald-600">{amount.toLocaleString()} MAD</span>}
                                    </div>
                                    {t.description && <p className="text-[11px] text-gray-500 truncate mt-0.5">{t.description}</p>}
                                  </div>
                                  <span className="text-[11px] font-bold flex-shrink-0" style={{ color: ts.color }}>{ts.label}</span>
                                  {t.status === "SUBMITTED" && (
                                    <div className="flex gap-1.5">
                                      <button onClick={() => handleValidate(t.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer" style={{ backgroundColor: "#10b981" }}>
                                        <HiCheckCircle className="w-3.5 h-3.5" /> Valider
                                      </button>
                                      <button onClick={() => setRejectNote({ id: t.id, note: "" })} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer">
                                        <HiXCircle className="w-3.5 h-3.5" /> Rejeter
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {/* Reject form */}
                                {rejectNote?.id === t.id && (
                                  <div className="mt-3 space-y-2">
                                    <input type="text" value={rejectNote.note} onChange={(e) => setRejectNote({ id: t.id, note: e.target.value })} placeholder="Raison du rejet (optionnel)" className="w-full px-3 py-2 rounded-lg border border-red-200 text-xs outline-none focus:border-red-400" />
                                    <div className="flex gap-2">
                                      <button onClick={() => handleReject(t.id, rejectNote.note)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 cursor-pointer">Confirmer le rejet</button>
                                      <button onClick={() => setRejectNote(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-white border border-gray-200 cursor-pointer">Annuler</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
