"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const next = searchParams.get("next") ?? "/home";
    const code = searchParams.get("code");

    if (!code) {
      router.replace("/login?error=auth_failed");
      return;
    }

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setMessage("Could not complete sign-in.");
        router.replace("/login?error=auth_failed");
        return;
      }
      router.replace(next.startsWith("/") ? next : `/${next}`);
    });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-[#e8e8e8] text-sm">
      {message}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-[#e8e8e8] text-sm">
          Loading…
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
