/**
 * Chat API URL. On static hosts (e.g. GitHub Pages) there is no /api — set
 * NEXT_PUBLIC_CHAT_API_URL to a full URL (e.g. a Vercel serverless deployment of the same route).
 */
export function getChatApiUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_CHAT_API_URL;
  if (explicit && explicit.length > 0) return explicit;
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}/api/chat`;
}
