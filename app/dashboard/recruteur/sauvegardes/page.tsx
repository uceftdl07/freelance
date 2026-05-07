"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiUser, HiBookmark } from "react-icons/hi2";
import { apiRequest } from "../../../lib/api";

interface SavedCandidate {
  id: string;
  candidateUserId?: string;
  name: string;
  title: string;
  location: string;
  tjm: number;
}

interface SavedCandidateApiItem {
  candidateId: string;
  profile: {
    id: string;
    userId: string;
    name: string;
    title: string | null;
    location: string | null;
    tjm: number | null;
  } | null;
}

export default function SauvegardesPage() {
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedCandidates = async () => {
      setLoading(true);

      try {
        const response = await apiRequest<{ candidates: SavedCandidateApiItem[] }>("/saved-candidates");
        if (response.success && response.data?.candidates) {
          const hydrated = response.data.candidates.map((item) => ({
            id: item.profile?.id || item.candidateId,
            candidateUserId: item.candidateId,
            name: item.profile?.name || `Candidat #${item.candidateId}`,
            title: item.profile?.title || "Profil candidat",
            location: item.profile?.location || "Localisation inconnue",
            tjm: item.profile?.tjm || 0,
          }));
          setSavedCandidates(hydrated);
          setLoading(false);
          return;
        }
      } catch {
        // Fall back to local cache when API is unavailable.
      }

      try {
        const raw = localStorage.getItem("freelanceit_savedCandidates") || "[]";
        const ids: string[] = JSON.parse(raw);
        const rawData = localStorage.getItem("freelanceit_savedCandidatesData") || "{}";
        const data = JSON.parse(rawData) as Record<string, SavedCandidate>;

        const hydrated = ids.map((id) => {
          return (
            data[id] || {
              id,
              candidateUserId: id,
              name: `Candidat #${id}`,
              title: "Profil candidat",
              location: "Localisation inconnue",
              tjm: 0,
            }
          );
        });

        setSavedCandidates(hydrated);
      } catch {
        setSavedCandidates([]);
      }

      setLoading(false);
    };

    void loadSavedCandidates();
  }, []);

  const removeSaved = (id: string) => {
    const confirmed = window.confirm("Retirer ce candidat de vos sauvegardes ?");
    if (!confirmed) return;

    const candidateToRemove = savedCandidates.find((candidate) => candidate.id === id);
    const backendCandidateId = candidateToRemove?.candidateUserId || id;

    const updated = savedCandidates.filter((candidate) => candidate.id !== id);
    setSavedCandidates(updated);
    localStorage.setItem(
      "freelanceit_savedCandidates",
      JSON.stringify(updated.map((candidate) => candidate.candidateUserId || candidate.id))
    );

    const rawData = localStorage.getItem("freelanceit_savedCandidatesData") || "{}";
    const data = JSON.parse(rawData) as Record<string, SavedCandidate>;
    delete data[id];
    delete data[backendCandidateId];
    localStorage.setItem("freelanceit_savedCandidatesData", JSON.stringify(data));

    void apiRequest(`/saved-candidates/${backendCandidateId}`, { method: "DELETE" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <HiBookmark className="w-6 h-6" style={{ color: "#00b8d9" }} />
          Candidats Sauvegardés
        </h2>
        <p className="text-sm text-gray-500 mt-1">Retrouvez les profils que vous avez mis de côté.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-sm text-gray-400">Chargement des sauvegardes...</p>
        </div>
      ) : savedCandidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <HiUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">Aucun candidat sauvegarde</h3>
          <p className="text-sm text-gray-400 mt-1">Sauvegardez des profils depuis la page de recherche pour les retrouver ici.</p>
          <Link
            href="/dashboard/recruteur/recherche-talents"
            className="inline-flex mt-4 px-4 py-2 text-sm font-bold text-white rounded-xl"
            style={{ backgroundColor: "#00b8d9" }}
          >
            Rechercher des profils
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {savedCandidates.map((candidate) => (
            <div key={candidate.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-800">{candidate.name}</p>
                <p className="text-xs text-gray-500">{candidate.title} • {candidate.location}</p>
                {candidate.tjm > 0 && (
                  <p className="text-xs text-[#00b8d9] font-semibold mt-1">{candidate.tjm} EUR/j</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/recruteur/recherche-talents/${candidate.id}`} className="px-3 py-1.5 text-xs font-bold rounded-lg text-[#00b8d9] bg-[#00b8d9]/10 hover:bg-[#00b8d9]/20 transition-colors">
                  Ouvrir
                </Link>
                <button onClick={() => removeSaved(candidate.id)} className="px-3 py-1.5 text-xs font-bold rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
