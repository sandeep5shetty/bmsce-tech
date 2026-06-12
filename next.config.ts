import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/join",
        destination: "/quiz/join",
        permanent: false,
      },
      {
        source: "/join/:joinCode",
        destination: "/quiz/join/:joinCode",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
