"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  HiCheckCircle,
  HiExclamationTriangle,
  HiArrowPath,
} from "react-icons/hi2";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de vérification manquant.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/auth/verify-email?token=${token}`
        );
        const json = await res.json();

        if (json.success) {
          setStatus("success");
          setMessage(json.message);
        } else {
          setStatus("error");
          setMessage(json.message);
        }
      } catch {
        setStatus("error");
        setMessage("Erreur de connexion au serveur.");
      }
    };

    verify();
  }, [token]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#f1f5f9" }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        {status === "loading" && (
          <>
            <HiArrowPath
              className="w-12 h-12 mx-auto mb-4 animate-spin"
              style={{ color: "#00b8d9" }}
            />
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Vérification en cours...
            </h1>
            <p className="text-sm text-gray-500">
              Nous vérifions votre adresse email.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
            >
              <HiCheckCircle
                className="w-8 h-8"
                style={{ color: "#10b981" }}
              />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Email vérifié ! 🎉
            </h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <Link
              href="/"
              className="inline-block px-8 py-3 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: "#00b8d9",
                boxShadow: "0 4px 14px rgba(0,184,217,0.3)",
              }}
            >
              Se connecter →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
            >
              <HiExclamationTriangle
                className="w-8 h-8"
                style={{ color: "#ef4444" }}
              />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Échec de la vérification
            </h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <Link
              href="/"
              className="inline-block px-8 py-3 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5"
              style={{
                backgroundColor: "#00b8d9",
                boxShadow: "0 4px 14px rgba(0,184,217,0.3)",
              }}
            >
              Retour à l&apos;accueil
            </Link>
          </>
        )}

        {/* Logo footer */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <span className="text-sm font-bold text-gray-400">
            Freelance<span style={{ color: "#00b8d9" }}>IT</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#f1f5f9" }}
        >
          <HiArrowPath
            className="w-8 h-8 animate-spin"
            style={{ color: "#00b8d9" }}
          />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
