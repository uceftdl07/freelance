"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import React from "react";
import {
  HiUsers, HiBriefcase, HiDocumentText, HiStar,
  HiChatBubbleLeftEllipsis, HiExclamationCircle,
  HiCheckCircle, HiClock,
} from "react-icons/hi2";

interface Stats {
  totals: { users: number; jobs: number; applications: number; posts: number; reviews: number };
  breakdown: { candidats: number; recruteurs: number; pendingPosts: number; activeJobs: number };
  recentUsers: { id: string; email: string; role: string; createdAt: string; isVerified: boolean }[];
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
          {/* @ts-expect-error react-icons accepts style */}
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await apiRequest<Stats>("/admin/stats");
      if (r.success && r.data) setStats(r.data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Chargement…</div>;
  if (!stats) return <div className="text-sm text-red-500">Erreur de chargement des stats.</div>;

  const { totals, breakdown, recentUsers } = stats;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Tableau de bord Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble de la plateforme FreelanceIT.ma</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Utilisateurs" value={totals.users} icon={HiUsers} color="#00b8d9" />
        <StatCard label="Offres" value={totals.jobs} icon={HiBriefcase} color="#6366f1" />
        <StatCard label="Candidatures" value={totals.applications} icon={HiDocumentText} color="#10b981" />
        <StatCard label="Posts communauté" value={totals.posts} icon={HiChatBubbleLeftEllipsis} color="#f59e0b" />
        <StatCard label="Avis" value={totals.reviews} icon={HiStar} color="#ec4899" />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Candidats", value: breakdown.candidats, color: "#00b8d9" },
          { label: "Recruteurs", value: breakdown.recruteurs, color: "#6366f1" },
          { label: "Offres actives", value: breakdown.activeJobs, color: "#10b981" },
          { label: "Posts en attente", value: breakdown.pendingPosts, color: "#f59e0b", alert: breakdown.pendingPosts > 0 },
        ].map((item) => (
          <div key={item.label} className={`bg-white rounded-2xl p-4 shadow-sm border ${item.alert ? "border-amber-200" : "border-gray-100"}`}>
            <div className="flex items-center gap-2 mb-1">
              {item.alert && <HiExclamationCircle className="w-4 h-4 text-amber-500" />}
              <p className="text-xs font-bold text-gray-400">{item.label}</p>
            </div>
            <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Derniers inscrits</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentUsers.map((u) => (
            <div key={u.id} className="px-6 py-3.5 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0a1628] to-indigo-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {u.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{u.email}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.role === "ADMIN" ? "bg-red-100 text-red-600" : u.role === "RECRUTEUR" ? "bg-violet-100 text-violet-600" : "bg-cyan-100 text-cyan-600"}`}>
                {u.role}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                {u.isVerified ? <HiCheckCircle className="w-4 h-4 text-emerald-500" /> : <HiClock className="w-4 h-4 text-gray-300" />}
                {new Date(u.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
