"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../../../lib/api";
import {
  HiSparkles,
  HiUserCircle,
  HiDocumentText,
  HiCheckBadge,
  HiLightBulb,
  HiArrowPath,
  HiClipboardDocument,
  HiCheckCircle,
  HiExclamationCircle,
} from "react-icons/hi2";

// ─── Types ────────────────────────────────────────────────────────

interface ProfileData {
  firstName: string;
  lastName: string;
  title: string;
  bio: string;
  skills: string[];
  yearsOfExperience: number;
  tjm: number;
  location: string;
}

interface OptimizedProfile {
  title?: string;
  bio?: string;
  pitch?: string;
  suggestedSkills?: string[];
}

interface CvAnalysis {
  strengths?: string[];
  missingSkills?: string[];
  improvements?: string[];
  estimatedLevel?: string;
  marketabilityScore?: number;
  summary?: string;
}

const LEVEL_LABELS: Record<string, string> = {
  JUNIOR: "Junior",
  INTERMEDIATE: "Confirmé",
  SENIOR: "Senior",
  LEAD: "Lead / Expert",
};

// ─── Tabs ─────────────────────────────────────────────────────────

type Tab = "profile" | "cv";

function TabButton({ active, onClick, icon: Icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
      style={active
        ? { backgroundColor: "#00b8d9", color: "#fff", boxShadow: "0 4px 12px rgba(0,184,217,0.3)" }
        : { backgroundColor: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }
      }
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ─── Profile Optimizer ────────────────────────────────────────────

function ProfileOptimizer() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [result, setResult] = useState<OptimizedProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await apiRequest<{ profile: ProfileData }>("/profile/me");
      if (r.success && r.data) {
        const p = r.data.profile || (r.data as unknown as ProfileData);
        if (p) {
          const skills = Array.isArray(p.skills)
            ? p.skills
            : typeof p.skills === "string"
            ? (() => { try { return JSON.parse(p.skills as string); } catch { return []; } })()
            : [];
          setProfile({ ...p, skills });
        }
      }
    })();
  }, []);

  const generate = async () => {
    if (!profile) return;
    setLoading(true);
    setResult(null);
    const r = await apiRequest<OptimizedProfile>("/ai/optimize-profile", {
      method: "POST",
      body: JSON.stringify(profile),
    });
    if (r.success && r.data) setResult(r.data);
    setLoading(false);
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#00b8d9]/10 flex items-center justify-center flex-shrink-0">
            <HiUserCircle className="w-5 h-5 text-[#00b8d9]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Optimisation du profil</h2>
            <p className="text-sm text-gray-500 mt-0.5">L&apos;IA analyse votre profil actuel et génère un titre, une bio et un pitch optimisés pour attirer les recruteurs.</p>
          </div>
        </div>

        {profile ? (
          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm text-gray-600 space-y-1">
            <p><span className="font-semibold text-gray-800">{profile.firstName} {profile.lastName}</span> — {profile.title || "Titre non renseigné"}</p>
            <p>Compétences : {(profile.skills || []).slice(0, 5).join(", ") || "Aucune"}</p>
            <p>Expérience : {profile.yearsOfExperience || 0} ans · TJM : {profile.tjm || 0} MAD/jour</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic mb-5">Chargement du profil…</p>
        )}

        <button
          onClick={generate}
          disabled={loading || !profile}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5"
          style={{ backgroundColor: "#00b8d9", boxShadow: "0 6px 16px rgba(0,184,217,0.3)" }}
        >
          {loading ? <HiArrowPath className="w-4 h-4 animate-spin" /> : <HiSparkles className="w-4 h-4" />}
          {loading ? "Génération en cours…" : "Générer avec l'IA"}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {result.title && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-700">Titre professionnel</h3>
                <button onClick={() => copy(result.title!, "title")} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00b8d9] cursor-pointer transition-colors">
                  {copied === "title" ? <HiCheckCircle className="w-4 h-4 text-emerald-500" /> : <HiClipboardDocument className="w-4 h-4" />}
                  {copied === "title" ? "Copié" : "Copier"}
                </button>
              </div>
              <p className="text-sm text-gray-900 font-semibold">{result.title}</p>
            </div>
          )}

          {result.bio && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-700">Bio professionnelle</h3>
                <button onClick={() => copy(result.bio!, "bio")} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00b8d9] cursor-pointer transition-colors">
                  {copied === "bio" ? <HiCheckCircle className="w-4 h-4 text-emerald-500" /> : <HiClipboardDocument className="w-4 h-4" />}
                  {copied === "bio" ? "Copié" : "Copier"}
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{result.bio}</p>
            </div>
          )}

          {result.pitch && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#00b8d9]/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[#00b8d9]">Pitch commercial</h3>
                <button onClick={() => copy(result.pitch!, "pitch")} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00b8d9] cursor-pointer transition-colors">
                  {copied === "pitch" ? <HiCheckCircle className="w-4 h-4 text-emerald-500" /> : <HiClipboardDocument className="w-4 h-4" />}
                  {copied === "pitch" ? "Copié" : "Copier"}
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{result.pitch}&rdquo;</p>
            </div>
          )}

          {result.suggestedSkills && result.suggestedSkills.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <HiLightBulb className="w-4 h-4 text-amber-400" />
                Compétences suggérées à ajouter
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.suggestedSkills.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CV Analyzer ──────────────────────────────────────────────────

function CvAnalyzer() {
  const [cvText, setCvText] = useState("");
  const [targetTitle, setTargetTitle] = useState("");
  const [result, setResult] = useState<CvAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (cvText.trim().length < 50) { setError("Collez au moins 50 caractères de votre CV."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    const r = await apiRequest<CvAnalysis>("/ai/analyze-cv", {
      method: "POST",
      body: JSON.stringify({ cvText: cvText.trim(), targetTitle: targetTitle || undefined }),
    });
    setLoading(false);
    if (r.success && r.data) setResult(r.data);
    else setError(r.message || "Erreur lors de l'analyse.");
  };

  const scoreColor = (s: number) => s >= 70 ? "#10b981" : s >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <HiDocumentText className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Analyse de CV</h2>
            <p className="text-sm text-gray-500 mt-0.5">Collez le contenu de votre CV et l&apos;IA vous donnera un score, les points forts, les lacunes, et des conseils concrets.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Contenu du CV <span className="text-gray-400 font-normal">(copiez-collez le texte)</span></label>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              rows={8}
              placeholder="Collez ici le texte de votre CV…&#10;Compétences, expériences, formations, etc."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none resize-none transition-all"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{cvText.length} caractères</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Poste ciblé <span className="text-gray-400 font-normal">(optionnel)</span></label>
            <input
              type="text"
              value={targetTitle}
              onChange={(e) => setTargetTitle(e.target.value)}
              placeholder="Ex: Développeur React Senior, Data Engineer…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 font-semibold">
              <HiExclamationCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            onClick={analyze}
            disabled={loading || cvText.length < 50}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5"
            style={{ backgroundColor: "#6366f1", boxShadow: "0 6px 16px rgba(99,102,241,0.3)" }}
          >
            {loading ? <HiArrowPath className="w-4 h-4 animate-spin" /> : <HiSparkles className="w-4 h-4" />}
            {loading ? "Analyse en cours…" : "Analyser le CV"}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Score */}
          {result.marketabilityScore !== undefined && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-5">
                <div className="flex-shrink-0">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white"
                    style={{ background: `conic-gradient(${scoreColor(result.marketabilityScore)} ${result.marketabilityScore}%, #e5e7eb ${result.marketabilityScore}%)` }}
                  >
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center" style={{ color: scoreColor(result.marketabilityScore) }}>
                      {result.marketabilityScore}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Score de marketabilité</p>
                  {result.estimatedLevel && (
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">
                      {LEVEL_LABELS[result.estimatedLevel] || result.estimatedLevel}
                    </span>
                  )}
                  {result.summary && <p className="text-sm text-gray-600 mt-2">{result.summary}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Strengths */}
          {result.strengths && result.strengths.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
                <HiCheckBadge className="w-4 h-4" /> Points forts
              </h3>
              <ul className="space-y-1.5">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing skills */}
          {result.missingSkills && result.missingSkills.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
              <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                <HiLightBulb className="w-4 h-4" /> Compétences manquantes
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {result.improvements && result.improvements.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-2">
                <HiArrowPath className="w-4 h-4" /> Actions recommandées
              </h3>
              <ol className="space-y-2">
                {result.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-indigo-400 font-bold flex-shrink-0">{i + 1}.</span> {s}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function CandidatIAPage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100" style={{ background: "linear-gradient(135deg,#0a1628,#1a2c4e)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00b8d9]/20 flex items-center justify-center flex-shrink-0">
            <HiSparkles className="w-6 h-6 text-[#00b8d9]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Assistant IA</h1>
            <p className="text-sm text-indigo-200 mt-0.5">Optimisez votre profil et analysez votre CV avec l&apos;intelligence artificielle</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={HiUserCircle} label="Optimiser mon profil" />
        <TabButton active={tab === "cv"} onClick={() => setTab("cv")} icon={HiDocumentText} label="Analyser mon CV" />
      </div>

      {/* Content */}
      {tab === "profile" && <ProfileOptimizer />}
      {tab === "cv" && <CvAnalyzer />}
    </div>
  );
}
