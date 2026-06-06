import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ---------------------------------------------------------------------------
  // IMAGE OPTIMIZATION — allow product images from Django backend
  // ---------------------------------------------------------------------------
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // ISR DEBUGGING — log fetch cache hits/misses in development
  // ---------------------------------------------------------------------------
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
