import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingIncludes: {
    "/api/plan": ["./skills/**/*"],
  },
};

export default nextConfig;
