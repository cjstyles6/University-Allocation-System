"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export default function AdminComplaintResolve({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/complaints/${complaintId}/resolve`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Complaint confirmed resolved.");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to confirm resolution");
      }
    });
  };

  return (
    <button
      onClick={handleConfirm}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100 disabled:opacity-50"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {isPending ? "Confirming…" : "Confirm Resolved"}
    </button>
  );
}
