"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/crm-admin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
        <span className="text-sm font-mono text-zinc-400">Redirecting to /crm-admin...</span>
      </div>
    </div>
  );
}
