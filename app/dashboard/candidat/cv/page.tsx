import { Suspense } from "react";
import ProfileBuilder from "../profil/ProfileBuilder";

export default function CvPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Chargement du profil...</div>}>
      <ProfileBuilder />
    </Suspense>
  );
}
