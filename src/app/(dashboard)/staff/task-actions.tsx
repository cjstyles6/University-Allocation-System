"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Staff can move a complaint through PENDING -> IN_PROGRESS -> AWAITING_CONFIRMATION.
// Only an admin can promote AWAITING_CONFIRMATION to the final RESOLVED state.
const nextStatus: Record<string, string> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "AWAITING_CONFIRMATION",
};
const actionLabel: Record<string, string> = {
  PENDING: "Start",
  IN_PROGRESS: "Mark Resolved",
};

export default function StaffTaskActions({
  complaintId,
  currentStatus,
}: {
  complaintId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (currentStatus === "AWAITING_CONFIRMATION") {
    return <span className="text-xs text-muted-foreground">Awaiting admin confirmation</span>;
  }
  if (currentStatus === "RESOLVED") {
    return <span className="text-xs text-muted-foreground">Completed</span>;
  }

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus[currentStatus] }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${nextStatus[currentStatus].replace("_", " ")}`);
        router.refresh();
      } else {
        toast.error("Failed to update status");
      }
    });
  };

  return (
    <button
      onClick={handleUpdate}
      disabled={isPending}
      className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
    >
      {isPending ? "Updating…" : actionLabel[currentStatus]}
    </button>
  );
}
