"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../lib/AuthContext";
import {
  HiArrowLeft,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiArrowRight,
  HiTrophy,
  HiArrowPath,
  HiLightBulb,
} from "react-icons/hi2";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface QuizData {
  id: string;
  skill: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  questions: Question[];
  totalQuestions: number;
}

interface ResultQuestion extends Question {
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
}

interface QuizResult {
  score: number;
  totalQ: number;
  correctQ: number;
  results: ResultQuestion[];
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

function scoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 90) return "Excellent !";
  if (score >= 75) return "Très bien";
  if (score >= 60) return "Bien";
  if (score >= 40) return "À améliorer";
  return "À retravailler";
}

export default function QuizPage() {
  const { skill } = useParams<{ skill: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Quiz state
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/quizzes/${encodeURIComponent(skill)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setQuiz(json.data);
        else setError("Quiz non trouvé.");
      })
      .catch(() => setError("Erreur de chargement."))
      .finally(() => setLoading(false));
  }, [skill]);

  // Timer
  useEffect(() => {
    if (phase !== "quiz" || !quiz) return;
    setTimeLeft(quiz.timeLimit * 60);
  }, [phase, quiz]);

  useEffect(() => {
    if (phase !== "quiz" || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(t); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft > 0]);

  const handleSubmit = useCallback(async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/quizzes/${encodeURIComponent(skill)}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        setPhase("result");
      } else {
        setError(json.message || "Erreur lors de la soumission.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }, [quiz, skill, token, answers, submitting]);

  const selectOption = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setAnswers((prev) => ({ ...prev, [quiz!.questions[currentQ].id]: idx }));
  };

  const goNext = () => {
    if (!quiz) return;
    setSelected(null);
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      handleSubmit();
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <HiArrowPath className="w-6 h-6 animate-spin text-[#00b8d9]" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/dashboard/candidat/profil" className="text-[#00b8d9] text-sm hover:underline">
          ← Retour au profil
        </Link>
      </div>
    </div>
  );

  if (!quiz) return null;

  // ── INTRO ──
  if (phase === "intro") return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Link
          href="/dashboard/candidat/profil"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <HiArrowLeft className="w-4 h-4" /> Retour au profil
        </Link>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg"
              style={{ background: "linear-gradient(135deg, #0a1628, #00b8d9)" }}
            >
              {quiz.skill.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0a1628]">{quiz.title}</h1>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: DIFF_COLORS[quiz.difficulty] || "#64748b" }}
              >
                {DIFF_LABELS[quiz.difficulty] || quiz.difficulty}
              </span>
            </div>
          </div>

          {quiz.description && (
            <p className="text-sm text-gray-600 mb-6">{quiz.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#0a1628]">{quiz.totalQuestions}</p>
              <p className="text-xs text-gray-500 mt-1">Questions</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#0a1628]">{quiz.timeLimit} min</p>
              <p className="text-xs text-gray-500 mt-1">Durée limite</p>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-gray-600 mb-8">
            <li className="flex items-center gap-2"><HiCheckCircle className="w-4 h-4 text-[#00b8d9]" /> Une seule réponse correcte par question</li>
            <li className="flex items-center gap-2"><HiCheckCircle className="w-4 h-4 text-[#00b8d9]" /> Explication affichée après chaque réponse</li>
            <li className="flex items-center gap-2"><HiCheckCircle className="w-4 h-4 text-[#00b8d9]" /> Le meilleur score est conservé sur votre profil</li>
            <li className="flex items-center gap-2"><HiCheckCircle className="w-4 h-4 text-[#00b8d9]" /> Score visible par les recruteurs</li>
          </ul>

          {!token && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4 border border-amber-100">
              Vous devez être connecté pour que votre score soit enregistré.
            </p>
          )}

          <button
            onClick={() => setPhase("quiz")}
            className="w-full py-3.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 14px rgba(0,184,217,0.3)" }}
          >
            Commencer le quiz →
          </button>
        </div>
      </div>
    </div>
  );

  // ── QUIZ ──
  if (phase === "quiz") {
    const q = quiz.questions[currentQ];
    const progress = ((currentQ) / quiz.questions.length) * 100;
    const isLast = currentQ === quiz.questions.length - 1;
    const urgent = timeLeft <= 60;

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500">
              Question {currentQ + 1} / {quiz.questions.length}
            </span>
            <div
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: urgent ? "rgba(239,68,68,0.1)" : "rgba(0,184,217,0.1)",
                color: urgent ? "#ef4444" : "#00b8d9",
              }}
            >
              <HiClock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: "#00b8d9" }}
            />
          </div>

          {/* Question card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <p className="text-lg font-bold text-[#0a1628] mb-6 leading-snug">{q.text}</p>

            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                let style: React.CSSProperties = {
                  borderColor: "#e2e8f0",
                  backgroundColor: "#fff",
                  color: "#374151",
                };
                if (selected !== null) {
                  if (idx === answers[q.id]) {
                    style = {
                      borderColor: "#00b8d9",
                      backgroundColor: "rgba(0,184,217,0.08)",
                      color: "#0a1628",
                    };
                  }
                } else if (selected === idx) {
                  style = { borderColor: "#00b8d9", backgroundColor: "rgba(0,184,217,0.08)", color: "#0a1628" };
                }

                return (
                  <button
                    key={idx}
                    onClick={() => selectOption(idx)}
                    disabled={selected !== null}
                    className="w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer disabled:cursor-default"
                    style={style}
                    onMouseEnter={(e) => {
                      if (selected !== null) return;
                      e.currentTarget.style.borderColor = "#00b8d9";
                      e.currentTarget.style.backgroundColor = "rgba(0,184,217,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (selected !== null) return;
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.backgroundColor = "#fff";
                    }}
                  >
                    <span className="font-bold mr-3 text-gray-400">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <div className="mt-5 flex justify-end">
                <button
                  onClick={goNext}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ backgroundColor: "#0a1628" }}
                >
                  {isLast ? (submitting ? "Envoi…" : "Terminer") : "Question suivante"}
                  <HiArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT ──
  if (phase === "result" && result) {
    const color = scoreColor(result.score);
    return (
      <div className="min-h-screen bg-[#f8fafc] py-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Score card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-8">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-white"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 8px 24px ${color}40` }}
            >
              <span className="text-2xl font-black">{result.score}%</span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0a1628] mb-1">
              {scoreLabel(result.score)}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {result.correctQ} bonne{result.correctQ > 1 ? "s" : ""} réponse{result.correctQ > 1 ? "s" : ""} sur {result.totalQ}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg inline-flex">
              <HiTrophy className="w-4 h-4" />
              Score enregistré sur votre profil
            </div>
          </div>

          {/* Detailed results */}
          <h3 className="text-base font-bold text-[#0a1628] mb-4 flex items-center gap-2">
            <HiLightBulb className="w-5 h-5 text-[#00b8d9]" />
            Corrigé détaillé
          </h3>
          <div className="space-y-4">
            {result.results.map((r, i) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border p-5"
                style={{ borderColor: r.isCorrect ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)" }}
              >
                <div className="flex items-start gap-3 mb-3">
                  {r.isCorrect
                    ? <HiCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <HiXCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  }
                  <p className="text-sm font-semibold text-[#0a1628]">
                    {i + 1}. {r.text}
                  </p>
                </div>

                <div className="space-y-1.5 ml-8">
                  {r.options.map((opt, idx) => {
                    const isCorrect = idx === r.correctIndex;
                    const isSelected = idx === r.selectedIndex;
                    let optStyle: React.CSSProperties = { color: "#64748b" };
                    if (isCorrect) optStyle = { color: "#10b981", fontWeight: 600 };
                    else if (isSelected && !isCorrect) optStyle = { color: "#ef4444", textDecoration: "line-through" };

                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm" style={optStyle}>
                        <span className="font-bold">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                        {isCorrect && <HiCheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-1" />}
                      </div>
                    );
                  })}
                </div>

                <div
                  className="mt-3 ml-8 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border-l-2"
                  style={{ borderColor: "#00b8d9" }}
                >
                  <span className="font-semibold text-[#00b8d9]">Explication : </span>
                  {r.explanation}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={() => { setPhase("intro"); setCurrentQ(0); setAnswers({}); setSelected(null); setResult(null); }}
              className="flex-1 py-3 text-sm font-bold rounded-xl border-2 transition-all hover:-translate-y-0.5"
              style={{ borderColor: "#0a1628", color: "#0a1628" }}
            >
              Recommencer
            </button>
            <Link
              href="/dashboard/candidat/profil"
              className="flex-1 py-3 text-sm font-bold text-white rounded-xl text-center transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "#00b8d9", boxShadow: "0 4px 14px rgba(0,184,217,0.3)" }}
            >
              Voir mon profil →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
