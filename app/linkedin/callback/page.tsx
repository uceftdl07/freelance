"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { HiArrowPath } from "react-icons/hi2";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function LinkedInCallbackContent() {
  const searchParams = useSearchParams();
  const { linkedinLogin, token } = useAuth();
  const [status, setStatus] = useState("Connexion LinkedIn en cours…");

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("Connexion LinkedIn annulée ou refusée.");
        return;
      }

      if (!code || !state) {
        setStatus("Paramètres OAuth LinkedIn invalides.");
        return;
      }

      const expectedState = sessionStorage.getItem("linkedin_oauth_state");
      const role = sessionStorage.getItem("linkedin_oauth_role") || undefined;
      const mode = sessionStorage.getItem("linkedin_oauth_mode") || "login";
      const redirectUri = sessionStorage.getItem("linkedin_oauth_redirect_uri") || undefined;

      sessionStorage.removeItem("linkedin_oauth_state");
      sessionStorage.removeItem("linkedin_oauth_role");
      sessionStorage.removeItem("linkedin_oauth_mode");
      sessionStorage.removeItem("linkedin_oauth_redirect_uri");

      if (!expectedState || expectedState !== state) {
        setStatus("État OAuth invalide. Réessayez.");
        return;
      }

      // ── Import mode ──────────────────────────────────────────────────────
      if (mode === "import") {
        setStatus("Import du profil LinkedIn en cours…");
        try {
          const res = await fetch(`${API_BASE}/profiles/linkedin-import`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ code, redirectUri }),
          });
          const json = await res.json();

          if (json.success && json.data) {
            sessionStorage.setItem("linkedin_import_data", JSON.stringify(json.data));
            setStatus("Profil importé ! Redirection…");
            window.location.href = "/dashboard/candidat/profil?from=linkedin";
          } else {
            setStatus(json.message || "Échec de l'import LinkedIn.");
          }
        } catch {
          setStatus("Erreur réseau lors de l'import LinkedIn.");
        }
        return;
      }

      // ── Login/Register mode ───────────────────────────────────────────────
      const result = await linkedinLogin(code, role);
      if (!result.success) {
        setStatus(result.message || "Échec de la connexion LinkedIn.");
        return;
      }

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser) as { role?: string };
        window.location.href =
          user.role === "RECRUTEUR" ? "/dashboard/recruteur" : "/dashboard/candidat";
        return;
      }

      window.location.href = "/";
    };

    void run();
  }, [linkedinLogin, token, searchParams]);

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#f8fafc" }}
    >
      <div className="max-w-sm w-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #0A66C2, #0077b5)" }}
        >
          <span className="text-white font-black text-lg">in</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <HiArrowPath className="w-4 h-4 animate-spin text-[#0A66C2]" />
          {status}
        </div>
      </div>
    </main>
  );
}

export default function LinkedInCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-sm w-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
            <HiArrowPath className="w-6 h-6 animate-spin text-[#0A66C2] mx-auto" />
          </div>
        </main>
      }
    >
      <LinkedInCallbackContent />
    </Suspense>
  );
}
