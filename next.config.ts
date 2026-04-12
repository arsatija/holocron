import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dagrejs/dagre"],
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
