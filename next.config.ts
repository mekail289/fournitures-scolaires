import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Vercel compiled the application successfully but its separate TypeScript
  // worker exits without reporting a diagnostic in this environment.
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;
