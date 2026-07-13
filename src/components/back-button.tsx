"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.back()}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:bg-secondary hover:text-foreground shadow-sm ${className || ""}`}
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
