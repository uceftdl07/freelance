"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiXMark, HiPaperAirplane, HiCheckCircle, HiEnvelope } from "react-icons/hi2";
import { apiRequest } from "../../lib/api";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
}

export default function ContactModal({
  isOpen,
  onClose,
  candidateId,
  candidateName,
}: ContactModalProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!content.trim()) {
      setError("Veuillez écrire un message.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await apiRequest("/messaging/messages", {
        method: "POST",
        body: JSON.stringify({ receiverId: candidateId, content: content.trim() }),
      });
      if (res.success) {
        setSent(true);
        setTimeout(() => {
          onClose();
          setSent(false);
          setContent("");
          router.push("/dashboard/recruteur/messagerie");
        }, 1500);
      } else {
        setError(res.message || "Erreur lors de l'envoi.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #0a1628, #111d33)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,184,217,0.2)" }}
            >
              <HiEnvelope className="w-5 h-5" style={{ color: "#00b8d9" }} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Contacter</h3>
              <p className="text-gray-400 text-xs">{candidateName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="p-10 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
            >
              <HiCheckCircle className="w-8 h-8" style={{ color: "#10b981" }} />
            </div>
            <h4 className="text-lg font-bold text-gray-800">Message envoyé !</h4>
            <p className="text-sm text-gray-500 mt-1">
              {candidateName} recevra une notification. Redirection vers la messagerie…
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Message
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Bonjour ${candidateName.split(" ")[0]},\n\nNous avons une mission qui correspond à votre profil…`}
                rows={5}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 resize-none outline-none focus:border-[#00b8d9] focus:bg-white transition-all"
              />
            </div>

            {error && (
              <div className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
                style={{
                  backgroundColor: "#00b8d9",
                  boxShadow: "0 4px 14px rgba(0,184,217,0.3)",
                }}
              >
                <HiPaperAirplane className="w-4 h-4" />
                {sending ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-in {
          animation: modalIn 0.3s ease-out;
        }
        @keyframes modalIn {
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
