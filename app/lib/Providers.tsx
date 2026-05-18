"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";

function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user?.role === "ADMIN" && !pathname.startsWith("/admin")) {
      router.replace("/admin");
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminGuard>{children}</AdminGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}
