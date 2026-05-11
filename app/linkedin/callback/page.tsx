"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

export default function LinkedInCallbackPage() {
  const searchParams = useSearchParams();
  const { linkedinLogin } = useAuth();
  const [status, setStatus] = useState("Connexion LinkedIn en cours...");

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("Connexion LinkedIn annulee ou refusee.");
        return;
      }

      if (!code || !state) {
        setStatus("Parametres OAuth LinkedIn invalides.");
        return;
      }

      const expectedState = sessionStorage.getItem("linkedin_oauth_state");
      const role = sessionStorage.getItem("linkedin_oauth_role") || undefined;

      sessionStorage.removeItem("linkedin_oauth_state");
      sessionStorage.removeItem("linkedin_oauth_role");

      if (!expectedState || expectedState !== state) {
        setStatus("Etat OAuth invalide. Reessayez la connexion LinkedIn.");
        return;
      }

      const result = await linkedinLogin(code, role);
      if (!result.success) {
        setStatus(result.message || "Echec de la connexion LinkedIn.");
        return;
      }

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser) as { role?: string };
        window.location.href = user.role === "RECRUTEUR" ? "/dashboard/recruteur" : "/dashboard/candidat";
        return;
      }

      window.location.href = "/";
    };

    void run();
  }, [linkedinLogin, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-700">{status}</p>
      </div>
    </main>
  );
}

