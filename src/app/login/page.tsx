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
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#5a8a4a] mb-4">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M8 6 L16 2 L24 6 L24 18 L16 26 L8 18Z" fill="white" opacity="0.9"/>
              <path d="M16 10 L22 14 L22 22 L16 26 L10 22 L10 14Z" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#e8e8e8]">Welcome back</h1>
          <p className="text-sm text-[#999] mt-1">Sign in to Kronos</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#332929] border border-[#4a2929] text-sm text-[#e87171]">
            {error}
          </div>
        )}

        {/* Email/Password form */}
        <form onSubmit={handleLogin} className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-[#888] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#242424] border border-[#333] text-sm text-[#e8e8e8] placeholder-[#555] focus:border-[#5a8a4a] transition-colors"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#888]">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#5a8a4a] hover:text-[#6a9a5a] transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#242424] border border-[#333] text-sm text-[#e8e8e8] placeholder-[#555] focus:border-[#5a8a4a] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2.5 rounded-lg bg-[#5a8a4a] text-white text-sm font-medium hover:bg-[#6a9a5a] transition-colors disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#333]" />
          <span className="text-xs text-[#666]">or</span>
          <div className="flex-1 h-px bg-[#333]" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-[#242424] border border-[#333] text-[#e8e8e8] hover:bg-[#2a2a2a] transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a8a4a" strokeWidth="2" className="animate-spin">
              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
            </svg>
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

        {/* Sign up link */}
        <p className="text-sm text-[#999] text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#5a8a4a] hover:text-[#6a9a5a] font-medium transition-colors">
            Sign up
          </Link>
        </p>

        <p className="text-xs text-[#555] text-center mt-6">
          By continuing, you agree to Kronos&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
