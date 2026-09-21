import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.SDC_RUNTIME!=="sites"?{output:"standalone" as const}:{})
};

export default nextConfig;
