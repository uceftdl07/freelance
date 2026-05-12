"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineBuildingOffice2,
  HiOutlineGlobeAlt,
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineCheckBadge,
} from "react-icons/hi2";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const CONTRACT_LABELS: Record<string, string> = {
  FREELANCE: "Freelance",
  CDI: "CDI",
  CDD: "CDD",
};

type ActiveOffer = {
  id: string;
  title: string;
  location: string;
  remote: boolean;
  contractType: string;
  createdAt: string;
  tags: string[] | string;
};

type RecruiterProfile = {
  id: string;
  company: string;
  firstName: string;
  lastName: string;
  position: string | null;
  website: string | null;
  avatarUrl: string | null;
  description: string | null;
  sector: string | null;
  verificationStatus: string;
  activeOffers: ActiveOffer[];
};

function parseTags(tags: string[] | string): string[] {
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
}

export default function EntreprisePage() {
  const params = useParams();
  const id = params?.id as string;
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/profiles/recruiter/${id}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.success && r.data) setProfile(r.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#00b8d9] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <HiOutlineBuildingOffice2 className="w-16 h-16 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-700">Entreprise introuvable</h1>
        <Link href="/offres" className="text-sm text-[#00b8d9] hover:underline">← Retour aux offres</Link>
      </div>
    );
  }

  const initials = profile.company.charAt(0).toUpperCase();
  const isVerified = profile.verificationStatus === "VERIFIED";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-start gap-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-md flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0a1628, #1e3a5f)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-[#0a1628]">{profile.company}</h1>
                {isVerified && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    <HiOutlineCheckBadge className="w-3.5 h-3.5" /> Vérifié
                  </span>
                )}
              </div>
              {profile.sector && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <HiOutlineBriefcase className="w-4 h-4" /> {profile.sector}
                </p>
              )}
              {profile.website && (
                <a
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#00b8d9] hover:underline mt-1 flex items-center gap-1.5"
                >
                  <HiOutlineGlobeAlt className="w-4 h-4" /> {profile.website}
                </a>
              )}
            </div>
          </div>

          {profile.description && (
            <p className="mt-6 text-sm text-gray-600 leading-relaxed max-w-2xl">{profile.description}</p>
          )}
        </div>
      </div>

      {/* Active Offers */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-lg font-bold text-[#0a1628] mb-4">
          Offres actives ({profile.activeOffers.length})
        </h2>

        {profile.activeOffers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <HiOutlineBriefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucune offre active pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.activeOffers.map((offer) => {
              const tags = parseTags(offer.tags);
              return (
                <Link
                  key={offer.id}
                  href={`/offres/${offer.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-[#00b8d9] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${offer.contractType === "FREELANCE" ? "bg-[#00b8d9]/10 text-[#00b8d9]" : "bg-indigo-100 text-indigo-600"}`}>
                          {CONTRACT_LABELS[offer.contractType] || offer.contractType}
                        </span>
                        {offer.remote && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-600">
                            Remote
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#0a1628] hover:text-[#00b8d9] transition-colors">
                        {offer.title}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <HiOutlineMapPin className="w-3.5 h-3.5" /> {offer.location}
                      </p>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded text-[10px] font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[#00b8d9] font-bold flex-shrink-0 mt-1">Voir →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/offres" className="text-sm text-gray-400 hover:text-[#00b8d9] transition-colors">
            ← Toutes les offres
          </Link>
        </div>
      </div>
    </div>
  );
}
