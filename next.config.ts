import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node 24 (non-LTS) causes Turbopack TypeScript worker crash.
  // tsc --noEmit passes independently, so skip the in-build check.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;