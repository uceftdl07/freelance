"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import { getApiBaseUrl } from "../../../lib/api";
import {
  HiDocumentArrowUp, HiUser, HiBriefcase, HiClock, HiAcademicCap,
  HiWrenchScrewdriver, HiCheckCircle, HiChevronLeft, HiChevronRight,
  HiCloudArrowUp, HiSparkles, HiShieldCheck, HiEye, HiRocketLaunch,
  HiExclamationTriangle,
} from "react-icons/hi2";

const STEPS = [
  { id: 0, label: "Déposez votre CV", icon: HiDocumentArrowUp },
  { id: 1, label: "Informations personnelles", icon: HiUser },
  { id: 2, label: "Informations professionnelles", icon: HiBriefcase },
  { id: 3, label: "Expérience", icon: HiClock },
  { id: 4, label: "Formation", icon: HiAcademicCap },
  { id: 5, label: "Compétences", icon: HiWrenchScrewdriver },
];

interface FormData {
  firstName: string; lastName: string; email: string; phone: string;
  title: string; bio: string; skills: string[]; yearsOfExperience: number;
  availability: string; tjm: number; location: string; linkedIn: string; portfolioUrl: string;
}

const emptyForm: FormData = {
  firstName: "", lastName: "", email: "", phone: "",
  title: "", bio: "", skills: [], yearsOfExperience: 0,
  availability: "DISPONIBLE", tjm: 0, location: "", linkedIn: "", portfolioUrl: "",
};

const API_BASE = getApiBaseUrl();

export default function ProfileBuilder() {
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [form, setForm] = useState<FormData>(emptyForm);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const router = useRouter();

  const update = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }));

  const goNext = () => { setDone((p) => new Set(p).add(step)); if (step < 5) setStep(step + 1); };
  const goPrev = () => { if (step > 0) setStep(step - 1); };

  const handleParsed = (data: Partial<FormData>) => {
    setForm((f) => ({ ...f, ...data }));
    setDone((p) => new Set(p).add(0));
    setStep(1);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`${API_BASE}/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setDone((p) => new Set(p).add(5));
        setPublished(true);
        setTimeout(() => router.push("/dashboard/candidat"), 3000);
      }
    } catch (e) { console.error(e); }
    setPublishing(false);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      {/* Stepper sidebar */}
      <aside className="w-full lg:w-[280px] flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
          <div className="px-5 py-4" style={{ background: "linear-gradient(135deg, #0a1628, #111d33)" }}>
            <h3 className="text-white font-bold text-sm">Créer mon profil</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(done.size / 6) * 100}%`, background: "linear-gradient(90deg, #00b8d9, #10b981)" }} />
              </div>
              <span className="text-[11px] text-gray-400 font-mono">{done.size}/6</span>
            </div>
          </div>
          <nav className="p-3 space-y-0.5">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const active = step === s.id;
              const completed = done.has(s.id);
              return (
                <button key={s.id} onClick={() => setStep(s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer"
                  style={active ? { backgroundColor: "rgba(0,184,217,0.08)", borderLeft: "3px solid #00b8d9" } : { borderLeft: "3px solid transparent" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={active ? { backgroundColor: "#00b8d9", color: "white" } : completed ? { backgroundColor: "rgba(16,185,129,0.1)", color: "#10b981" } : { backgroundColor: "#f1f5f9", color: "#94a3b8" }}>
                    {completed && !active ? <HiCheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium" style={{ color: active ? "#00b8d9" : completed ? "#10b981" : "#94a3b8" }}>{s.label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#00b8d9" }} />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {published ? <SuccessView /> : (<>
          {step === 0 && <StepCV onParsed={handleParsed} onSkip={goNext} />}
          {step === 1 && <StepInfoPerso form={form} update={update} onNext={goNext} onPrev={goPrev} />}
          {step === 2 && <StepInfoPro form={form} update={update} onNext={goNext} onPrev={goPrev} />}
          {step === 3 && <StepExperience onNext={goNext} onPrev={goPrev} />}
          {step === 4 && <StepFormation onNext={goNext} onPrev={goPrev} />}
          {step === 5 && <StepCompetences form={form} update={update} onPublish={handlePublish} publishing={publishing} onPrev={goPrev} />}
          </>)}
        </div>
      </main>
    </div>
  );
}

/* ─── Step Footer ────────────────────────── */

function StepFooter({ onPrev, onNext, nextLabel = "Suivant", showPrev = true }: {
  onPrev?: () => void; onNext: () => void; nextLabel?: string; showPrev?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-7 py-4 border-t border-gray-100 bg-gray-50/50">
      {showPrev ? (
        <button onClick={onPrev} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
          <HiChevronLeft className="w-4 h-4" /> Précédent
        </button>
      ) : <div />}
      <button onClick={onNext} className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
        style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 14px rgba(0,184,217,0.3)" }}>
        {nextLabel} <HiChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Step 0: CV Upload + API Call ────────── */

function StepCV({ onParsed, onSkip }: { onParsed: (d: Partial<FormData>) => void; onSkip: () => void }) {
  const { token } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0]; if (f) setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError(null); setProgress(10);

    try {
      const formData = new window.FormData();
      formData.append("cv", file);

      // Progress simulation (real progress needs XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85));
      }, 300);

      const res = await fetch(`${API_BASE}/cv/parse`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const json = await res.json();

      if (json.success && json.data?.parsed) {
        const p = json.data.parsed;
        // Pass parsed data to parent → auto-advance to step 2
        setTimeout(() => {
          onParsed({
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            email: p.email || "",
            phone: p.phone || "",
            title: p.title || "",
            skills: p.skills || [],
            yearsOfExperience: p.yearsOfExperience || 0,
            location: p.location || "",
            linkedIn: p.linkedIn || "",
          });
        }, 500);
      } else {
        setError(json.message || "Erreur lors de l'analyse.");
        setUploading(false); setProgress(0);
      }
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez que le backend est lancé sur le port 5000.");
      setUploading(false); setProgress(0);
    }
  };

  return (
    <div>
      <div className="px-7 pt-7 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00b8d9, #0891b2)" }}>
            <HiRocketLaunch className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Création rapide de votre profil candidat</h2>
        </div>
        <p className="text-sm text-gray-500 mt-3 leading-relaxed">Importez votre CV et nous extrairons automatiquement vos informations.</p>
      </div>

      <div className="px-7 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: HiSparkles, title: "Extraction IA", desc: "Compétences et expérience détectées" },
          { icon: HiEye, title: "Visibilité max", desc: "Trouvé par les recruteurs facilement" },
          { icon: HiShieldCheck, title: "Données sécurisées", desc: "Informations confidentielles" },
        ].map((b) => (
          <div key={b.title} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
            <b.icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#00b8d9" }} />
            <div><p className="text-xs font-bold text-gray-700">{b.title}</p><p className="text-[11px] text-gray-500 mt-0.5">{b.desc}</p></div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div className="px-7 pb-5">
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
          className="relative rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer"
          style={{ borderColor: dragging ? "#00b8d9" : file ? "#10b981" : "#e2e8f0", backgroundColor: dragging ? "rgba(0,184,217,0.03)" : file ? "rgba(16,185,129,0.03)" : "transparent" }}
          onClick={() => !uploading && document.getElementById("cv-file-input")?.click()}>
          <input id="cv-file-input" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />

          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 animate-pulse" style={{ backgroundColor: "rgba(0,184,217,0.1)" }}>
                <HiSparkles className="w-7 h-7" style={{ color: "#00b8d9" }} />
              </div>
              <p className="text-sm font-bold text-gray-700">Analyse en cours...</p>
              <div className="w-48 h-2 rounded-full bg-gray-100 mt-3 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00b8d9, #10b981)" }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">Extraction des informations de votre CV</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(16,185,129,0.1)" }}>
                <HiCheckCircle className="w-7 h-7" style={{ color: "#10b981" }} />
              </div>
              <p className="text-sm font-bold text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} Ko • Prêt à envoyer</p>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="mt-2 text-xs text-red-400 hover:text-red-600 cursor-pointer">Supprimer</button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(0,184,217,0.08)" }}>
                <HiCloudArrowUp className="w-7 h-7" style={{ color: "#00b8d9" }} />
              </div>
              <p className="text-sm font-bold text-gray-700">Glissez et déposez votre CV ici</p>
              <p className="text-xs text-gray-400 mt-1">PDF ou Word • Maximum 10 Mo</p>
              <button className="mt-3 px-5 py-2 text-xs font-bold text-white rounded-xl cursor-pointer hover:-translate-y-0.5 transition-all" style={{ backgroundColor: "#00b8d9" }}>
                Parcourir les fichiers
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-7 mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          <HiExclamationTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      <div className="flex items-center justify-between px-7 py-4 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs text-gray-400">Vous pouvez aussi remplir manuellement</p>
        <button onClick={file ? handleUpload : onSkip} disabled={uploading}
          className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
          style={{ backgroundColor: file ? "#00b8d9" : "#0a1628", boxShadow: file ? "0 4px 14px rgba(0,184,217,0.3)" : "0 4px 14px rgba(10,22,40,0.2)" }}>
          {uploading ? "Analyse..." : file ? "Envoyer mon CV" : "Passer cette étape"} <HiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Step 1: Personal Info (pre-filled) ─── */

function StepInfoPerso({ form, update, onNext, onPrev }: { form: FormData; update: (p: Partial<FormData>) => void; onNext: () => void; onPrev: () => void }) {
  return (
    <div>
      <div className="px-7 pt-7 pb-2">
        <h2 className="text-lg font-bold text-gray-800">Informations personnelles</h2>
        <p className="text-sm text-gray-500 mt-1">Ces informations sont visibles uniquement par les recruteurs intéressés.</p>
      </div>
      <div className="px-7 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prénom" value={form.firstName} onChange={(v) => update({ firstName: v })} placeholder="Jean" />
          <Field label="Nom" value={form.lastName} onChange={(v) => update({ lastName: v })} placeholder="Dupont" />
        </div>
        <Field label="Email" value={form.email} onChange={(v) => update({ email: v })} placeholder="jean@email.com" type="email" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Téléphone" value={form.phone} onChange={(v) => update({ phone: v })} placeholder="+33 6 12 34 56 78" />
          <Field label="Localisation" value={form.location} onChange={(v) => update({ location: v })} placeholder="Paris" />
        </div>
        <Field label="LinkedIn" value={form.linkedIn} onChange={(v) => update({ linkedIn: v })} placeholder="https://linkedin.com/in/..." />
      </div>
      <StepFooter onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

/* ─── Step 2: Professional Info (pre-filled) ── */

function StepInfoPro({ form, update, onNext, onPrev }: { form: FormData; update: (p: Partial<FormData>) => void; onNext: () => void; onPrev: () => void }) {
  return (
    <div>
      <div className="px-7 pt-7 pb-2">
        <h2 className="text-lg font-bold text-gray-800">Informations professionnelles</h2>
        <p className="text-sm text-gray-500 mt-1">Décrivez votre profil pour mieux matcher avec les offres.</p>
      </div>
      <div className="px-7 py-5 space-y-4">
        <Field label="Titre professionnel" value={form.title} onChange={(v) => update({ title: v })} placeholder="Développeur React Senior" />
        <Field label="Bio / Résumé" value={form.bio} onChange={(v) => update({ bio: v })} placeholder="Décrivez votre parcours..." textarea />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Années d'expérience" value={String(form.yearsOfExperience || "")} onChange={(v) => update({ yearsOfExperience: parseInt(v) || 0 })} placeholder="5" type="number" />
          <Field label="TJM (€/jour)" value={String(form.tjm || "")} onChange={(v) => update({ tjm: parseInt(v) || 0 })} placeholder="600" type="number" />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Disponibilité</label>
            <select value={form.availability} onChange={(e) => update({ availability: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-[#00b8d9] focus:bg-white transition-all cursor-pointer">
              <option value="DISPONIBLE">Disponible</option>
              <option value="BIENTOT_DISPONIBLE">Bientôt disponible</option>
              <option value="EN_MISSION">En mission</option>
            </select>
          </div>
        </div>
        <Field label="Portfolio" value={form.portfolioUrl} onChange={(v) => update({ portfolioUrl: v })} placeholder="https://monsite.dev" />
      </div>
      <StepFooter onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

/* ─── Step 3: Experience ─────────────────── */

function StepExperience({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div>
      <div className="px-7 pt-7 pb-2"><h2 className="text-lg font-bold text-gray-800">Expérience professionnelle</h2><p className="text-sm text-gray-500 mt-1">Ajoutez vos expériences les plus significatives.</p></div>
      <div className="px-7 py-5">
        <ExpCard title="Développeur React Senior" company="TechCorp" period="Jan 2023 – Présent" desc="Applications web React/TypeScript avec architecture micro-frontend." />
        <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-[#00b8d9] hover:text-[#00b8d9] transition-all cursor-pointer">+ Ajouter une expérience</button>
      </div>
      <StepFooter onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

/* ─── Step 4: Education ──────────────────── */

function StepFormation({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div>
      <div className="px-7 pt-7 pb-2"><h2 className="text-lg font-bold text-gray-800">Formation</h2><p className="text-sm text-gray-500 mt-1">Ajoutez vos diplômes et certifications.</p></div>
      <div className="px-7 py-5">
        <ExpCard title="Master Informatique" company="Université Paris-Saclay" period="2018 – 2020" desc="Spécialisation génie logiciel et systèmes distribués." />
        <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-[#00b8d9] hover:text-[#00b8d9] transition-all cursor-pointer">+ Ajouter une formation</button>
      </div>
      <StepFooter onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

/* ─── Step 5: Skills + Publish ───────────── */

function StepCompetences({ form, update, onPublish, publishing, onPrev }: { form: FormData; update: (p: Partial<FormData>) => void; onPublish: () => void; publishing: boolean; onPrev: () => void }) {
  const [input, setInput] = useState("");
  const SUGGESTIONS = ["Vue", "Angular", "Python", "Java", "Docker", "Kubernetes", "AWS", "Go", "PostgreSQL", "GraphQL"];
  const remaining = SUGGESTIONS.filter((s) => !form.skills.includes(s));

  const addSkill = (s: string) => { if (!form.skills.includes(s)) update({ skills: [...form.skills, s] }); setInput(""); };
  const removeSkill = (s: string) => update({ skills: form.skills.filter((sk) => sk !== s) });

  return (
    <div>
      <div className="px-7 pt-7 pb-2"><h2 className="text-lg font-bold text-gray-800">Compétences techniques</h2><p className="text-sm text-gray-500 mt-1">Ajoutez vos compétences clés pour être trouvé par les recruteurs.</p></div>
      <div className="px-7 py-5 space-y-4">
        {form.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: "rgba(0,184,217,0.1)", color: "#00b8d9" }}>
                {s}<button onClick={() => removeSkill(s)} className="hover:text-red-500 cursor-pointer text-[10px]">✕</button>
              </span>
            ))}
          </div>
        )}
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { addSkill(input.trim()); } }}
          placeholder="Ajouter une compétence..."
          className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#00b8d9] focus:bg-white transition-all" />
        {remaining.length > 0 && (
          <div><p className="text-xs text-gray-400 mb-2">Suggestions :</p>
            <div className="flex flex-wrap gap-1.5">{remaining.slice(0, 8).map((s) => (
              <button key={s} onClick={() => addSkill(s)} className="px-3 py-1 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:border-[#00b8d9] hover:text-[#00b8d9] transition-all cursor-pointer">+ {s}</button>
            ))}</div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-7 py-4 border-t border-gray-100 bg-gray-50/50">
        <button onClick={onPrev} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
          <HiChevronLeft className="w-4 h-4" /> Précédent
        </button>
        <button onClick={onPublish} disabled={publishing}
          className="flex items-center gap-2 px-8 py-3 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #00b8d9, #0891b2)", boxShadow: "0 6px 20px rgba(0,184,217,0.35)" }}>
          <HiRocketLaunch className="w-5 h-5" />
          {publishing ? "Publication en cours..." : "🚀 Publier mon profil"}
        </button>
      </div>
    </div>
  );
}

/* ─── Success View ───────────────────────── */

function SuccessView() {
  return (
    <div className="p-12 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,184,217,0.1))" }}>
        <HiCheckCircle className="w-10 h-10" style={{ color: "#10b981" }} />
      </div>
      <h2 className="text-xl font-bold text-gray-800">Profil publié avec succès ! 🎉</h2>
      <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">Votre profil est maintenant visible par les recruteurs. Vous allez être redirigé vers votre tableau de bord.</p>
      <div className="mt-6 w-32 h-1.5 rounded-full bg-gray-100 mx-auto overflow-hidden">
        <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #00b8d9, #10b981)", animation: "fillBar 3s linear forwards" }} />
      </div>
      <style jsx>{`@keyframes fillBar { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}

/* ─── Shared UI ──────────────────────────── */

function Field({ label, value, onChange, placeholder, type = "text", textarea = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; textarea?: boolean;
}) {
  const cls = "w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-[#00b8d9] focus:bg-white transition-all";
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${cls} resize-none`} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />}
    </div>
  );
}

function ExpCard({ title, company, period, desc }: { title: string; company: string; period: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
      <div className="flex items-start justify-between mb-1"><h4 className="text-sm font-bold text-gray-800">{title}</h4><span className="text-[11px] text-gray-400">{period}</span></div>
      <p className="text-xs font-medium mb-1.5" style={{ color: "#00b8d9" }}>{company}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
