"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email."); return; }
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSent(true);
      setIsLoading(false);
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
          <h1 className="text-2xl font-semibold text-[#e8e8e8]">Reset password</h1>
          <p className="text-sm text-[#999] mt-1">
            {sent ? "Check your inbox" : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#332929] border border-[#4a2929] text-sm text-[#e87171]">
            {error}
          </div>
        )}

        {sent ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#2a3a2a] mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a8a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm text-[#999] mb-6">
              We sent a password reset link to <span className="text-[#e8e8e8]">{email}</span>. Check your email and follow the link to reset your password.
            </p>
            <Link href="/login" className="text-sm text-[#5a8a4a] hover:text-[#6a9a5a] font-medium transition-colors">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-3">
            <div>
              <label className="block text-xs text-[#888] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#242424] border border-[#333] text-sm text-[#e8e8e8] placeholder-[#555] focus:border-[#5a8a4a] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg bg-[#5a8a4a] text-white text-sm font-medium hover:bg-[#6a9a5a] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </button>
            <p className="text-sm text-[#999] text-center mt-4">
              <Link href="/login" className="text-[#5a8a4a] hover:text-[#6a9a5a] font-medium transition-colors">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
