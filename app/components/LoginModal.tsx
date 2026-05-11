"use client";

import { useState } from "react";
import {
  HiXMark,
  HiEnvelope,
  HiLockClosed,
  HiExclamationTriangle,
  HiCheckCircle,
  HiArrowPath,
} from "react-icons/hi2";
import { useAuth } from "../lib/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  // Compatibility prop for pages/build caches that may pass register modal switch prop.
  onSwitchToLogin?: () => void;
}

// Google icon SVG component
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

export default function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
}: LoginModalProps) {
  const { login, googleLogin, linkedinLogin, resendVerification } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailNotVerified(false);
    setResendSuccess("");

    const result = await login(email, password);

    if (result.success) {
      onClose();
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        window.location.href =
          u.role === "RECRUTEUR"
            ? "/dashboard/recruteur"
            : "/dashboard/candidat";
      }
    } else {
      if (result.code === "EMAIL_NOT_VERIFIED") {
        setEmailNotVerified(true);
      }
      setError(result.message);
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (!email) {
      setError("Entrez votre email pour renvoyer le lien.");
      return;
    }
    const result = await resendVerification(email);
    if (result.success) {
      setResendSuccess(result.message);
      setError("");
    } else {
      setError(result.message);
    }
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
            setError("La connexion Google a échoué.");
            return;
          }
          setLoading(true);
          const result = await googleLogin(response.code);
          if (result.success) {
            onClose();
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
      sessionStorage.setItem("linkedin_oauth_role", "");

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(10,22,40,0.7)",
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "modalSlideIn 0.3s ease-out" }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-center relative"
          style={{
            background: "linear-gradient(135deg, #0a1628, #111d33)",
          }}
        >
          <button
            onClick={onClose}
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
          <h2 className="text-white font-bold text-lg">
            Connexion à Freelance
            <span style={{ color: "#00b8d9" }}>IT</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Accédez à votre espace personnel
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
              <div>
                <p>{error}</p>
                {emailNotVerified && (
                  <button
                    onClick={handleResend}
                    className="mt-2 text-xs font-semibold underline hover:no-underline cursor-pointer"
                    style={{ color: "#00b8d9" }}
                  >
                    Renvoyer le lien de vérification →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Resend success */}
          {resendSuccess && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
              style={{
                backgroundColor: "rgba(16,185,129,0.08)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <HiCheckCircle className="w-4 h-4 flex-shrink-0" />
              {resendSuccess}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                <HiEnvelope className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean@exemple.fr"
                  required
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
                <HiLockClosed className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
              </div>
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
                  Connexion...
                </>
              ) : (
                "Se connecter"
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

          {/* Switch to register */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Pas encore de compte ?{" "}
            <button
              onClick={() => {
                onClose();
                onSwitchToRegister();
              }}
              className="font-semibold hover:underline cursor-pointer"
              style={{ color: "#00b8d9" }}
            >
              S&apos;inscrire
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
