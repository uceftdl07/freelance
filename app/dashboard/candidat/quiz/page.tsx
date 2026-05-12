"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../lib/AuthContext";
import {
  HiTrophy,
  HiArrowRight,
  HiClock,
  HiArrowPath,
  HiCheckBadge,
} from "react-icons/hi2";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Quiz {
  id: string;
  skill: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
}

interface Score {
  skill: string;
  score: number;
  completedAt: string;
}

const DIFF_LABELS: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

const DIFF_COLORS: Record<string, string> = {
  BEGINNER: "#10b981",
  INTERMEDIATE: "#f59e0b",
  ADVANCED: "#ef4444",
};

function scoreColor(s: number) {
  if (s >= 80) return "#10b981";
  if (s >= 60) return "#f59e0b";
  return "#ef4444";
}

export default function QuizIndexPage() {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [scores, setScores] = useState<Map<string, Score>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    Promise.all([
      fetch(`${API_BASE}/quizzes`).then((r) => r.json()),
      token
        ? fetch(`${API_BASE}/quizzes/me/scores`, { headers }).then((r) => r.json())
        : Promise.resolve({ success: false, data: [] }),
    ])
      .then(([qJson, sJson]) => {
        if (qJson.success) setQuizzes(qJson.data);
        if (sJson.success) {
          const map = new Map<string, Score>();
          for (const s of sJson.data as Score[]) map.set(s.skill, s);
          setScores(map);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0a1628, #00b8d9)" }}
            >
              <HiTrophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0a1628]">Tests techniques</h1>
          </div>
          <p className="text-gray-500 text-sm ml-13">
            Certifiez vos compétences avec des QCM de 10 questions. Votre meilleur score est visible par les recruteurs sur votre profil.
          </p>
        </div>

        {/* Stats bar */}
        {scores.size > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 flex items-center gap-6 mb-8 shadow-sm">
            <div>
              <p className="text-2xl font-extrabold text-[#0a1628]">{scores.size}</p>
              <p className="text-xs text-gray-500">Test{scores.size > 1 ? "s" : ""} complété{scores.size > 1 ? "s" : ""}</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div>
              <p className="text-2xl font-extrabold text-[#0a1628]">
                {Math.round(Array.from(scores.values()).reduce((a, s) => a + s.score, 0) / scores.size)}%
              </p>
              <p className="text-xs text-gray-500">Score moyen</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div>
              <p className="text-2xl font-extrabold text-[#0a1628]">{quizzes.length - scores.size}</p>
              <p className="text-xs text-gray-500">Restant{quizzes.length - scores.size > 1 ? "s" : ""}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <HiArrowPath className="w-5 h-5 animate-spin mr-2" />
            Chargement…
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">Aucun test disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map((q) => {
              const done = scores.get(q.skill);
              return (
                <Link
                  key={q.skill}
                  href={`/dashboard/candidat/quiz/${encodeURIComponent(q.skill)}`}
                  className="group block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all hover:-translate-y-0.5"
                  style={done ? { borderColor: `${scoreColor(done.score)}40` } : {}}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                      style={{ background: done ? `linear-gradient(135deg, ${scoreColor(done.score)}, ${scoreColor(done.score)}99)` : "linear-gradient(135deg, #0a1628, #1e3a5f)" }}
                    >
                      {done ? `${done.score}%` : q.skill.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#0a1628] text-sm group-hover:text-[#00b8d9] transition-colors">
                          {q.skill}
                        </p>
                        {done && (
                          <HiCheckBadge
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: scoreColor(done.score) }}
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{q.title}</p>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                      style={{ backgroundColor: DIFF_COLORS[q.difficulty] || "#64748b" }}
                    >
                      {DIFF_LABELS[q.difficulty] || q.difficulty}
                    </span>
                  </div>

                  {q.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{q.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <HiClock className="w-3.5 h-3.5" />
                        {q.timeLimit} min
                      </span>
                      <span>· 10 questions</span>
                    </div>
                    <span
                      className="text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
                      style={{ color: done ? scoreColor(done.score) : "#00b8d9" }}
                    >
                      {done ? "Refaire" : "Commencer"}
                      <HiArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
