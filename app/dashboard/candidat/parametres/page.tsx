"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { useTheme } from "../../../lib/ThemeContext";
import {
  HiCog6Tooth,
  HiBell,
  HiEye,
  HiShieldCheck,
  HiPaintBrush,
  HiChevronDown,
  HiCheckCircle,
  HiLockClosed,
  HiArrowPath,
} from "react-icons/hi2";

/* ─── Types ─────────────────────────────────── */

interface Settings {
  notifications: {
    newMissions: boolean;
    recruiterMessages: boolean;
  };
  visibility: "PUBLIC" | "PRIVATE" | "RECRUITERS_ONLY";
  appearance: {
    language: string;
    darkMode: boolean;
  };
}

/* ─── Toggle Switch ─────────────────────────── */

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full group cursor-pointer"
    >
      <span className="text-sm text-gray-700 font-medium">{label}</span>
      <div
        className="relative w-11 h-6 rounded-full transition-colors duration-300"
        style={{
          backgroundColor: checked ? "#00b8d9" : "#d1d5db",
        }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300"
          style={{
            transform: checked ? "translateX(22px)" : "translateX(2px)",
          }}
        />
      </div>
    </button>
  );
}

/* ─── Radio Button ──────────────────────────── */

function RadioOption({
  value,
  selected,
  onChange,
  label,
  description,
  emoji,
}: {
  value: string;
  selected: boolean;
  onChange: (v: string) => void;
  label: string;
  description: string;
  emoji: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className="w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer"
      style={{
        borderColor: selected ? "#00b8d9" : "#e2e8f0",
        backgroundColor: selected ? "rgba(0,184,217,0.03)" : "transparent",
      }}
    >
      {/* Custom radio dot */}
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
        style={{
          borderColor: selected ? "#00b8d9" : "#d1d5db",
        }}
      >
        {selected && (
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: "#00b8d9" }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{emoji}</span>
          <span
            className="text-sm font-bold"
            style={{ color: selected ? "#00b8d9" : "#374151" }}
          >
            {label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}

/* ─── Accordion Section ─────────────────────── */

function AccordionSection({
  icon: Icon,
  title,
  description,
  isOpen,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left cursor-pointer group"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            backgroundColor: isOpen
              ? "rgba(0,184,217,0.15)"
              : "rgba(0,184,217,0.08)",
          }}
        >
          <Icon className="w-5 h-5" style={{ color: "#00b8d9" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-bold transition-colors"
            style={{ color: isOpen ? "#00b8d9" : "#1f2937" }}
          >
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <HiChevronDown
          className="w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            color: isOpen ? "#00b8d9" : undefined,
          }}
        />
      </button>

      {/* Collapsible content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? "600px" : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="px-5 pb-5 pt-1 border-t border-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────── */

export default function ParametresPage() {
  const { isDark, setDark } = useTheme();

  // Accordion state
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      newMissions: true,
      recruiterMessages: true,
    },
    visibility: "PUBLIC",
    appearance: {
      language: "fr",
      darkMode: false,
    },
  });

  // Password state
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [appearanceLoading, setAppearanceLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; kind: "success" | "warning" } | null>(null);

  const showToast = (message: string) => {
    setToast({ message, kind: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  const showWarningToast = (message: string) => {
    setToast({ message, kind: "warning" });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  // ─── Handlers ───────────────────────────────

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await apiRequest<{ settings: Settings | null }>("/profile/settings");
        if (res.success && res.data?.settings) {
          setSettings(res.data.settings);
          return;
        }
      } catch {
        // Fall through to local fallback.
      }

      try {
        const raw = localStorage.getItem("freelanceit_candidate_settings");
        if (!raw) return;

        const parsed = JSON.parse(raw) as Settings;
        if (parsed?.notifications && parsed?.visibility && parsed?.appearance) {
          setSettings(parsed);
        }
      } catch {
        // Ignore corrupted local settings.
      }
    };

    void loadSettings();
  }, []);

  // Sync local darkMode state with ThemeContext
  useEffect(() => {
    setSettings((s) => ({
      ...s,
      appearance: { ...s.appearance, darkMode: isDark },
    }));
  }, [isDark]);

  const persistSettings = (next: Settings) => {
    try {
      localStorage.setItem("freelanceit_candidate_settings", JSON.stringify(next));
    } catch {
      // Ignore storage errors in restricted environments.
    }
  };

  const syncSettingsToServer = async (next: Settings): Promise<boolean> => {
    try {
      const res = await apiRequest("/profile/settings", {
        method: "PUT",
        body: JSON.stringify(next),
      });
      return Boolean(res.success);
    } catch {
      return false;
    }
  };

  const handleSaveNotifications = async () => {
    setNotifLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    persistSettings(settings);
    const synced = await syncSettingsToServer(settings);
    setNotifLoading(false);
    if (synced) {
      showToast("Préférences de notifications enregistrées !");
    } else {
      showWarningToast("Préférences enregistrées localement (sync serveur indisponible).");
    }
  };

  const handleSaveVisibility = async () => {
    setVisibilityLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    persistSettings(settings);
    const synced = await syncSettingsToServer(settings);
    setVisibilityLoading(false);
    if (synced) {
      showToast("Visibilité du profil mise à jour !");
    } else {
      showWarningToast("Visibilité enregistrée localement (sync serveur indisponible).");
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");

    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordError("Tous les champs sont requis.");
      return;
    }
    if (passwords.new.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwords.new)) {
      setPasswordError("Le mot de passe doit contenir une majuscule, une minuscule et un chiffre.");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setPasswordLoading(true);
    const res = await apiRequest("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      }),
    });
    setPasswordLoading(false);

    if (res.success) {
      setPasswords({ current: "", new: "", confirm: "" });
      showToast("Mot de passe modifié avec succès !");
      return;
    }

    setPasswordError(res.message || "Impossible de modifier le mot de passe.");
  };

  const handleSaveAppearance = async () => {
    setAppearanceLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    persistSettings(settings);
    const synced = await syncSettingsToServer(settings);
    setAppearanceLoading(false);
    if (synced) {
      showToast("Préférences d'apparence enregistrées !");
    } else {
      showWarningToast("Préférences d'apparence enregistrées localement (sync serveur indisponible).");
    }
  };

  // Password strength
  const passStrength = (() => {
    const p = passwords.new;
    if (!p) return { score: 0, label: "", color: "" };
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^a-zA-Z\d]/.test(p)) s++;
    if (s <= 2) return { score: s, label: "Faible", color: "#ef4444" };
    if (s <= 3) return { score: s, label: "Moyen", color: "#f59e0b" };
    return { score: s, label: "Fort", color: "#10b981" };
  })();

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <HiCog6Tooth className="w-6 h-6" style={{ color: "#00b8d9" }} />
          Paramètres
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gérez vos préférences et la sécurité de votre compte.
        </p>
      </div>

      {/* ─── 1. Notifications ──────────────────── */}
      <AccordionSection
        icon={HiBell}
        title="Notifications"
        description="Alertes de missions et messages des recruteurs"
        isOpen={openSection === "notifications"}
        onToggle={() => toggleSection("notifications")}
      >
        <div className="space-y-5 pt-3">
          <Toggle
            label="Alertes de nouvelles missions"
            checked={settings.notifications.newMissions}
            onChange={(v) =>
              setSettings((s) => ({
                ...s,
                notifications: { ...s.notifications, newMissions: v },
              }))
            }
          />
          <Toggle
            label="Messages des recruteurs"
            checked={settings.notifications.recruiterMessages}
            onChange={(v) =>
              setSettings((s) => ({
                ...s,
                notifications: { ...s.notifications, recruiterMessages: v },
              }))
            }
          />

          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={handleSaveNotifications}
              disabled={notifLoading}
              className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-60"
              style={{
                backgroundColor: "#00b8d9",
                boxShadow: "0 4px 14px rgba(0,184,217,0.25)",
              }}
            >
              {notifLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* ─── 2. Visibilité ─────────────────────── */}
      <AccordionSection
        icon={HiEye}
        title="Visibilité du profil"
        description="Contrôlez qui peut voir votre profil"
        isOpen={openSection === "visibility"}
        onToggle={() => toggleSection("visibility")}
      >
        <div className="space-y-3 pt-3">
          <RadioOption
            value="PUBLIC"
            selected={settings.visibility === "PUBLIC"}
            onChange={(v) =>
              setSettings((s) => ({
                ...s,
                visibility: v as Settings["visibility"],
              }))
            }
            label="Public"
            description="Votre profil est visible par tout le monde sur la plateforme."
            emoji="🌍"
          />
          <RadioOption
            value="RECRUITERS_ONLY"
            selected={settings.visibility === "RECRUITERS_ONLY"}
            onChange={(v) =>
              setSettings((s) => ({
                ...s,
                visibility: v as Settings["visibility"],
              }))
            }
            label="Visible uniquement par les recruteurs"
            description="Seuls les recruteurs vérifiés peuvent consulter votre profil."
            emoji="🔒"
          />
          <RadioOption
            value="PRIVATE"
            selected={settings.visibility === "PRIVATE"}
            onChange={(v) =>
              setSettings((s) => ({
                ...s,
                visibility: v as Settings["visibility"],
              }))
            }
            label="Privé"
            description="Votre profil est masqué. Personne ne peut le voir."
            emoji="🚫"
          />

          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={handleSaveVisibility}
              disabled={visibilityLoading}
              className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-60"
              style={{
                backgroundColor: "#00b8d9",
                boxShadow: "0 4px 14px rgba(0,184,217,0.25)",
              }}
            >
              {visibilityLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* ─── 3. Sécurité ───────────────────────── */}
      <AccordionSection
        icon={HiShieldCheck}
        title="Sécurité"
        description="Mot de passe et authentification"
        isOpen={openSection === "security"}
        onToggle={() => toggleSection("security")}
      >
        <div className="space-y-4 pt-3">
          <h4 className="text-sm font-bold text-gray-700">
            Changer le mot de passe
          </h4>

          {/* Current password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Mot de passe actuel
            </label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
              <HiLockClosed className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="password"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current: e.target.value }))
                }
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Nouveau mot de passe
            </label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
              <HiLockClosed className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, new: e.target.value }))
                }
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>
            {/* Strength indicator */}
            {passwords.new && (
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

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Confirmer le nouveau mot de passe
            </label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#00b8d9] focus-within:bg-white transition-all">
              <HiLockClosed className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, confirm: e.target.value }))
                }
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>
            {passwords.confirm && passwords.new !== passwords.confirm && (
              <p className="text-[11px] text-red-500 mt-1">
                Les mots de passe ne correspondent pas
              </p>
            )}
          </div>

          {/* Error */}
          {passwordError && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {passwordError}
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 flex items-center gap-2"
              style={{
                backgroundColor: "#00b8d9",
                boxShadow: "0 4px 14px rgba(0,184,217,0.25)",
              }}
            >
              {passwordLoading ? (
                <>
                  <HiArrowPath className="w-4 h-4 animate-spin" />
                  Modification...
                </>
              ) : (
                "Modifier le mot de passe"
              )}
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* ─── 4. Apparence ──────────────────────── */}
      <AccordionSection
        icon={HiPaintBrush}
        title="Apparence"
        description="Thème et langue de l'interface"
        isOpen={openSection === "appearance"}
        onToggle={() => toggleSection("appearance")}
      >
        <div className="space-y-5 pt-3">
          {/* Language */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Langue de l&apos;interface
            </label>
            <div className="relative">
              <select
                value={settings.appearance.language}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    appearance: { ...s.appearance, language: e.target.value },
                  }))
                }
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-[#00b8d9] focus:bg-white transition-all cursor-pointer appearance-none"
              >
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇬🇧 English</option>
              </select>
              <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Dark mode toggle */}
          <Toggle
            label="Mode sombre"
            checked={isDark}
            onChange={(v) => {
              setDark(v);
              setSettings((s) => ({
                ...s,
                appearance: { ...s.appearance, darkMode: v },
              }));
            }}
          />

          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={handleSaveAppearance}
              disabled={appearanceLoading}
              className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-60"
              style={{
                backgroundColor: "#00b8d9",
                boxShadow: "0 4px 14px rgba(0,184,217,0.25)",
              }}
            >
              {appearanceLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* ─── Toast notification ────────────────── */}
      <div
        className="fixed bottom-6 right-6 z-50 transition-all duration-500"
        style={{
          transform: toast ? "translateY(0)" : "translateY(100px)",
          opacity: toast ? 1 : 0,
          pointerEvents: toast ? "auto" : "none",
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold text-white"
          style={{
            background:
              toast?.kind === "warning"
                ? "linear-gradient(135deg, #b45309, #92400e)"
                : "linear-gradient(135deg, #10b981, #059669)",
            boxShadow:
              toast?.kind === "warning"
                ? "0 10px 40px rgba(180,83,9,0.3)"
                : "0 10px 40px rgba(16,185,129,0.3)",
          }}
        >
          <HiCheckCircle className="w-5 h-5 flex-shrink-0" />
          {toast?.message}
        </div>
      </div>
    </div>
  );
}
