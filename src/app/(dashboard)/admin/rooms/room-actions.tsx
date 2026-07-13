"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const transitions: Record<string, { label: string; next: string }> = {
  AVAILABLE:    { label: "Set Maintenance", next: "MAINTENANCE" },
  MAINTENANCE:  { label: "Set Available", next: "AVAILABLE" },
  OCCUPIED:     { label: "Force Available", next: "AVAILABLE" },
};

export default function AdminRoomActions({ roomId, currentStatus }: { roomId: string; currentStatus: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const action = transitions[currentStatus];

  if (!action) return null;

  const handle = () => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/rooms/${roomId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action.next }),
      });
      if (res.ok) {
        toast.success(`Room updated to ${action.next}`);
        router.refresh();
      } else {
        toast.error("Update failed.");
      }
    });
  };

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border disabled:opacity-50"
    >
      {isPending ? "Updating…" : action.label}
    </button>
  );
}
