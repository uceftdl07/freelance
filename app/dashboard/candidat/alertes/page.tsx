"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import {
  HiOutlineBriefcase,
  HiOutlineEnvelope,
  HiOutlineUserCircle,
  HiOutlineBell,
} from "react-icons/hi2";

type Notif = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
}

function iconFor(type: string) {
  if (type === "MESSAGE_RECEIVED") return { Icon: HiOutlineEnvelope, bg: "bg-indigo-50", color: "text-indigo-500" };
  if (type === "JOB_MATCH") return { Icon: HiOutlineBriefcase, bg: "bg-[#00b8d9]/10", color: "text-[#00b8d9]" };
  if (type === "PROFILE_SAVED") return { Icon: HiOutlineUserCircle, bg: "bg-amber-50", color: "text-amber-500" };
  return { Icon: HiOutlineBell, bg: "bg-gray-100", color: "text-gray-500" };
}

export default function CandidatAlertesPage() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = useCallback(async () => {
    const r = await apiRequest<{ notifications: Notif[]; unreadCount: number }>("/notifications");
    if (r.success && r.data) setNotifications(r.data.notifications);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchNotifs();
  }, [fetchNotifs]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await apiRequest("/notifications/read", { method: "PUT" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centre de Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Chargement…"
              : unreadCount > 0
                ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : "Toutes vos notifications sont lues ✓"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 text-xs font-bold text-[#00b8d9] bg-[#00b8d9]/10 hover:bg-[#00b8d9] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center py-12 text-sm text-gray-400">Chargement…</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <HiOutlineBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">Aucune notification pour le moment.</p>
          <p className="text-xs text-gray-400 mt-1">Les nouveaux messages et matchs apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const { Icon, bg, color } = iconFor(notif.type);
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all group ${
                  notif.read
                    ? "bg-white border-gray-100 hover:shadow-sm"
                    : "bg-blue-50/60 border-blue-100 hover:bg-blue-50 shadow-sm"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={`text-sm leading-tight ${notif.read ? "font-medium text-gray-700" : "font-bold text-gray-900"}`}>
                      {notif.title}
                    </h3>
                    {!notif.read && <span className="w-2.5 h-2.5 rounded-full bg-[#00b8d9] flex-shrink-0 mt-1" />}
                  </div>
                  {notif.message && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>}
                  <p className="text-[11px] text-gray-400 mt-2 font-medium">{timeAgo(notif.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
