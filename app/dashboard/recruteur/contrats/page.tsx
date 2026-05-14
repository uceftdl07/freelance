"use client";

import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "../../../lib/api";
import { HiDocumentText, HiCheckCircle, HiXCircle, HiNoSymbol, HiArrowTopRightOnSquare } from "react-icons/hi2";

interface Contract {
  id: string;
  title: string;
  tjm: number | null;
  startDate: string | null;
  duration: string | null;
  status: string;
  pdfUrl: string | null;
  signingUrl: string | null;
  recruiterSignedAt: string;
  candidateSignedAt: string | null;
  createdAt: string;
  candidate: {
    email: string;
    profileCandidat: { firstName: string; lastName: string } | null;
  };
  application: { job: { title: string } };
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "En attente de signature", color: "#f59e0b", bg: "#fef3c7" },
  SIGNED:    { label: "Signé",                   color: "#10b981", bg: "#d1fae5" },
  REFUSED:   { label: "Refusé",                  color: "#ef4444", bg: "#fee2e2" },
  CANCELLED: { label: "Annulé",                  color: "#6b7280", bg: "#f3f4f6" },
};

export default function RecruteurContratsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    const r = await apiRequest<{ contracts: Contract[] }>("/contracts/mine");
    if (r.success && r.data) setContracts(r.data.contracts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler ce contrat ?")) return;
    const r = await apiRequest(`/contracts/${id}/cancel`, { method: "PATCH" });
    if (r.success) {
      setContracts((prev) => prev.map((c) => c.id === id ? { ...c, status: "CANCELLED" } : c));
      showToast("Contrat annulé.");
    } else showToast(r.message || "Erreur.");
  };

  const candidateName = (c: Contract) =>
    c.candidate.profileCandidat
      ? `${c.candidate.profileCandidat.firstName} ${c.candidate.profileCandidat.lastName}`
      : c.candidate.email;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 bg-[#0a1628] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}

      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Mes contrats</h1>
        <p className="text-sm text-gray-500 mt-0.5">Contrats PDF envoyés aux candidats.</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : contracts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <HiDocumentText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucun contrat envoyé pour l&apos;instant.</p>
          <p className="text-xs text-gray-400 mt-1">Acceptez un candidat et proposez-lui un contrat PDF depuis la liste des candidats.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => {
            const st = STATUS_STYLE[c.status] || STATUS_STYLE.CANCELLED;
            const isOpen = expanded === c.id;
            return (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: st.bg }}>
                      <HiDocumentText className="w-5 h-5" style={{ color: st.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900">{c.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Pour <span className="font-semibold text-gray-600">{candidateName(c)}</span>
                        {" · "}{new Date(c.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        {c.tjm && <span className="font-semibold text-gray-700">{c.tjm.toLocaleString()} MAD/j</span>}
                        {c.duration && <span>{c.duration}</span>}
                        {c.startDate && <span>Début : {new Date(c.startDate).toLocaleDateString("fr-FR")}</span>}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0" style={{ color: st.color, backgroundColor: st.bg }}>
                      {st.label}
                    </span>
                  </div>

                  <button
                    onClick={() => setExpanded(isOpen ? null : c.id)}
                    className="mt-3 text-xs font-semibold text-[#00b8d9] hover:underline cursor-pointer"
                  >
                    {isOpen ? "Masquer les détails" : "Voir les détails"}
                  </button>

                  {isOpen && (
                    <div className="mt-4 space-y-3 border-t border-gray-50 pt-4">
                      {c.pdfUrl && (
                        <a
                          href={c.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                          <HiDocumentText className="w-4 h-4" /> Voir le contrat PDF
                          <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <div className="flex flex-col gap-2 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <HiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          Envoyé le {new Date(c.recruiterSignedAt).toLocaleDateString("fr-FR")}
                        </div>
                        {c.candidateSignedAt ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <HiCheckCircle className="w-4 h-4 flex-shrink-0" />
                            Signé par le candidat le {new Date(c.candidateSignedAt).toLocaleDateString("fr-FR")}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <HiXCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                            En attente de signature du candidat
                          </div>
                        )}
                      </div>

                      {c.status === "PENDING" && (
                        <button
                          onClick={() => handleCancel(c.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <HiNoSymbol className="w-4 h-4" /> Annuler le contrat
                        </button>
                      )}

                      {c.status === "SIGNED" && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">
                          <HiCheckCircle className="w-5 h-5" /> Contrat signé — mission créée automatiquement
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
