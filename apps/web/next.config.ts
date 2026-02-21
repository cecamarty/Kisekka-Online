import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Allow workspace packages to be transpiled
  transpilePackages: [
    "@kisekka/firebase",
    "@kisekka/types",
    "@kisekka/utils",
  ],

  // Image optimization
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
