"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

export default function AdminBookingActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actioning, setActioning] = useState<"confirm" | "reject" | null>(null);

  const handleAction = (action: "confirm" | "reject") => {
    setActioning(action);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/bookings/${bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Action failed");
        }
        
        toast.success(`Booking ${action === "confirm" ? "confirmed" : "rejected"}.`);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setActioning(null);
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => handleAction("confirm")}
        disabled={isPending}
        className="flex h-7 items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
      >
        {isPending && actioning === "confirm" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        Confirm
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={isPending}
        className="flex h-7 items-center gap-1.5 rounded-md bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
      >
        {isPending && actioning === "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        Reject
      </button>
    </div>
  );
}
