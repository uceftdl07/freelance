"use client";

import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import {
  HiXMark,
  HiBriefcase,
  HiArrowPath,
  HiCheckCircle,
  HiDocumentText,
  HiMapPin,
  HiCurrencyEuro,
  HiTag,
} from "react-icons/hi2";

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  "Développement Web",
  "Développement Mobile",
  "DevOps / Cloud",
  "Data / IA",
  "Design / UX",
  "Cybersécurité",
  "Gestion de projet",
  "Consulting IT",
];

const CONTRACT_TYPES = ["Freelance", "CDI", "CDD", "Stage"];

export default function CreateOfferModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateOfferModalProps) {
  const { token, user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    category: "",
    contractType: "Freelance",
    location: "",
    salary: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const update = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Guard: must be authenticated
    if (!token || !user) {
      setError("Vous devez être connecté pour publier une offre.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          location: form.location,
          contractType: form.contractType.toUpperCase(),
          tjm: form.salary ? parseInt(form.salary) || null : null,
          tags: form.category ? [form.category] : [],
          company: "Mon entreprise",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 401) {
          setError("Session expirée. Veuillez vous reconnecter.");
        } else if (res.status === 403) {
          setError("Seuls les recruteurs peuvent publier des offres.");
        } else {
          setError(json.message || "Erreur lors de la publication.");
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2000);
    } catch {
      setError("Impossible de contacter le serveur.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      title: "",
      category: "",
      contractType: "Freelance",
      location: "",
      salary: "",
      description: "",
    });
    setSuccess(false);
    setLoading(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Success state
  if (success) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{
          backgroundColor: "rgba(10,22,40,0.7)",
          backdropFilter: "blur(8px)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-center p-8"
          style={{ animation: "modalSlideIn 0.3s ease-out" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
          >
            <HiCheckCircle className="w-8 h-8" style={{ color: "#10b981" }} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Offre publiée ! 🎉
          </h3>
          <p className="text-sm text-gray-500 mb-2 leading-relaxed">
            Votre offre <strong className="text-gray-700">&quot;{form.title}&quot;</strong> a
            été publiée avec succès.
          </p>
          <p className="text-xs text-gray-400">
            Les candidats qualifiés seront notifiés automatiquement.
          </p>
        </div>
        <style jsx>{`
          @keyframes modalSlideIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(10,22,40,0.7)",
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ animation: "modalSlideIn 0.3s ease-out" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-5 text-center relative rounded-t-2xl"
          style={{
            background: "linear-gradient(135deg, #0a1628, #111d33)",
          }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <HiXMark className="w-5 h-5" />
          </button>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{
              background: "linear-gradient(135deg, #00b8d9, #00a3c4)",
              boxShadow: "0 4px 14px rgba(0,184,217,0.3)",
            }}
          >
            <HiBriefcase className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-white font-bold text-lg">Créer une offre</h2>
          <p className="text-gray-400 text-sm mt-1">
            Publiez une mission et trouvez le talent idéal
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Titre du poste *
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                <HiBriefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Ex : Développeur React Senior"
                  required
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
              </div>
            </div>

            {/* Category + Contract Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Catégorie *
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                  <HiTag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    required
                    className="w-full bg-transparent text-sm text-gray-700 outline-none cursor-pointer appearance-none"
                  >
                    <option value="" disabled>Choisir…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Type de contrat
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                  <HiDocumentText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={form.contractType}
                    onChange={(e) => update("contractType", e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-700 outline-none cursor-pointer appearance-none"
                  >
                    {CONTRACT_TYPES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location + Salary */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Localisation
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                  <HiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="Paris, Remote…"
                    className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Budget / TJM
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                  <HiCurrencyEuro className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={form.salary}
                    onChange={(e) => update("salary", e.target.value)}
                    placeholder="500€/jour"
                    className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description de la mission *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Décrivez la mission, les compétences requises, le contexte de l'équipe…"
                required
                rows={5}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#00b8d9] focus:bg-white transition-all text-sm text-gray-700 placeholder-gray-400 outline-none resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {form.description.length} / 2000 caractères
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  color: "#dc2626",
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              style={{
                backgroundColor: "#00b8d9",
                boxShadow: "0 4px 14px rgba(0,184,217,0.3)",
              }}
            >
              {loading ? (
                <>
                  <HiArrowPath className="w-4 h-4 animate-spin" />
                  Publication en cours…
                </>
              ) : (
                <>
                  <HiBriefcase className="w-4 h-4" />
                  Publier l&apos;offre
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
