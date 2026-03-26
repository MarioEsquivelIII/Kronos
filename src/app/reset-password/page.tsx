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
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#5a8a4a] mb-4">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M8 6 L16 2 L24 6 L24 18 L16 26 L8 18Z" fill="white" opacity="0.9"/>
              <path d="M16 10 L22 14 L22 22 L16 26 L10 22 L10 14Z" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#e8e8e8]">Set new password</h1>
          <p className="text-sm text-[#999] mt-1">Enter your new password below</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#332929] border border-[#4a2929] text-sm text-[#e87171]">
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-3">
          <div>
            <label className="block text-xs text-[#888] mb-1.5">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#242424] border border-[#333] text-sm text-[#e8e8e8] placeholder-[#555] focus:border-[#5a8a4a] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-[#888] mb-1.5">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#242424] border border-[#333] text-sm text-[#e8e8e8] placeholder-[#555] focus:border-[#5a8a4a] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2.5 rounded-lg bg-[#5a8a4a] text-white text-sm font-medium hover:bg-[#6a9a5a] transition-colors disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
