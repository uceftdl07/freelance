"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import {
  HiStar,
  HiOutlineStar,
  HiCheckBadge,
  HiXMark,
  HiPaperAirplane,
} from "react-icons/hi2";

const BADGE_LABELS: Record<string, { label: string; color: string }> = {
  MISSION_REUSSIE:    { label: "Mission réussie",   color: "#10b981" },
  LIVRAISON_RAPIDE:   { label: "Livraison rapide",   color: "#00b8d9" },
  LONG_TERME:         { label: "Long terme",          color: "#6366f1" },
  EXPERT_TECHNIQUE:   { label: "Expert technique",   color: "#f59e0b" },
  BON_COMMUNICANT:    { label: "Bon communicant",    color: "#ec4899" },
};

type BadgeKey = keyof typeof BADGE_LABELS;

interface Reviewer {
  id: string;
  role: string;
  profileCandidat?: { firstName: string; lastName: string; avatarUrl: string | null };
  profileRecruteur?: { firstName: string; lastName: string; company: string; avatarUrl: string | null };
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  type: string;
  badges: string[];
  createdAt: string;
  from: Reviewer;
}

interface ReputationData {
  reviews: Review[];
  total: number;
  score: number;
  badgeCounts: Record<string, number>;
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating ? (
          <HiStar key={i} className={`${sz} text-amber-400`} />
        ) : (
          <HiOutlineStar key={i} className={`${sz} text-gray-300`} />
        )
      )}
    </div>
  );
}

function reviewerName(from: Reviewer): string {
  if (from.profileCandidat) {
    return `${from.profileCandidat.firstName} ${from.profileCandidat.lastName}`;
  }
  if (from.profileRecruteur) {
    return `${from.profileRecruteur.firstName} ${from.profileRecruteur.lastName}`;
  }
  return "Utilisateur";
}

function reviewerSub(from: Reviewer): string {
  if (from.role === "RECRUTEUR" && from.profileRecruteur) return from.profileRecruteur.company;
  if (from.role === "CANDIDAT") return "Freelance";
  return "";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Score Ring ───────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={radius} strokeWidth="7" stroke="#e5e7eb" fill="none" />
        <circle
          cx="44" cy="44" r={radius}
          strokeWidth="7"
          stroke={color}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="mt-1 text-center">
        <p className="text-2xl font-black" style={{ color }}>{score}</p>
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Score</p>
      </div>
    </div>
  );
}

// ─── Leave Review Modal ───────────────────────────────────────────
interface LeaveReviewModalProps {
  toUserId: string;
  applicationId?: string;
  targetName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function LeaveReviewModal({
  toUserId,
  applicationId,
  targetName,
  onClose,
  onSuccess,
}: LeaveReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedBadges, setSelectedBadges] = useState<BadgeKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const toggleBadge = (b: BadgeKey) => {
    setSelectedBadges((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : prev.length < 3 ? [...prev, b] : prev
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) { setError("Sélectionnez une note."); return; }
    setSaving(true);
    setError("");
    const r = await apiRequest("/reviews", {
      method: "POST",
      body: JSON.stringify({ toUserId, applicationId, rating, comment: comment || undefined, badges: selectedBadges }),
    });
    setSaving(false);
    if (r.success) { setDone(true); setTimeout(() => { onSuccess(); onClose(); }, 1500); }
    else setError(r.message || "Erreur.");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ animation: "fadeInUp 0.3s ease" }}>
        <div className="px-7 pt-7 pb-5" style={{ background: "linear-gradient(135deg,#0a1628,#111d33)" }}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <HiXMark className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center">
              <HiStar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Laisser un avis</h2>
              <p className="text-sm text-gray-400">{targetName}</p>
            </div>
          </div>
        </div>

        <div className="px-7 py-6 space-y-5">
          {done ? (
            <div className="text-center py-6">
              <HiCheckBadge className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
              <p className="text-lg font-bold text-gray-900">Avis envoyé !</p>
              <p className="text-sm text-gray-500 mt-1">Merci pour votre retour.</p>
            </div>
          ) : (
            <>
              {/* Stars */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Note globale</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(i)}
                      className="transition-transform hover:scale-110 cursor-pointer"
                    >
                      {i <= (hovered || rating) ? (
                        <HiStar className="w-8 h-8 text-amber-400" />
                      ) : (
                        <HiOutlineStar className="w-8 h-8 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Badges <span className="font-normal text-gray-400">(3 max)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(BADGE_LABELS) as BadgeKey[]).map((b) => {
                    const active = selectedBadges.includes(b);
                    const { label, color } = BADGE_LABELS[b];
                    return (
                      <button
                        key={b}
                        onClick={() => toggleBadge(b)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer"
                        style={{
                          borderColor: active ? color : "#e5e7eb",
                          backgroundColor: active ? color + "20" : "#f9fafb",
                          color: active ? color : "#6b7280",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Commentaire <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Décrivez votre expérience…"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#00b8d9] focus:ring-2 focus:ring-[#00b8d9]/20 outline-none resize-none transition-all"
                />
              </div>

              {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={saving || rating === 0}
                className="w-full py-3.5 text-sm font-extrabold text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5"
                style={{ backgroundColor: "#00b8d9", boxShadow: "0 8px 20px rgba(0,184,217,0.3)" }}
              >
                <HiPaperAirplane className="w-4 h-4" />
                {saving ? "Envoi…" : "Envoyer l'avis"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reputation Display Section ───────────────────────────────────
export default function ReputationSection({ userId }: { userId: string }) {
  const [data, setData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await apiRequest<ReputationData>(`/reviews/user/${userId}`);
      if (r.success && r.data) setData(r.data);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return null;
  if (!data || data.total === 0) {
    return (
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Réputation</h2>
        <p className="text-sm text-gray-400 italic">Aucun avis pour le moment.</p>
      </section>
    );
  }

  const topBadges = Object.entries(data.badgeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Réputation</h2>

      {/* Score + badges */}
      <div className="flex items-start gap-6">
        <ScoreRing score={data.score} />
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-3">
            <span className="font-bold text-gray-900">{data.total}</span> avis reçus
          </p>
          {topBadges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topBadges.map(([badge, count]) => {
                const info = BADGE_LABELS[badge as BadgeKey];
                if (!info) return null;
                return (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                    style={{ borderColor: info.color + "40", backgroundColor: info.color + "15", color: info.color }}
                  >
                    <HiCheckBadge className="w-3.5 h-3.5" />
                    {info.label}
                    <span className="font-normal opacity-70">×{count}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {data.reviews.slice(0, 5).map((review) => {
          const name = reviewerName(review.from);
          const sub = reviewerSub(review.from);
          return (
            <div key={review.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#0a1628,#00b8d9)" }}
                >
                  {initials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{name}</p>
                      {sub && <p className="text-xs text-gray-400">{sub}</p>}
                    </div>
                    <StarRow rating={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                  )}
                  {review.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {review.badges.map((b) => {
                        const info = BADGE_LABELS[b as BadgeKey];
                        if (!info) return null;
                        return (
                          <span
                            key={b}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: info.color + "15", color: info.color }}
                          >
                            {info.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
