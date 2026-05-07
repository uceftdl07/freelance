"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../../lib/api";
import {
  HiPlus,
  HiOutlineUsers,
  HiOutlinePencilSquare,
  HiOutlinePause,
  HiOutlineTrash,
  HiMapPin,
  HiCurrencyEuro,
  HiOutlineDocumentText,
  HiXMark,
  HiOutlinePlay,
  HiCheckCircle,
} from "react-icons/hi2";

interface Offer {
  id: string;
  title: string;
  type: string;
  status: string;
  apiStatus: "ACTIVE" | "CLOSED" | "DRAFT";
  candidates: number;
  location: string;
  tjm: string;
  date: string;
  description: string;
  skills: string[];
  typeColor: string;
}

interface ApiJobOffer {
  id: string;
  title: string;
  contractType: "FREELANCE" | "CDI" | "CDD";
  status: "ACTIVE" | "CLOSED" | "DRAFT";
  location: string;
  tjm: number | null;
  createdAt: string;
  description: string;
  tags: string[];
}

const INITIAL_OFFERS: Offer[] = [
  {
    id: "1",
    title: "Ingénieur Cloud AWS Senior",
    type: "Freelance",
    status: "Publiée",
    apiStatus: "ACTIVE",
    candidates: 12,
    location: "Paris • Hybride",
    tjm: "650€/jour",
    date: "Il y a 2 jours",
    description: "Nous cherchons un ingénieur Cloud expérimenté pour une mission de migration vers AWS.",
    skills: ["AWS", "Terraform", "Docker"],
    typeColor: "bg-[#00b8d9]/10 text-[#00b8d9]",
  },
  {
    id: "2",
    title: "Développeur Fullstack React / Node",
    type: "CDI",
    status: "Publiée",
    apiStatus: "ACTIVE",
    candidates: 45,
    location: "Lyon • Sur site",
    tjm: "45k€ - 55k€",
    date: "Il y a 5 jours",
    description: "Rejoignez notre équipe pour développer notre plateforme SaaS en React et Node.js.",
    skills: ["React", "Node.js", "TypeScript"],
    typeColor: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "3",
    title: "Tech Lead Data Engineer",
    type: "Freelance",
    status: "Brouillon",
    apiStatus: "DRAFT",
    candidates: 0,
    location: "100% Remote",
    tjm: "750€/jour",
    date: "Aujourd'hui",
    description: "Lead technique data engineering pour refonte du pipeline de données.",
    skills: ["Python", "Spark", "Airflow"],
    typeColor: "bg-[#00b8d9]/10 text-[#00b8d9]",
  },
  {
    id: "4",
    title: "Product Manager B2B",
    type: "CDD",
    status: "Suspendue",
    apiStatus: "CLOSED",
    candidates: 8,
    location: "Nantes",
    tjm: "50k€",
    date: "Il y a 2 semaines",
    description: "Gestion de la roadmap produit pour notre offre B2B SaaS.",
    skills: ["Product Management", "Agile", "B2B"],
    typeColor: "bg-purple-100 text-purple-700",
  },
];

function getStatusStyle(status: string) {
  switch (status) {
    case "Publiée":
      return "bg-emerald-100 text-emerald-700";
    case "Brouillon":
      return "bg-gray-100 text-gray-600";
    case "Suspendue":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function toDisplayStatus(status: ApiJobOffer["status"]): Offer["status"] {
  if (status === "ACTIVE") return "Publiée";
  if (status === "DRAFT") return "Brouillon";
  return "Suspendue";
}

function toApiType(type: string): ApiJobOffer["contractType"] {
  if (type.toUpperCase() === "CDI") return "CDI";
  if (type.toUpperCase() === "CDD") return "CDD";
  return "FREELANCE";
}

function toDisplayType(type: ApiJobOffer["contractType"]): string {
  return type === "FREELANCE" ? "Freelance" : type;
}

function getTypeColor(type: string): string {
  if (type === "Freelance") return "bg-[#00b8d9]/10 text-[#00b8d9]";
  if (type === "CDI") return "bg-indigo-100 text-indigo-700";
  return "bg-purple-100 text-purple-700";
}

function mapApiToOffer(job: ApiJobOffer): Offer {
  const type = toDisplayType(job.contractType);
  return {
    id: job.id,
    title: job.title,
    type,
    status: toDisplayStatus(job.status),
    apiStatus: job.status,
    candidates: 0,
    location: job.location,
    tjm: job.tjm != null ? `${job.tjm}€/jour` : "À définir",
    date: new Date(job.createdAt).toLocaleDateString("fr-FR"),
    description: job.description,
    skills: Array.isArray(job.tags) ? job.tags : [],
    typeColor: getTypeColor(type),
  };
}

export default function RecruteurOffresPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeTab, setActiveTab] = useState("Toutes");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState("Freelance");
  const [formLocation, setFormLocation] = useState("");
  const [formTjm, setFormTjm] = useState("");
  const [formSkills, setFormSkills] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMyOffers = useCallback(async () => {
    setLoading(true);
    const res = await apiRequest<{ jobs: ApiJobOffer[] }>("/jobs/mine");

    if (res.success && res.data?.jobs) {
      setOffers(res.data.jobs.map(mapApiToOffer));
    } else {
      setOffers(INITIAL_OFFERS);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchMyOffers();
  }, [fetchMyOffers]);

  const openCreateModal = () => {
    setEditingOffer(null);
    setFormTitle("");
    setFormDesc("");
    setFormType("Freelance");
    setFormLocation("");
    setFormTjm("");
    setFormSkills("");
    setModalOpen(true);
  };

  const openEditModal = (offer: Offer) => {
    setEditingOffer(offer);
    setFormTitle(offer.title);
    setFormDesc(offer.description);
    setFormType(offer.type);
    setFormLocation(offer.location);
    setFormTjm(offer.tjm);
    setFormSkills(offer.skills.join(", "));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);

    const payload = {
      title: formTitle,
      description: formDesc,
      contractType: toApiType(formType),
      location: formLocation,
      tjm: formTjm ? parseInt(formTjm.replace(/\D/g, ""), 10) || null : null,
      tags: formSkills.split(",").map((s) => s.trim()).filter(Boolean),
      status: editingOffer ? editingOffer.apiStatus : "DRAFT",
    };

    if (editingOffer) {
      const res = await apiRequest(`/jobs/${editingOffer.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast(res.success ? "✅ Offre mise à jour avec succès" : "Erreur lors de la mise à jour de l'offre.");
    } else {
      const res = await apiRequest("/jobs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast(res.success ? "🎉 Nouvelle offre créée avec succès" : "Erreur lors de la création de l'offre.");
    }

    await fetchMyOffers();
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Supprimer cette offre ? Cette action est irreversible.");
    if (!confirmed) return;

    const res = await apiRequest(`/jobs/${id}`, { method: "DELETE" });
    if (res.success) {
      showToast("🗑️ Offre supprimée");
      await fetchMyOffers();
    } else {
      showToast("Erreur lors de la suppression de l'offre.");
    }
  };

  const handleToggleSuspend = async (id: string) => {
    const target = offers.find((offer) => offer.id === id);
    if (!target) return;

    const confirmed = window.confirm(
      target.status === "Suspendue"
        ? "Reactiver cette offre ?"
        : "Suspendre cette offre ?"
    );
    if (!confirmed) return;

    const nextStatus = target.apiStatus === "CLOSED" ? "ACTIVE" : "CLOSED";
    const res = await apiRequest(`/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.success) {
      showToast(nextStatus === "ACTIVE" ? "▶️ Offre réactivée" : "⏸️ Offre suspendue");
      await fetchMyOffers();
    } else {
      showToast("Erreur lors de la mise à jour du statut.");
    }
  };

  // Tabs counts
  const published = offers.filter((o) => o.status === "Publiée").length;
  const drafts = offers.filter((o) => o.status === "Brouillon").length;
  const suspended = offers.filter((o) => o.status === "Suspendue").length;

  const tabs = [
    { label: "Toutes", count: offers.length },
    { label: "Publiées", count: published },
    { label: "Brouillons", count: drafts },
    { label: "Suspendues", count: suspended },
  ];

  const filtered =
    activeTab === "Toutes"
      ? offers
      : activeTab === "Publiées"
        ? offers.filter((o) => o.status === "Publiée")
        : activeTab === "Brouillons"
          ? offers.filter((o) => o.status === "Brouillon")
          : offers.filter((o) => o.status === "Suspendue");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-[#0a1628] text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
          <HiCheckCircle className="w-5 h-5 text-[#00b8d9]" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes annonces</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos offres, modifiez-les et analysez vos candidatures.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer"
          style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 14px rgba(0,184,217,0.3)" }}
        >
          <HiPlus className="w-5 h-5" /> Publier une offre
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.label
                ? "border-[#00b8d9] text-[#00b8d9]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-gray-500 font-medium">Chargement des offres...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <HiOutlineDocumentText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Aucune offre dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
            >
              {/* Left part: Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-[#0a1628] group-hover:text-[#00b8d9] transition-colors">
                    {offer.title}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider ${getStatusStyle(offer.status)}`}>
                    {offer.status}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider ${offer.typeColor}`}>
                    {offer.type}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <HiMapPin className="w-4 h-4 text-gray-400" /> {offer.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HiCurrencyEuro className="w-4 h-4 text-gray-400" /> {offer.tjm}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HiOutlineDocumentText className="w-4 h-4 text-gray-400" /> Créée {offer.date}
                  </span>
                </div>
              </div>

              {/* Middle part: Counter */}
              <div className="lg:w-48 flex items-center lg:justify-center">
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <HiOutlineUsers className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 leading-tight">{offer.candidates}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Candidatures</p>
                  </div>
                </div>
              </div>

              {/* Right part: Actions */}
              <div className="flex items-center gap-2 lg:justify-end border-t border-gray-100 lg:border-t-0 pt-4 lg:pt-0">
                <Link
                  href={`/dashboard/recruteur/offres/${offer.id}/candidats`}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  Voir les candidats
                </Link>
                <button
                  onClick={() => openEditModal(offer)}
                  className="p-2 text-gray-400 hover:text-[#00b8d9] hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                  title="Éditer"
                  aria-label={`Editer l'offre ${offer.title}`}
                >
                  <HiOutlinePencilSquare className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleToggleSuspend(offer.id)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    offer.status === "Suspendue"
                      ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                      : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
                  }`}
                  title={offer.status === "Suspendue" ? "Réactiver" : "Suspendre"}
                  aria-label={offer.status === "Suspendue" ? `Reactiver l'offre ${offer.title}` : `Suspendre l'offre ${offer.title}`}
                >
                  {offer.status === "Suspendue" ? (
                    <HiOutlinePlay className="w-5 h-5" />
                  ) : (
                    <HiOutlinePause className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(offer.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Supprimer"
                  aria-label={`Supprimer l'offre ${offer.title}`}
                >
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingOffer ? "Modifier l'offre" : "Publier une nouvelle offre"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer" aria-label="Fermer la fenetre">
                <HiXMark className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Titre de la mission *</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Développeur React Senior"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00b8d9] transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="Décrivez la mission..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00b8d9] transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1 block">Type de contrat</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00b8d9] transition-colors bg-white"
                  >
                    <option value="Freelance">Freelance</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1 block">Localisation</label>
                  <input
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Paris, Remote..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00b8d9] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">TJM / Salaire</label>
                <input
                  value={formTjm}
                  onChange={(e) => setFormTjm(e.target.value)}
                  placeholder="650€/jour ou 45k€ - 55k€"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00b8d9] transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Compétences (séparées par des virgules)</label>
                <input
                  value={formSkills}
                  onChange={(e) => setFormSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00b8d9] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!formTitle.trim() || saving}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 14px rgba(0,184,217,0.3)" }}
              >
                {saving ? "Enregistrement..." : editingOffer ? "Enregistrer" : "Publier l'offre"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
