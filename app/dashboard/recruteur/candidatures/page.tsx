"use client";

import Link from "next/link";
import { HiOutlineBriefcase, HiOutlineUserGroup, HiOutlineMagnifyingGlass } from "react-icons/hi2";

export default function RecruteurCandidaturesPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[#00b8d9]/10 flex items-center justify-center mx-auto mb-6">
          <HiOutlineBriefcase className="w-8 h-8 text-[#00b8d9]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Candidatures</h1>
        <p className="text-gray-500 mb-2">Utilisez les actions ci-dessous pour gerer vos candidatures.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/dashboard/recruteur/offres" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#00b8d9] transition-colors">
          <HiOutlineBriefcase className="w-5 h-5 text-[#00b8d9] mb-2" />
          <p className="text-sm font-bold text-gray-800">Mes offres</p>
          <p className="text-xs text-gray-500 mt-1">Voir chaque offre et ses candidats</p>
        </Link>
        <Link href="/dashboard/recruteur/recherche-talents" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#00b8d9] transition-colors">
          <HiOutlineMagnifyingGlass className="w-5 h-5 text-[#00b8d9] mb-2" />
          <p className="text-sm font-bold text-gray-800">Rechercher des profils</p>
          <p className="text-xs text-gray-500 mt-1">Trouver et contacter des candidats</p>
        </Link>
        <Link href="/dashboard/recruteur/sauvegardes" className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#00b8d9] transition-colors">
          <HiOutlineUserGroup className="w-5 h-5 text-[#00b8d9] mb-2" />
          <p className="text-sm font-bold text-gray-800">Sauvegardes</p>
          <p className="text-xs text-gray-500 mt-1">Retrouver les candidats sauvegardes</p>
        </Link>
      </div>
    </div>
  );
}
