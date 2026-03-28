"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/home");
    });
  }, [router, supabase.auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/home");
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-gradient flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,158,108,0.6), transparent 70%)" }} />
      <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(140,160,220,0.5), transparent 70%)" }} />

      <div className="w-full max-w-sm px-6 relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-logo text-4xl bg-gradient-to-br from-white via-[#c8d0e8] to-[#8b90a8] bg-clip-text text-transparent">
            Kronos
          </span>
          <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>Welcome back</p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-5">
          {error && (
            <div className="px-4 py-2.5 rounded-lg text-sm" style={{ background: "rgba(232,113,113,0.1)", border: "1px solid rgba(232,113,113,0.2)", color: "#e87171" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs" style={{ color: "var(--text-muted)" }}>Password</label>
                <Link href="/forgot-password" className="text-xs font-medium transition-colors" style={{ color: "var(--accent)" }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
          >
            {isGoogleLoading ? (
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
          </button>
        </div>

        <p className="text-sm text-center mt-6" style={{ color: "var(--text-secondary)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium transition-colors" style={{ color: "var(--accent)" }}>
            Sign up
          </Link>
        </p>

        <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>
          By continuing, you agree to Kronos&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
