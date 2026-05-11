"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { apiRequest } from "../../../lib/api";
import {
  HiBriefcase,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiXMark,
  HiPencilSquare,
  HiTrash,
  HiCalendarDays,
  HiBuildingOffice2,
  HiDocumentText,
  HiExclamationTriangle,
  HiInformationCircle,
  HiChevronRight,
} from "react-icons/hi2";

// ─── Types ───────────────────────────────────────────────────────
type ApplicationStatus = "pending" | "accepted" | "rejected";

interface Application {
  id: string;
  title: string;
  company: string;
  date: string;
  status: ApplicationStatus;
  tags: string[];
  coverLetter: string;
}

// Backend application shape returned by GET /api/applications/mine
interface ApiApplication {
  id: string;
  status: string;
  coverLetter: string | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
    company: string;
    tags: string[] | string;
  };
}

function mapStatus(s: string): ApplicationStatus {
  const v = (s || "").toUpperCase();
  if (v === "ACCEPTED") return "accepted";
  if (v === "REJECTED") return "rejected";
  return "pending"; // PENDING | REVIEW | WITHDRAWN -> shown as pending bucket
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function normalizeTags(t: string[] | string | undefined): string[] {
  if (Array.isArray(t)) return t;
  if (typeof t === "string") {
    try {
      const p = JSON.parse(t);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ─── Status Config ──────────────────────────────────────────────
const statusMap: Record<
  ApplicationStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "En attente",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    icon: HiClock,
  },
  accepted: {
    label: "Acceptée",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    icon: HiCheckCircle,
  },
  rejected: {
    label: "Refusée",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    icon: HiXCircle,
  },
};

// ─── Detail Modal ───────────────────────────────────────────────
function DetailModal({
  app,
  onClose,
  onWithdraw,
  onEdit,
}: {
  app: Application;
  onClose: () => void;
  onWithdraw: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const st = statusMap[app.status];
  const StatusIcon = st.icon;
  const canModify = app.status === "pending";
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "fadeIn 0.2s ease" }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "fadeInUp 0.3s ease" }}
      >
        {/* ── Header ── */}
        <div
          className="relative px-8 pt-8 pb-6"
          style={{
            background: "linear-gradient(135deg, #0a1628 0%, #111d33 100%)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <HiXMark className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(0,184,217,0.15)" }}
            >
              <HiBriefcase className="w-6 h-6 text-[#00b8d9]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-white truncate">
                {app.title}
              </h2>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <HiBuildingOffice2 className="w-4 h-4" />
                  {app.company}
                </span>
                <span className="flex items-center gap-1">
                  <HiCalendarDays className="w-4 h-4" />
                  {app.date}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: st.bg, color: st.color }}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {st.label}
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-8 py-6 space-y-5">
          {/* Tags */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Compétences
            </h4>
            <div className="flex flex-wrap gap-2">
              {app.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HiDocumentText className="w-4 h-4" />
              Lettre de motivation
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                {app.coverLetter}
              </p>
            </div>
          </div>

          {/* ── Cannot modify message ── */}
          {!canModify && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm"
              style={{
                backgroundColor:
                  app.status === "accepted"
                    ? "rgba(16,185,129,0.06)"
                    : "rgba(239,68,68,0.06)",
                border: `1px solid ${
                  app.status === "accepted"
                    ? "rgba(16,185,129,0.15)"
                    : "rgba(239,68,68,0.15)"
                }`,
                color:
                  app.status === "accepted" ? "#059669" : "#dc2626",
              }}
            >
              <HiInformationCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="font-medium">
                Cette candidature ne peut plus être modifiée.
              </span>
            </div>
          )}

          {/* ── Withdraw Confirmation ── */}
          {confirmWithdraw && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm"
              style={{
                backgroundColor: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <HiExclamationTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-amber-700 mb-2">
                  Confirmer le retrait ?
                </p>
                <p className="text-amber-600 text-xs mb-3">
                  Cette action est irréversible. Votre candidature sera
                  définitivement supprimée.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onWithdraw(app.id)}
                    className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                  >
                    Oui, retirer
                  </button>
                  <button
                    onClick={() => setConfirmWithdraw(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => canModify && onEdit(app.id)}
              disabled={!canModify}
              className="flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5"
              style={{
                backgroundColor: canModify ? "#00b8d9" : "#e2e8f0",
                color: canModify ? "#fff" : "#94a3b8",
                boxShadow: canModify
                  ? "0 6px 16px rgba(0,184,217,0.3)"
                  : "none",
              }}
            >
              <HiPencilSquare className="w-4.5 h-4.5" />
              Modifier la candidature
            </button>
            <button
              onClick={() => canModify && setConfirmWithdraw(true)}
              disabled={!canModify}
              className="py-3 px-5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-red-50 hover:enabled:text-red-600 hover:enabled:border-red-200"
              style={{
                backgroundColor: "#fff",
                color: canModify ? "#4b5563" : "#94a3b8",
                border: `1px solid ${canModify ? "#e5e7eb" : "#e2e8f0"}`,
              }}
            >
              <HiTrash className="w-4.5 h-4.5" />
              Retirer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ─────────────────────────────────────────────────
function EditModal({
  app,
  onClose,
  onSave,
}: {
  app: Application;
  onClose: () => void;
  onSave: (id: string, coverLetter: string) => void;
}) {
  const [letter, setLetter] = useState(app.coverLetter);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await apiRequest(`/applications/${app.id}`, {
      method: "PATCH",
      body: JSON.stringify({ coverLetter: letter }),
    });
    setSaving(false);
    if (result.success) {
      onSave(app.id, letter);
      setSaved(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "fadeIn 0.2s ease" }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "fadeInUp 0.3s ease" }}
      >
        {/* Header */}
        <div
          className="relative px-8 pt-8 pb-6"
          style={{
            background: "linear-gradient(135deg, #0a1628 0%, #111d33 100%)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <HiXMark className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00b8d9]/20 flex items-center justify-center">
              <HiPencilSquare className="w-5 h-5 text-[#00b8d9]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Modifier la candidature
              </h2>
              <p className="text-sm text-gray-400">
                {app.title} — {app.company}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {saved ? (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
              >
                <HiCheckCircle className="w-9 h-9 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Candidature modifiée !
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Vos modifications ont été enregistrées avec succès.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-white rounded-xl transition-transform hover:-translate-y-0.5 cursor-pointer"
                style={{
                  backgroundColor: "#00b8d9",
                  boxShadow: "0 6px 16px rgba(0,184,217,0.3)",
                }}
              >
                Fermer
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Lettre de motivation
                </label>
                <textarea
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none transition-all resize-none"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-right">
                  {letter.length} caractères
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || letter.trim() === ""}
                  className="flex-1 py-3.5 text-sm font-extrabold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5"
                  style={{
                    backgroundColor: "#00b8d9",
                    boxShadow: "0 8px 20px rgba(0,184,217,0.3)",
                  }}
                >
                  {saving ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          opacity="0.25"
                        />
                        <path
                          d="M4 12a8 8 0 018-8"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Enregistrement…
                    </>
                  ) : (
                    "Enregistrer les modifications"
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="py-3.5 px-5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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

// ─── Main Page ──────────────────────────────────────────────────
export default function CandidaturesPage() {
  const [candidatures, setCandidatures] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // ── Load applications from API ──
  const loadApplications = useCallback(async () => {
    setLoading(true);
    const result = await apiRequest<{ applications: ApiApplication[] }>(
      "/applications/mine"
    );
    if (result.success && result.data) {
      const mapped: Application[] = result.data.applications.map((a) => ({
        id: a.id,
        title: a.job?.title || "Offre supprimée",
        company: a.job?.company || "—",
        date: formatDate(a.createdAt),
        status: mapStatus(a.status),
        tags: normalizeTags(a.job?.tags),
        coverLetter: a.coverLetter || "",
      }));
      setCandidatures(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // ── Dynamic counters ──
  const stats = useMemo(
    () => [
      { label: "Total", count: candidatures.length, color: "#00b8d9" },
      {
        label: "En attente",
        count: candidatures.filter((c) => c.status === "pending").length,
        color: "#f59e0b",
      },
      {
        label: "Acceptées",
        count: candidatures.filter((c) => c.status === "accepted").length,
        color: "#10b981",
      },
    ],
    [candidatures]
  );

  // ── Toast helper ──
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  // ── Withdraw handler ──
  const handleWithdraw = async (id: string) => {
    const result = await apiRequest(`/applications/${id}`, { method: "DELETE" });
    if (!result.success) {
      showToast(result.message || "Erreur lors du retrait");
      return;
    }
    setCandidatures((prev) => prev.filter((c) => c.id !== id));
    setSelectedApp(null);
    showToast("Candidature retirée avec succès");
  };

  // ── Edit handler ──
  const handleEdit = (id: string) => {
    const app = candidatures.find((c) => c.id === id);
    if (app) {
      setSelectedApp(null);
      // Small delay so close animation plays before open
      setTimeout(() => setEditingApp(app), 150);
    }
  };

  // ── Save edit handler ──
  const handleSaveEdit = (id: string, newCoverLetter: string) => {
    setCandidatures((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, coverLetter: newCoverLetter } : c
      )
    );
    showToast("Candidature modifiée avec succès");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <HiBriefcase className="w-6 h-6" style={{ color: "#00b8d9" }} />
            Mes Candidatures
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Suivez l&apos;état de vos candidatures en temps réel.
          </p>
        </div>
      </div>

      {/* ── Dynamic Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center transition-transform hover:scale-[1.02] hover:shadow-md"
          >
            <p
              className="text-2xl font-black transition-all"
              style={{ color: s.color }}
            >
              {s.count}
            </p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Applications List ── */}
      {loading ? (
        <div className="text-center py-16 text-sm text-gray-500">
          Chargement de vos candidatures…
        </div>
      ) : candidatures.length > 0 ? (
        <div className="space-y-3">
          {candidatures.map((app) => {
            const st = statusMap[app.status];
            const StatusIcon = st.icon;
            return (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:border-[#00b8d9]/20 transition-all cursor-pointer group flex items-center gap-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                  style={{
                    background:
                      "linear-gradient(135deg, #0a1628, #111d33)",
                  }}
                >
                  <HiBriefcase
                    className="w-5 h-5"
                    style={{ color: "#00b8d9" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-800 truncate group-hover:text-[#00b8d9] transition-colors">
                    {app.title}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {app.company} • {app.date}
                  </p>
                  <div className="flex gap-1.5 mt-1.5">
                    {app.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-500 border border-gray-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: st.bg, color: st.color }}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {st.label}
                </span>
                <HiChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#00b8d9] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#00b8d9]/10 flex items-center justify-center mx-auto mb-6">
            <HiBriefcase className="w-8 h-8 text-[#00b8d9]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Aucune candidature
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Vous n&apos;avez pas encore postulé à une offre. Parcourez les
            missions disponibles pour commencer.
          </p>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedApp && (
        <DetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onWithdraw={handleWithdraw}
          onEdit={handleEdit}
        />
      )}

      {/* ── Edit Modal ── */}
      {editingApp && (
        <EditModal
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* ── Toast ── */}
      <Toast message={toastMsg} visible={toastVisible} />
    </div>
  );
}
