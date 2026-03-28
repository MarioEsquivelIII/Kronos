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
    <div className="min-h-screen bg-sky-gradient flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-[30%] right-[15%] w-[400px] h-[400px] rounded-full opacity-[0.05] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(200,170,120,0.5), transparent 70%)" }} />

      <div className="w-full max-w-sm px-6 relative z-10">
        <div className="text-center mb-10">
          <span className="font-logo text-4xl bg-gradient-to-br from-white via-[#c8d0e8] to-[#8b90a8] bg-clip-text text-transparent">
            Kronos
          </span>
          <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
            {sent ? "Check your inbox" : "Reset your password"}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg text-sm" style={{ background: "rgba(232,113,113,0.1)", border: "1px solid rgba(232,113,113,0.2)", color: "#e87171" }}>
              {error}
            </div>
          )}

          {sent ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-4" style={{ background: "rgba(124,158,108,0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                We sent a password reset link to <span style={{ color: "var(--text-primary)" }}>{email}</span>.
              </p>
              <Link href="/login" className="text-sm font-medium transition-colors" style={{ color: "var(--accent)" }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
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
                {isLoading ? "Sending..." : "Send reset link"}
              </button>
              <p className="text-sm text-center">
                <Link href="/login" className="font-medium transition-colors" style={{ color: "var(--accent)" }}>
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
