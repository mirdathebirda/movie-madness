import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/movie-madness",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
