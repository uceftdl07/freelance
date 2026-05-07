"use client";

import Link from "next/link";
import { HiOutlineTag, HiArrowTopRightOnSquare } from "react-icons/hi2";

export default function RecruteurDealsPage() {
  const deals = [
    { id: "ats", title: "Reduction ATS", desc: "-20% sur un outil ATS partenaire.", href: "https://www.notion.so" },
    { id: "sourcing", title: "Pack Sourcing", desc: "Credits gratuits pour tester un moteur de sourcing.", href: "https://www.linkedin.com" },
    { id: "visio", title: "Visio Entretiens", desc: "6 mois offerts sur un outil de visio RH.", href: "https://meet.google.com" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-[#00b8d9]/10 flex items-center justify-center mx-auto mb-6">
          <HiOutlineTag className="w-8 h-8 text-[#00b8d9]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">FreelanceIT Deals</h1>
        <p className="text-sm text-gray-500">Offres partenaires actives pour les recruteurs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {deals.map((deal) => (
          <div key={deal.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">{deal.title}</h3>
            <p className="text-xs text-gray-500 mt-2 min-h-10">{deal.desc}</p>
            <Link href={deal.href} target="_blank" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#00b8d9] hover:underline">
              Activer l'offre <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
