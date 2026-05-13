"use client";

import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "../../../lib/api";
import {
  HiBriefcase, HiCalendar, HiCurrencyDollar, HiCheckCircle,
  HiXCircle, HiClock, HiChevronDown, HiChevronUp, HiPaperAirplane,
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
  createdAt: string;
  recruiter: { email: string; profileRecruteur: { firstName: string; lastName: string; company: string } | null };
  timesheets: Timesheet[];
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: "Active",    color: "#10b981", bg: "#d1fae5" },
  PAUSED:    { label: "En pause",  color: "#f59e0b", bg: "#fef3c7" },
  COMPLETED: { label: "Terminée", color: "#6b7280", bg: "#f3f4f6" },
};

const TS_STYLE: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "Brouillon",  color: "#6b7280" },
  SUBMITTED: { label: "Soumis",     color: "#6366f1" },
  VALIDATED: { label: "Validé ✓",  color: "#10b981" },
  REJECTED:  { label: "Rejeté",     color: "#ef4444" },
};

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default function CandidatMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [tsForm, setTsForm] = useState<{ missionId: string; weekStart: string; daysWorked: string; description: string } | null>(null);
  const [tsSaving, setTsSaving] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    const r = await apiRequest<{ missions: Mission[] }>("/missions/mine");
    if (r.success && r.data) setMissions(r.data.missions);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openTsForm = (missionId: string) => {
    setTsForm({ missionId, weekStart: getMondayOfWeek(new Date()), daysWorked: "5", description: "" });
  };

  const handleSaveTs = async () => {
    if (!tsForm) return;
    setTsSaving(true);
    const r = await apiRequest("/missions/timesheets", {
      method: "POST",
      body: JSON.stringify({ missionId: tsForm.missionId, weekStart: tsForm.weekStart, daysWorked: Number(tsForm.daysWorked), description: tsForm.description }),
    });
    setTsSaving(false);
    if (r.success) { showToast("Timesheet enregistré."); setTsForm(null); load(); }
    else showToast(r.message || "Erreur.");
  };

  const handleSubmit = async (id: string) => {
    const r = await apiRequest(`/missions/timesheets/${id}/submit`, { method: "PATCH" });
    if (r.success) { showToast("Timesheet soumis au recruteur !"); load(); }
    else showToast(r.message || "Erreur.");
  };

  const recruiterName = (m: Mission) =>
    m.recruiter.profileRecruteur
      ? `${m.recruiter.profileRecruteur.firstName} ${m.recruiter.profileRecruteur.lastName} — ${m.recruiter.profileRecruteur.company}`
      : m.recruiter.email;

  const totalValidated = (m: Mission) => m.timesheets.filter((t) => t.status === "VALIDATED").reduce((s, t) => s + t.daysWorked, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 bg-[#0a1628] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}

      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Mes missions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Remplissez vos timesheets hebdomadaires.</p>
      </div>

      {loading ? <p className="text-sm text-gray-400">Chargement…</p> : missions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <HiBriefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune mission active. Signez un contrat pour démarrer.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((m) => {
            const st = STATUS_STYLE[m.status] || STATUS_STYLE.COMPLETED;
            const validated = totalValidated(m);
            const pending = m.timesheets.filter((t) => t.status === "SUBMITTED").length;
            const isOpen = expanded === m.id;

            return (
              <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: st.bg }}>
                      <HiBriefcase className="w-5 h-5" style={{ color: st.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900">{m.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Recruteur : <span className="font-semibold text-gray-600">{recruiterName(m)}</span></p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        {m.tjm && <span className="flex items-center gap-1"><HiCurrencyDollar className="w-3.5 h-3.5" />{m.tjm.toLocaleString()} MAD/j</span>}
                        {m.startDate && <span className="flex items-center gap-1"><HiCalendar className="w-3.5 h-3.5" />Depuis le {new Date(m.startDate).toLocaleDateString("fr-FR")}</span>}
                        <span className="flex items-center gap-1 font-semibold text-emerald-600"><HiCheckCircle className="w-3.5 h-3.5" />{validated}j validés</span>
                        {pending > 0 && <span className="flex items-center gap-1 text-indigo-600"><HiClock className="w-3.5 h-3.5" />{pending} en attente</span>}
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
                      {/* Add timesheet button */}
                      {m.status === "ACTIVE" && (
                        <button
                          onClick={() => openTsForm(m.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white cursor-pointer"
                          style={{ backgroundColor: "#00b8d9" }}
                        >
                          + Saisir une semaine
                        </button>
                      )}

                      {/* Timesheet form */}
                      {tsForm?.missionId === m.id && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Nouveau timesheet</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Semaine (lundi)</label>
                              <input type="date" value={tsForm.weekStart} onChange={(e) => setTsForm((f) => f ? { ...f, weekStart: e.target.value } : f)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#00b8d9]" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Jours travaillés</label>
                              <select value={tsForm.daysWorked} onChange={(e) => setTsForm((f) => f ? { ...f, daysWorked: e.target.value } : f)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#00b8d9] bg-white">
                                {[0.5,1,1.5,2,2.5,3,3.5,4,4.5,5].map((d) => <option key={d} value={d}>{d}j</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Travaux réalisés (optionnel)</label>
                            <textarea value={tsForm.description} onChange={(e) => setTsForm((f) => f ? { ...f, description: e.target.value } : f)} rows={2} placeholder="Ex: Intégration API paiement, revue de code…" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#00b8d9] resize-none" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleSaveTs} disabled={tsSaving} className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 cursor-pointer" style={{ backgroundColor: "#00b8d9" }}>
                              {tsSaving ? "Enregistrement…" : "Enregistrer"}
                            </button>
                            <button onClick={() => setTsForm(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer">Annuler</button>
                          </div>
                        </div>
                      )}

                      {/* Timesheets list */}
                      {m.timesheets.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Aucun timesheet saisi.</p>
                      ) : (
                        <div className="space-y-2">
                          {m.timesheets.map((t) => {
                            const ts = TS_STYLE[t.status] || TS_STYLE.DRAFT;
                            const weekLabel = new Date(t.weekStart).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
                            const amount = m.tjm ? t.daysWorked * m.tjm : null;
                            return (
                              <div key={t.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-700">Sem. du {weekLabel}</span>
                                    <span className="text-xs font-semibold text-gray-500">{t.daysWorked}j</span>
                                    {amount && <span className="text-xs text-emerald-600 font-semibold">{amount.toLocaleString()} MAD</span>}
                                  </div>
                                  {t.description && <p className="text-[11px] text-gray-400 truncate mt-0.5">{t.description}</p>}
                                  {t.rejectionNote && <p className="text-[11px] text-red-500 mt-0.5">Rejeté : {t.rejectionNote}</p>}
                                </div>
                                <span className="text-[11px] font-bold flex-shrink-0" style={{ color: ts.color }}>{ts.label}</span>
                                {(t.status === "DRAFT" || t.status === "REJECTED") && (
                                  <button onClick={() => handleSubmit(t.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer" style={{ backgroundColor: "#6366f1" }}>
                                    <HiPaperAirplane className="w-3.5 h-3.5" /> Soumettre
                                  </button>
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
