"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import {
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineEye,
} from "react-icons/hi2";

type ApiJob = { id: string; status: "ACTIVE" | "CLOSED" | "DRAFT" };
type ApiApp = {
  id: string;
  status: string;
  createdAt: string;
  job: { id: string; title: string; company: string };
  candidate: {
    id: string;
    email: string;
    profileCandidat: {
      id: string;
      firstName: string;
      lastName: string;
      title: string | null;
    } | null;
  };
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Nouveau",
  REVIEW: "En revue",
  ACCEPTED: "Entretien",
  REJECTED: "Rejeté",
  WITHDRAWN: "Retiré",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-emerald-100 text-emerald-700",
  REVIEW: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-[#00b8d9]/10 text-[#00b8d9]",
  REJECTED: "bg-rose-100 text-rose-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

export default function RecruteurDashboardHome() {
  const [activeOffers, setActiveOffers] = useState(0);
  const [apps, setApps] = useState<ApiApp[]>([]);
  const [views, setViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [j, a, n] = await Promise.all([
        apiRequest<{ jobs: ApiJob[]; total: number }>("/jobs/mine"),
        apiRequest<{ applications: ApiApp[]; total: number }>("/applications/received"),
        apiRequest<{ notifications: Array<{ type: string }>; unreadCount: number }>("/notifications"),
      ]);
      if (j.success && j.data) {
        setActiveOffers(j.data.jobs.filter((x) => x.status === "ACTIVE").length);
      }
      if (a.success && a.data) setApps(a.data.applications);
      if (n.success && n.data) setViews(n.data.notifications.length);
      setLoading(false);
    })();
  }, []);

  const newApps = apps.filter((a) => a.status === "PENDING").length;
  const interviews = apps.filter((a) => a.status === "ACCEPTED" || a.status === "REVIEW").length;
  const recent = apps.slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="relative rounded-3xl p-8 overflow-hidden shadow-sm" style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2c4e 100%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00b8d9] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-[#00b8d9] opacity-10 rounded-full blur-2xl translate-y-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Bienvenue dans votre espace recrutement 🚀
          </h1>
          <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
            Suivez l&apos;activité de vos offres, découvrez de nouveaux talents et gérez vos processus de recrutement en un coup d&apos;œil.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<HiOutlineBriefcase className="w-6 h-6" />} bg="bg-indigo-50 text-indigo-500" value={activeOffers} label="Offres actives" loading={loading} />
        <StatCard icon={<HiOutlineUserGroup className="w-6 h-6" />} bg="bg-emerald-50 text-emerald-500" value={newApps} label="Nouvelles candidatures" loading={loading} />
        <StatCard icon={<HiOutlineCalendar className="w-6 h-6" />} bg="bg-[#00b8d9]/10 text-[#00b8d9]" value={interviews} label="Entretiens / en revue" loading={loading} />
        <StatCard icon={<HiOutlineEye className="w-6 h-6" />} bg="bg-blue-50 text-blue-500" value={views} label="Interactions" loading={loading} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Candidatures récentes</h2>
          <Link href="/dashboard/recruteur/offres" className="text-xs font-bold text-[#00b8d9] hover:underline">
            Voir toutes les offres →
          </Link>
        </div>

        {loading ? (
          <p className="text-center py-10 text-sm text-gray-400">Chargement…</p>
        ) : recent.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400 italic">
            Aucune candidature reçue. Publiez une offre pour commencer.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Candidat</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Poste ciblé</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent.map((a) => {
                  const p = a.candidate.profileCandidat;
                  const name = p ? `${p.firstName} ${p.lastName}`.trim() : a.candidate.email;
                  const initials = p ? (p.firstName[0] + p.lastName[0]).toUpperCase() : "?";
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-[#0a1628] to-indigo-900 shadow-sm">
                            {initials}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {a.job.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-extrabold rounded-full tracking-wide ${STATUS_COLOR[a.status] || "bg-gray-100 text-gray-500"}`}>
                          {STATUS_LABEL[a.status] || a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <Link href={`/dashboard/recruteur/offres/${a.job.id}/candidats`} className="text-gray-500 hover:underline text-xs">
                          Offre
                        </Link>
                        {p?.id && (
                          <Link href={`/dashboard/recruteur/recherche-talents/${p.id}`} className="text-[#00b8d9] hover:underline font-semibold">
                            Voir le profil
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon, bg, value, label, loading,
}: { icon: React.ReactNode; bg: string; value: number; label: string; loading: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-3xl font-black text-[#0a1628] mb-1">{loading ? "…" : value}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
}
