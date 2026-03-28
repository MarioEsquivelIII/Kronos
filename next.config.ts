import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";
const rawBase = process.env.NEXT_PUBLIC_BASE_PATH;
const basePath =
  rawBase && rawBase.length > 0 ? (rawBase.startsWith("/") ? rawBase : `/${rawBase}`) : undefined;

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" as const } : {}),
  ...(isStaticExport ? { trailingSlash: true } : {}),
  ...(isStaticExport ? { images: { unoptimized: true } } : {}),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
