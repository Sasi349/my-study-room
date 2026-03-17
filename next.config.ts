import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs"],
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-f59a69f293b84e8bba48543071f56dfd.r2.dev",
      },
    ],
  },
};

export default nextConfig;
