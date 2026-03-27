"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/home");
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#5a8a4a] animate-pulse">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path d="M8 6 L16 2 L24 6 L24 18 L16 26 L8 18Z" fill="white" opacity="0.9"/>
            <path d="M16 10 L22 14 L22 22 L16 26 L10 22 L10 14Z" fill="white" opacity="0.5"/>
          </svg>
        </div>
        <span className="text-sm text-[#666]">Loading...</span>
      </div>
    </div>
  );
}
