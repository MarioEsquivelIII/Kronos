"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email: string; name: string; avatar_url?: string } | null>(null);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: supaUser } }) => {
      if (supaUser) {
        const u = {
          email: supaUser.email || "",
          name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.email?.split("@")[0] || "User",
          avatar_url: supaUser.user_metadata?.avatar_url,
        };
        setUser(u);
        setName(u.name);
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem("kronos_user");
        if (!stored) { router.push("/login"); return; }
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setName(parsed.name);
      }
    });
  }, [router, supabase.auth]);

  const handleSave = async () => {
    if (!user) return;
    await supabase.auth.updateUser({ data: { full_name: name } });
    const updated = { ...user, name };
    localStorage.setItem("kronos_user", JSON.stringify(updated));
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("kronos_user");
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      await supabase.auth.signOut();
      localStorage.removeItem("kronos_user");
      localStorage.removeItem("kronos_events");
      router.push("/login");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-[#1a1a1a]/90 backdrop-blur-md border-b border-[#2a2a2a]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push("/home")}
            className="flex items-center gap-2 text-sm text-[#999] hover:text-[#e8e8e8] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-sm font-semibold text-[#e8e8e8]">Account</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile section */}
        <div className="bg-[#242424] rounded-2xl border border-[#2a2a2a] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-sm font-semibold text-[#e8e8e8]">Profile</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#5a8a4a] flex items-center justify-center text-xl font-semibold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[#e8e8e8]">{name}</p>
                <p className="text-xs text-[#666]">{user.email}</p>
              </div>
            </div>

            {/* Name field */}
            <div>
              <label className="block text-xs text-[#666] mb-1.5">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-sm text-[#e8e8e8] focus:border-[#5a8a4a] transition-colors"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs text-[#666] mb-1.5">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-sm text-[#666] cursor-not-allowed"
              />
            </div>

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-[#5a8a4a] text-sm text-white font-medium hover:bg-[#6a9a5a] transition-colors"
            >
              {saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        </div>

        {/* Connected accounts */}
        <div className="bg-[#242424] rounded-2xl border border-[#2a2a2a] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-sm font-semibold text-[#e8e8e8]">Connected accounts</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[#e8e8e8]">Google Calendar</p>
                  <p className="text-xs text-[#666]">Sync events with Google Calendar</p>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-[#2a2a2a] border border-[#333] text-xs text-[#999] hover:text-[#e8e8e8] hover:border-[#5a8a4a] transition-colors">
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-[#242424] rounded-2xl border border-[#2a2a2a] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-sm font-semibold text-[#e8e8e8]">Preferences</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#e8e8e8]">Default view</p>
                <p className="text-xs text-[#666]">What you see when you open Kronos</p>
              </div>
              <select className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333] text-xs text-[#e8e8e8] [color-scheme:dark]">
                <option>Home</option>
                <option>Calendar</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#e8e8e8]">Week starts on</p>
                <p className="text-xs text-[#666]">First day of the week</p>
              </div>
              <select className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333] text-xs text-[#e8e8e8] [color-scheme:dark]">
                <option>Sunday</option>
                <option>Monday</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-[#242424] rounded-2xl border border-[#332929] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#332929]">
            <h2 className="text-sm font-semibold text-[#e87171]">Danger zone</h2>
          </div>
          <div className="px-6 py-4 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 rounded-lg bg-[#2a2a2a] border border-[#333] text-sm text-[#e8e8e8] hover:bg-[#333] transition-colors text-left"
            >
              Log out
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full px-4 py-2.5 rounded-lg bg-[#2a1a1a] border border-[#332929] text-sm text-[#e87171] hover:bg-[#331a1a] transition-colors text-left"
            >
              Delete account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
