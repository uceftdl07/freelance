import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./lib/Providers";
import PwaRegister from "./components/PwaRegister";

export const metadata: Metadata = {
  title: "FreelanceIT – La plateforme freelance IT en France",
  description:
    "Trouvez les meilleures missions freelance IT, CDI et CDD tech en France. +20 000 offres, +7 000 freelances. Rejoignez la communauté tech #1.",
  keywords:
    "freelance IT, missions freelance, développeur freelance, consultant IT, offres tech, CDI tech, France",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FreelanceIT",
  },
  openGraph: {
    title: "FreelanceIT – Connecting Tech-Talent",
    description:
      "La plateforme de référence pour les freelances et consultants IT en France.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#00b8d9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <PwaRegister />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
