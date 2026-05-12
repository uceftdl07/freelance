"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiTrophy, HiArrowRight, HiArrowPath } from "react-icons/hi2";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface QuizScore {
  quizId?: string;
  skill: string;
  title: string;
  difficulty: string;
  score: number;
  totalQ: number;
  correctQ?: number;
  completedAt: string;
}

interface AvailableQuiz {
  id: string;
  skill: string;
  title: string;
  difficulty: string;
  timeLimit: number;
}

function scoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function scoreBg(score: number) {
  if (score >= 80) return "rgba(16,185,129,0.1)";
  if (score >= 60) return "rgba(245,158,11,0.1)";
  return "rgba(239,68,68,0.1)";
}

interface Props {
  /** candidateId = show read-only scores for a specific candidate (recruteur view) */
  candidateId?: string;
  /** token = show candidate's own scores + pass quiz buttons */
  token?: string;
  /** compact = small badges only (used inside profil card) */
  compact?: boolean;
}

export default function QuizScores({ candidateId, token, compact = false }: Props) {
  const [scores, setScores] = useState<QuizScore[]>([]);
  const [available, setAvailable] = useState<AvailableQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnView = !!token && !candidateId;

  useEffect(() => {
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const fetchScores = candidateId
      ? fetch(`${API_BASE}/quizzes/candidate/${candidateId}/scores`)
      : fetch(`${API_BASE}/quizzes/me/scores`, { headers });

    Promise.all([
      fetchScores.then((r) => r.json()),
      isOwnView ? fetch(`${API_BASE}/quizzes`).then((r) => r.json()) : Promise.resolve({ success: false }),
    ])
      .then(([scoresJson, availJson]) => {
        if (scoresJson.success) setScores(scoresJson.data);
        if (availJson.success) setAvailable(availJson.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [candidateId, token, isOwnView]);

  const doneSkills = new Set(scores.map((s) => s.skill));
  const notDone = available.filter((q) => !doneSkills.has(q.skill));

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
      <HiArrowPath className="w-4 h-4 animate-spin" /> Chargement des scores…
    </div>
  );

  if (compact) {
    // Just badges
    if (scores.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {scores.map((s) => (
          <span
            key={s.skill}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{ backgroundColor: scoreBg(s.score), color: scoreColor(s.score) }}
            title={`${s.title} — ${s.score}%`}
          >
            <HiTrophy className="w-3 h-3" />
            {s.skill} {s.score}%
          </span>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Scores already done */}
      {scores.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {scores.map((s) => (
            <div
              key={s.skill}
              className="flex items-center gap-3 p-3.5 rounded-xl border bg-white"
              style={{ borderColor: `${scoreColor(s.score)}40` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                style={{ background: `linear-gradient(135deg, ${scoreColor(s.score)}, ${scoreColor(s.score)}99)` }}
              >
                {s.score}%
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-[#0a1628] truncate">{s.skill}</p>
                <p className="text-xs text-gray-500">{s.correctQ ?? "?"}/{s.totalQ} bonnes réponses</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(s.completedAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              {isOwnView && (
                <Link
                  href={`/dashboard/candidat/quiz/${encodeURIComponent(s.skill)}`}
                  className="ml-auto text-xs text-[#00b8d9] hover:underline flex-shrink-0"
                >
                  Refaire
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Available quizzes not yet done */}
      {isOwnView && notDone.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Tests disponibles
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {notDone.map((q) => (
              <Link
                key={q.skill}
                href={`/dashboard/candidat/quiz/${encodeURIComponent(q.skill)}`}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 bg-white hover:border-[#00b8d9] transition-colors group"
              >
                <div>
                  <p className="font-semibold text-sm text-gray-800 group-hover:text-[#00b8d9]">{q.skill}</p>
                  <p className="text-xs text-gray-400">{q.timeLimit} min · {q.difficulty}</p>
                </div>
                <HiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#00b8d9] flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {scores.length === 0 && !isOwnView && (
        <p className="text-sm text-gray-400 italic">Aucun test complété pour l&apos;instant.</p>
      )}

      {scores.length === 0 && isOwnView && notDone.length === 0 && (
        <p className="text-sm text-gray-400 italic">Aucun quiz disponible.</p>
      )}
    </div>
  );
}
