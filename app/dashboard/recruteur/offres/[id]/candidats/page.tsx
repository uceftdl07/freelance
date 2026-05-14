"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiRequest } from "../../../../../lib/api";
import {
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChatBubbleLeftRight,
  HiStar,
  HiDocumentText,
  HiXMark,
} from "react-icons/hi2";
import ContactModal from "../../../ContactModal";
import { LeaveReviewModal } from "../../../../../components/ReputationSection";

type ApiApplication = {
  id: string;
  status: string;
  coverLetter: string | null;
  createdAt: string;
  candidate: {
    id: string;
    email: string;
    profileCandidat: {
      id: string;
      firstName: string;
      lastName: string;
      title: string | null;
      avatarUrl: string | null;
      skills: string[] | string;
      tjm: number | null;
      location: string | null;
      yearsOfExperience: number | null;
    } | null;
  };
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Nouveau",
  REVIEW: "En revue",
  ACCEPTED: "Acceptée",
  REJECTED: "Rejetée",
  WITHDRAWN: "Retirée",
};

function statusColor(s: string): string {
  if (s === "ACCEPTED") return "bg-emerald-100 text-emerald-700";
  if (s === "REJECTED") return "bg-red-100 text-red-700";
  if (s === "REVIEW") return "bg-amber-100 text-amber-700";
  if (s === "WITHDRAWN") return "bg-gray-100 text-gray-500";
  return "bg-[#00b8d9]/10 text-[#00b8d9]";
}

function parseSkills(s: string[] | string): string[] {
  if (Array.isArray(s)) return s;
  try {
    const p = JSON.parse(s);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export default function OffreCandidatsPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id || "";
  const [apps, setApps] = useState<ApiApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [contact, setContact] = useState<{ id: string; name: string } | null>(null);
  const [reviewing, setReviewing] = useState<{ userId: string; applicationId: string; name: string } | null>(null);
  const [contracting, setContracting] = useState<{ applicationId: string; name: string; defaultTitle: string } | null>(null);
  const [contractForm, setContractForm] = useState({ title: "", tjm: "", startDate: "", duration: "" });
  const [contractPdf, setContractPdf] = useState<File | null>(null);
  const [contractSaving, setContractSaving] = useState(false);

  const handleSendContract = async () => {
    if (!contracting || !contractForm.title.trim() || !contractPdf) return;
    setContractSaving(true);
    const form = new FormData();
    form.append("applicationId", contracting.applicationId);
    form.append("title", contractForm.title);
    if (contractForm.tjm) form.append("tjm", contractForm.tjm);
    if (contractForm.startDate) form.append("startDate", contractForm.startDate);
    if (contractForm.duration) form.append("duration", contractForm.duration);
    form.append("contract", contractPdf);

    const r = await apiRequest("/contracts", { method: "POST", body: form });
    setContractSaving(false);
    if (r.success) {
      showToast("Contrat PDF envoyé au candidat !");
      setContracting(null);
      setContractPdf(null);
    } else {
      showToast(r.message || "Erreur lors de l'envoi du contrat.");
    }
  };

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const res = await apiRequest<{ applications: ApiApplication[] }>(`/applications/job/${jobId}`);
    if (res.success && res.data) setApps(res.data.applications);
    else setError(res.message || "Erreur de chargement.");
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: "ACCEPTED" | "REJECTED" | "REVIEW") => {
    const res = await apiRequest(`/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!res.success) {
      showToast(res.message || "Erreur lors de la mise à jour.");
      return;
    }
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    showToast(`Candidature ${STATUS_LABEL[status].toLowerCase()}.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[100] rounded-xl bg-[#0a1628] text-white px-4 py-2 text-sm font-semibold shadow-lg">
          {toast}
        </div>
      )}

      <Link
        href="/dashboard/recruteur/offres"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#00b8d9] transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" /> Retour aux offres
      </Link>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Candidats pour cette offre</h1>
        <p className="text-sm text-gray-500">
          {loading ? "Chargement…" : `${apps.length} candidature${apps.length !== 1 ? "s" : ""} reçue${apps.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {error && <p className="text-center text-red-500 text-sm">{error}</p>}

      {!loading && apps.length === 0 && !error && (
        <div className="text-center py-16">
          <HiOutlineUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune candidature pour l&apos;instant.</p>
        </div>
      )}

      <div className="space-y-3">
        {apps.map((a) => {
          const p = a.candidate.profileCandidat;
          const name = p ? `${p.firstName} ${p.lastName}`.trim() : a.candidate.email;
          const initials = p ? (p.firstName[0] + p.lastName[0]).toUpperCase() : "?";
          const skills = parseSkills(p?.skills || []);
          return (
            <div
              key={a.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-5"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0a1628] to-indigo-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900">{name}</h3>
                <p className="text-xs text-gray-500 truncate">
                  {p?.title || "—"}
                  {p?.yearsOfExperience != null ? ` • ${p.yearsOfExperience} ans` : ""}
                  {p?.location ? ` • ${p.location}` : ""}
                </p>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {skills.slice(0, 4).map((s) => (
                      <span key={s} className="px-2 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-500 border border-gray-100 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <span className={`px-3 py-1 text-[11px] font-extrabold rounded-full ${statusColor(a.status)} flex-shrink-0`}>
                {STATUS_LABEL[a.status] || a.status}
              </span>

              <div className="flex items-center gap-1 flex-shrink-0">
                {p?.id && (
                  <Link
                    href={`/dashboard/recruteur/recherche-talents/${p.id}`}
                    className="p-2 text-gray-400 hover:text-[#00b8d9] hover:bg-cyan-50 rounded-lg transition-colors"
                    title="Voir le profil"
                  >
                    <HiOutlineUser className="w-5 h-5" />
                  </Link>
                )}
                <button
                  onClick={() => setContact({ id: a.candidate.id, name })}
                  className="p-2 text-gray-400 hover:text-[#00b8d9] hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                  title="Contacter"
                >
                  <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => a.status !== "ACCEPTED" && updateStatus(a.id, "ACCEPTED")}
                  disabled={a.status === "ACCEPTED"}
                  className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                  title="Accepter"
                >
                  <HiOutlineCheckCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => a.status !== "REJECTED" && updateStatus(a.id, "REJECTED")}
                  disabled={a.status === "REJECTED"}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                  title="Rejeter"
                >
                  <HiOutlineXCircle className="w-5 h-5" />
                </button>
                {a.status === "ACCEPTED" && (
                  <>
                    <button
                      onClick={() => {
                        setContractForm({ title: "", tjm: "", startDate: "", duration: "" });
                        setContractPdf(null);
                        setContracting({ applicationId: a.id, name, defaultTitle: "" });
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Proposer un contrat"
                    >
                      <HiDocumentText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setReviewing({ userId: a.candidate.id, applicationId: a.id, name })}
                      className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Laisser un avis"
                    >
                      <HiStar className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {contact && (
        <ContactModal
          isOpen={!!contact}
          onClose={() => setContact(null)}
          candidateId={contact.id}
          candidateName={contact.name}
        />
      )}

      {reviewing && (
        <LeaveReviewModal
          toUserId={reviewing.userId}
          applicationId={reviewing.applicationId}
          targetName={reviewing.name}
          onClose={() => setReviewing(null)}
          onSuccess={() => showToast("Avis envoyé !")}
        />
      )}

      {/* Contract modal */}
      {contracting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setContracting(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Proposer un contrat</h2>
                <p className="text-xs text-gray-400 mt-0.5">Pour {contracting.name}</p>
              </div>
              <button onClick={() => setContracting(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Intitulé de la mission <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={contractForm.title}
                onChange={(e) => setContractForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Développeur React Senior — 6 mois"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">TJM (MAD/jour)</label>
                <input
                  type="number"
                  value={contractForm.tjm}
                  onChange={(e) => setContractForm((f) => ({ ...f, tjm: e.target.value }))}
                  placeholder="1200"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Durée</label>
                <input
                  type="text"
                  value={contractForm.duration}
                  onChange={(e) => setContractForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="3 mois, 6 mois…"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Date de début</label>
              <input
                type="date"
                value={contractForm.startDate}
                onChange={(e) => setContractForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Fichier contrat PDF <span className="text-red-400">*</span>
              </label>
              <label className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border-2 border-dashed text-sm cursor-pointer transition-colors ${contractPdf ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-400 hover:border-indigo-300"}`}>
                <HiDocumentText className="w-5 h-5 flex-shrink-0" />
                {contractPdf ? contractPdf.name : "Choisir un fichier PDF…"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setContractPdf(e.target.files?.[0] ?? null)}
                />
              </label>
              {contractPdf && (
                <p className="text-[11px] text-gray-400 mt-1">{(contractPdf.size / 1024).toFixed(0)} Ko</p>
              )}
            </div>

            <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700">
              Le contrat PDF sera envoyé au candidat pour signature électronique via DocuSeal.
            </div>

            <button
              onClick={handleSendContract}
              disabled={contractSaving || !contractForm.title.trim() || !contractPdf}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: "#6366f1" }}
            >
              {contractSaving ? "Envoi…" : "Envoyer le contrat PDF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
