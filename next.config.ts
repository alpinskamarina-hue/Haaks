import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Social-style profiles live at /@nick; the page itself is /u/[handle].
  async rewrites() {
    return [{ source: "/@:handle", destination: "/u/:handle" }];
  },
};

export default nextConfig;
