"use client";

import { useState } from "react";
import { apiRequest } from "../../../lib/api";
import {
  HiSparkles,
  HiArrowPath,
  HiClipboardDocument,
  HiCheckCircle,
  HiLightBulb,
  HiExclamationCircle,
} from "react-icons/hi2";

interface MissionInput {
  title: string;
  description: string;
  location: string;
  remote: boolean;
  tjm: string;
  tags: string;
  contractType: string;
}

interface OptimizedMission {
  title?: string;
  description?: string;
  suggestedTags?: string[];
  tips?: string;
}

const emptyInput: MissionInput = {
  title: "",
  description: "",
  location: "",
  remote: false,
  tjm: "",
  tags: "",
  contractType: "FREELANCE",
};

export default function RecruteurIAPage() {
  const [input, setInput] = useState<MissionInput>(emptyInput);
  const [result, setResult] = useState<OptimizedMission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const set = (k: keyof MissionInput, v: string | boolean) =>
    setInput((prev) => ({ ...prev, [k]: v }));

  const generate = async () => {
    if (!input.title.trim() || !input.description.trim()) {
      setError("Le titre et la description sont requis.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    const payload = {
      title: input.title,
      description: input.description,
      location: input.location || undefined,
      remote: input.remote,
      tjm: input.tjm ? parseInt(input.tjm) : undefined,
      tags: input.tags ? input.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      contractType: input.contractType,
    };

    const r = await apiRequest<OptimizedMission>("/ai/optimize-mission", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (r.success && r.data) setResult(r.data);
    else setError(r.message || "Erreur lors de la génération.");
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6 shadow-sm" style={{ background: "linear-gradient(135deg,#0a1628,#1a2c4e)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00b8d9]/20 flex items-center justify-center flex-shrink-0">
            <HiSparkles className="w-6 h-6 text-[#00b8d9]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Générateur de mission IA</h1>
            <p className="text-sm text-indigo-200 mt-0.5">Renseignez votre mission et l&apos;IA la rend irrésistible pour les freelances IT</p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <h2 className="text-base font-bold text-gray-900">Informations sur la mission</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Titre <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={input.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex: Développeur React.js pour refonte e-commerce"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description actuelle <span className="text-red-400">*</span></label>
            <textarea
              value={input.description}
              onChange={(e) => set("description", e.target.value)}
              rows={5}
              placeholder="Décrivez la mission, les tâches, le contexte…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Localisation</label>
            <input
              type="text"
              value={input.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Casablanca, Rabat…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">TJM (MAD/jour)</label>
            <input
              type="number"
              value={input.tjm}
              onChange={(e) => set("tjm", e.target.value)}
              placeholder="Ex: 1500"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Tags actuels</label>
            <input
              type="text"
              value={input.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="React, Node.js, PostgreSQL (séparés par des virgules)"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Type de contrat</label>
            <select
              value={input.contractType}
              onChange={(e) => set("contractType", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none transition-all"
            >
              <option value="FREELANCE">Freelance</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="remote"
              checked={input.remote}
              onChange={(e) => set("remote", e.target.checked)}
              className="w-4 h-4 rounded accent-[#00b8d9]"
            />
            <label htmlFor="remote" className="text-sm font-bold text-gray-700 cursor-pointer">Remote possible</label>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 font-semibold">
            <HiExclamationCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5"
          style={{ backgroundColor: "#00b8d9", boxShadow: "0 6px 16px rgba(0,184,217,0.3)" }}
        >
          {loading ? <HiArrowPath className="w-4 h-4 animate-spin" /> : <HiSparkles className="w-4 h-4" />}
          {loading ? "Optimisation en cours…" : "Optimiser avec l'IA"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {result.title && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-700">Titre optimisé</h3>
                <button onClick={() => copy(result.title!, "title")} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00b8d9] cursor-pointer transition-colors">
                  {copied === "title" ? <HiCheckCircle className="w-4 h-4 text-emerald-500" /> : <HiClipboardDocument className="w-4 h-4" />}
                  {copied === "title" ? "Copié" : "Copier"}
                </button>
              </div>
              <p className="text-sm text-gray-900 font-semibold">{result.title}</p>
            </div>
          )}

          {result.description && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-700">Description optimisée</h3>
                <button onClick={() => copy(result.description!, "desc")} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00b8d9] cursor-pointer transition-colors">
                  {copied === "desc" ? <HiCheckCircle className="w-4 h-4 text-emerald-500" /> : <HiClipboardDocument className="w-4 h-4" />}
                  {copied === "desc" ? "Copié" : "Copier"}
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{result.description}</p>
            </div>
          )}

          {result.suggestedTags && result.suggestedTags.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
              <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                <HiLightBulb className="w-4 h-4" /> Tags suggérés à ajouter
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.suggestedTags.map((t) => (
                  <span key={t} className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">{t}</span>
                ))}
              </div>
            </div>
          )}

          {result.tips && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-700 mb-2 flex items-center gap-2">
                <HiLightBulb className="w-4 h-4" /> Conseils
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{result.tips}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
