"use client";

import { useState } from "react";
import {
  HiXMark,
  HiEnvelope,
  HiLockClosed,
  HiUser,
  HiBuildingOffice2,
  HiExclamationTriangle,
  HiCheckCircle,
  HiArrowPath,
} from "react-icons/hi2";
import { useAuth } from "../lib/AuthContext";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  // Compatibility prop for pages/build caches that may pass login modal switch prop.
  onSwitchToRegister?: () => void;
}

// Google icon SVG
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function RegisterModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: RegisterModalProps) {
  const { register, googleLogin } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "CANDIDAT",
    company: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setError("");
  };

  // Client-side validation
  const validate = (): string | null => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return "Prénom et nom sont requis.";
    }
    if (!form.email.trim()) {
      return "Email requis.";
    }
    if (form.password.length < 8) {
      return "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      return "Le mot de passe doit contenir une majuscule, une minuscule et un chiffre.";
    }
    if (form.password !== form.confirmPassword) {
      return "Les mots de passe ne correspondent pas.";
    }
    if (form.role === "RECRUTEUR" && !form.company.trim()) {
      return "Le nom de l'entreprise est requis pour les recruteurs.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    const result = await register({
      email: form.email,
      password: form.password,
      role: form.role,
      firstName: form.firstName,
      lastName: form.lastName,
      company: form.company || undefined,
    });

    if (result.success) {
      // Show success screen — user must verify email
      setSuccess(true);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleGoogleClick = () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError("Google OAuth n'est pas configuré. Utilisez l'inscription par email.");
        return;
      }

      // Use Google Identity Services — Authorization Code flow
      const google = (window as unknown as Record<string, unknown>).google as {
        accounts: {
          oauth2: {
            initCodeClient: (config: Record<string, unknown>) => { requestCode: () => void };
          };
        };
      } | undefined;

      if (!google?.accounts?.oauth2) {
        setError("Le SDK Google n'est pas chargé. Réessayez dans un instant.");
        return;
      }

      const client = google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: "email profile openid",
        ux_mode: "popup",
        callback: async (response: { code?: string; error?: string }) => {
          if (response.error || !response.code) {
            setError("L'inscription Google a échoué.");
            return;
          }
          setLoading(true);
          const result = await googleLogin(response.code, form.role || "CANDIDAT");
          if (result.success) {
            handleClose();
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              const u = JSON.parse(storedUser);
              window.location.href =
                u.role === "RECRUTEUR"
                  ? "/dashboard/recruteur"
                  : "/dashboard/candidat";
            }
          } else {
            setError(result.message);
          }
          setLoading(false);
        },
      });

      client.requestCode();
    } catch {
      setError("Erreur lors de l'initialisation de Google OAuth.");
    }
  };

  const handleLinkedInClick = () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
      const redirectUri =
        process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI ||
        `${window.location.origin}/linkedin/callback`;

      if (!clientId) {
        setError("LinkedIn OAuth n'est pas configure.");
        return;
      }

      const state = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem("linkedin_oauth_state", state);
      sessionStorage.setItem("linkedin_oauth_role", form.role || "CANDIDAT");

      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        scope: "openid profile email",
      });

      window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    } catch {
      setError("Erreur lors de l'initialisation de LinkedIn OAuth.");
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError("");
    setForm({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "CANDIDAT",
      company: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  // Success screen
  if (success) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{
          backgroundColor: "rgba(10,22,40,0.7)",
          backdropFilter: "blur(8px)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-center p-8"
          style={{ animation: "modalSlideIn 0.3s ease-out" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
          >
            <HiCheckCircle className="w-8 h-8" style={{ color: "#10b981" }} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Inscription réussie ! 🎉
          </h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Un email de vérification a été envoyé à{" "}
            <strong className="text-gray-700">{form.email}</strong>. Cliquez sur
            le lien dans l&apos;email pour activer votre compte.
          </p>
          <div
            className="px-4 py-3 rounded-xl text-sm text-left mb-6"
            style={{
              backgroundColor: "rgba(0,184,217,0.06)",
              border: "1px solid rgba(0,184,217,0.15)",
              color: "#0e7490",
            }}
          >
            <p className="font-semibold mb-1">💡 Conseil</p>
            <p className="text-xs leading-relaxed">
              Vérifiez aussi votre dossier de spam si vous ne trouvez pas
              l&apos;email.
            </p>
          </div>
          <button
            onClick={() => {
              handleClose();
              onSwitchToLogin();
            }}
            className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer"
            style={{
              backgroundColor: "#00b8d9",
              boxShadow: "0 4px 14px rgba(0,184,217,0.3)",
            }}
          >
            Se connecter →
          </button>
        </div>
        <style jsx>{`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Password strength indicator
  const passStrength = (() => {
    const p = form.password;
    if (!p) return { score: 0, label: "", color: "" };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^a-zA-Z\d]/.test(p)) score++;
    if (score <= 2) return { score, label: "Faible", color: "#ef4444" };
    if (score <= 3) return { score, label: "Moyen", color: "#f59e0b" };
    return { score, label: "Fort", color: "#10b981" };
  })();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(10,22,40,0.7)",
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ animation: "modalSlideIn 0.3s ease-out" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-6 py-5 text-center relative rounded-t-2xl"
          style={{
            background: "linear-gradient(135deg, #0a1628, #111d33)",
          }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <HiXMark className="w-5 h-5" />
          </button>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{
              background: "linear-gradient(135deg, #00b8d9, #00a3c4)",
              boxShadow: "0 4px 14px rgba(0,184,217,0.3)",
            }}
          >
            <span className="text-white font-black text-sm">FI</span>
          </div>
          <h2 className="text-white font-bold text-lg">Créer un compte</h2>
          <p className="text-gray-400 text-sm mt-1">
            Rejoignez la communauté FreelanceIT
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm mb-4"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <HiExclamationTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Role selector */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Je suis...
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: "CANDIDAT",
                  label: "Candidat",
                  desc: "Je cherche des missions",
                  emoji: "👨‍💻",
                },
                {
                  value: "RECRUTEUR",
                  label: "Recruteur",
                  desc: "Je cherche des talents",
                  emoji: "🏢",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("role", opt.value)}
                  className="p-3 rounded-xl border-2 text-left transition-all cursor-pointer"
                  style={{
                    borderColor:
                      form.role === opt.value
                        ? "#00b8d9"
                        : "rgba(226,232,240,1)",
                    backgroundColor:
                      form.role === opt.value
                        ? "rgba(0,184,217,0.04)"
                        : "transparent",
                  }}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <p
                    className="text-sm font-bold mt-1"
                    style={{
                      color: form.role === opt.value ? "#00b8d9" : "#374151",
                    }}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Prénom
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                  <HiUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    placeholder="Jean"
                    required
                    className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nom
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                  <HiUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    placeholder="Dupont"
                    required
                    className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Company (Recruteur only) */}
            {form.role === "RECRUTEUR" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Entreprise
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                  <HiBuildingOffice2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => update("company", e.target.value)}
                    placeholder="Nom de l'entreprise"
                    required
                    className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                <HiEnvelope className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="jean@exemple.fr"
                  required
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                <HiLockClosed className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
              </div>
              {/* Strength indicator */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{
                          backgroundColor:
                            i <= passStrength.score
                              ? passStrength.color
                              : "#e2e8f0",
                        }}
                      />
                    ))}
                  </div>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: passStrength.color }}
                  >
                    {passStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                <HiLockClosed className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
              </div>
              {form.confirmPassword &&
                form.password !== form.confirmPassword && (
                  <p className="text-[11px] text-red-500 mt-1">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              style={{
                backgroundColor: "#00b8d9",
                boxShadow: "0 4px 14px rgba(0,184,217,0.3)",
              }}
            >
              {loading ? (
                <>
                  <HiArrowPath className="w-4 h-4 animate-spin" />
                  Inscription...
                </>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full py-3 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-60"
            style={{ color: "#374151" }}
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          <button
            onClick={handleLinkedInClick}
            disabled={loading}
            className="w-full mt-3 py-3 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-60"
            style={{ color: "#374151" }}
          >
            <span className="font-bold text-[#0A66C2]">in</span>
            Continuer avec LinkedIn
          </button>

          {/* Switch to login */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Déjà un compte ?{" "}
            <button
              onClick={() => {
                handleClose();
                onSwitchToLogin();
              }}
              className="font-semibold hover:underline cursor-pointer"
              style={{ color: "#00b8d9" }}
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
