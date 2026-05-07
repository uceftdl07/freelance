"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../lib/api";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCamera,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

export default function RecruteurProfilPage() {
  const [toast, setToast] = useState<{ message: string; kind: "success" | "warning" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Mock form state — pre-filled for demo
  const [companyName, setCompanyName] = useState("Qonto Technologies");
  const [sector, setSector] = useState("Tech & Logiciels SaaS");
  const [size, setSize] = useState("50-200");
  const [website, setWebsite] = useState("https://qonto.com");
  const [location, setLocation] = useState("Paris, France");
  const [description, setDescription] = useState(
    "Qonto Technologies est une fintech européenne qui simplifie la gestion financière des PME et des indépendants. Notre mission : créer l'outil de gestion financière le plus simple et le plus efficace pour les professionnels.\n\nNos valeurs :\n• Ambition — Nous visons l'excellence dans chaque produit que nous construisons.\n• Teamplay — L'intelligence collective est au cœur de notre ADN.\n• Mastery — Nous encourageons l'apprentissage continu et le développement personnel.\n• Integrity — La transparence et l'honnêteté guident toutes nos décisions."
  );

  const handleSave = async () => {
    setSaving(true);

    const res = await apiRequest("/profile/me", {
      method: "PUT",
      body: JSON.stringify({
        company: companyName,
        position: sector,
        website,
      }),
    });

    try {
      localStorage.setItem(
        "freelanceit_recruiter_profile",
        JSON.stringify({
          companyName,
          sector,
          size,
          website,
          location,
          description,
          logoPreview,
        })
      );
    } catch {
      // Ignore storage errors on locked environments.
    }

    if (res.success) {
      setToast({ message: "Modifications enregistrées avec succès.", kind: "success" });
    } else {
      setToast({ message: "Modifications enregistrées localement (sync serveur indisponible).", kind: "warning" });
    }
    setTimeout(() => setToast(null), 3000);

    setSaving(false);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

      const res = await apiRequest<{
        profile?: {
          company?: string;
          position?: string;
          website?: string;
        };
      }>("/profile/me");

      if (res.success && res.data?.profile) {
        if (res.data.profile.company) setCompanyName(res.data.profile.company);
        if (res.data.profile.position) setSector(res.data.profile.position);
        if (res.data.profile.website) setWebsite(res.data.profile.website);
      }

      try {
        const raw = localStorage.getItem("freelanceit_recruiter_profile");
        if (raw) {
          const stored = JSON.parse(raw) as {
            companyName?: string;
            sector?: string;
            size?: string;
            website?: string;
            location?: string;
            description?: string;
            logoPreview?: string | null;
          };

          if (stored.companyName) setCompanyName(stored.companyName);
          if (stored.sector) setSector(stored.sector);
          if (stored.size) setSize(stored.size);
          if (stored.website) setWebsite(stored.website);
          if (stored.location) setLocation(stored.location);
          if (stored.description) setDescription(stored.description);
          if (typeof stored.logoPreview === "string") setLogoPreview(stored.logoPreview);
        }
      } catch {
        // Ignore corrupted local data.
      }

      setLoading(false);
    };

    void loadProfile();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-4 fade-in"
          style={{
            background: toast.kind === "success" ? "#0a1628" : "#7c2d12",
          }}
        >
          <HiOutlineCheckCircle className="w-5 h-5" style={{ color: toast.kind === "success" ? "#00b8d9" : "#f59e0b" }} />
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil de l&apos;entreprise</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complétez votre profil pour attirer les meilleurs talents. Un profil complet reçoit 3× plus de candidatures.
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-sm text-gray-500">
          Chargement du profil...
        </div>
      )}

      {/* Section 1: Logo & Identity */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-6">
          <HiOutlineBuildingOffice2 className="w-5 h-5 text-[#00b8d9]" />
          Logo et identité
        </h2>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Logo Upload */}
          <div className="flex-shrink-0">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#1a2c4e] flex items-center justify-center text-white font-black text-2xl shadow-lg relative group cursor-pointer overflow-hidden"
            >
              {logoPreview ? (
                // Show uploaded logo preview in-place for immediate feedback.
                <img src={logoPreview} alt="Logo entreprise" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                "QT"
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <HiOutlineCamera className="w-6 h-6 text-white" />
              </div>
            </button>
            <p className="text-[11px] text-gray-400 mt-2 text-center">Modifier le logo</p>
          </div>

          {/* Name + Sector */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">Nom de l&apos;entreprise</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#00b8d9]/30 focus:border-[#00b8d9] transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">Secteur d&apos;activité</label>
              <input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#00b8d9]/30 focus:border-[#00b8d9] transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: General Info */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-6">
          <HiOutlineGlobeAlt className="w-5 h-5 text-[#00b8d9]" />
          Informations générales
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">
              <span className="flex items-center gap-1.5"><HiOutlineUserGroup className="w-4 h-4 text-gray-400" /> Taille de l&apos;entreprise</span>
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#00b8d9]/30 focus:border-[#00b8d9] transition-all bg-white appearance-none"
            >
              <option value="1-10">1 — 10 employés</option>
              <option value="11-50">11 — 50 employés</option>
              <option value="50-200">50 — 200 employés</option>
              <option value="200-500">200 — 500 employés</option>
              <option value="500+">500+ employés</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">
              <span className="flex items-center gap-1.5"><HiOutlineGlobeAlt className="w-4 h-4 text-gray-400" /> Site web</span>
            </label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#00b8d9]/30 focus:border-[#00b8d9] transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">
              <span className="flex items-center gap-1.5"><HiOutlineMapPin className="w-4 h-4 text-gray-400" /> Localisation du siège</span>
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#00b8d9]/30 focus:border-[#00b8d9] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Description */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-6">
          <HiOutlineBuildingOffice2 className="w-5 h-5 text-[#00b8d9]" />
          Présentation de l&apos;entreprise
        </h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#00b8d9]/30 focus:border-[#00b8d9] transition-all resize-none"
        />
        <p className="text-[11px] text-gray-400 mt-2">
          Décrivez votre entreprise, sa mission, ses valeurs et sa culture. Un bon texte attire les candidats qui vous ressemblent.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-60"
          style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 14px rgba(0,184,217,0.3)" }}
        >
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}
