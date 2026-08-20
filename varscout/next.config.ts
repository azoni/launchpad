import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // firebase-admin uses dynamic requires + gRPC and must NOT be bundled by the
  // server compiler. Without this, route handlers that import it fail at module
  // load on Netlify and return 500 before any of their own code runs.
  serverExternalPackages: ["firebase-admin"],

  // Also declared in netlify.toml. Setting them here too means they survive
  // regardless of how the toml is resolved at deploy time, since Next serves
  // these responses itself.
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
