import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves static files only; it cannot run a Next.js server.
  output: "export",
  // Generate /route/index.html so client-side routes have static files.
  trailingSlash: true,
  // GitHub Pages does not provide Next.js image optimization servers.
  images: { unoptimized: true },
};

export default nextConfig;
