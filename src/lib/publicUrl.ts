/**
 * Origin + Next.js basePath (e.g. GitHub Project Pages at /repo-name).
 * Use for OAuth redirectTo and absolute links to this app.
 */
export function getSiteOrigin(): string {
  if (typeof window === "undefined") return "";
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${window.location.origin}${base}`;
}
