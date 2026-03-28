"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) { setError("Please fill in both fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/home");
    }
  };

  return (
    <div className="min-h-screen bg-sky-gradient flex items-center justify-center relative overflow-hidden">
      <div className="absolute bottom-[20%] left-[25%] w-[500px] h-[500px] rounded-full opacity-[0.05] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(140,160,220,0.5), transparent 70%)" }} />

      <div className="w-full max-w-sm px-6 relative z-10">
        <div className="text-center mb-10">
          <span className="font-logo text-4xl bg-gradient-to-br from-white via-[#c8d0e8] to-[#8b90a8] bg-clip-text text-transparent">
            Kronos
          </span>
          <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>Set your new password</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg text-sm" style={{ background: "rgba(232,113,113,0.1)", border: "1px solid rgba(232,113,113,0.2)", color: "#e87171" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm your password"
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
              {isLoading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
