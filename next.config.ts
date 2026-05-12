import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16 — serwist uses webpack; keep both coexisting
  turbopack: {},
};

export default withSerwist(nextConfig);
