"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw, CreditCard, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface RejectedBookingModalProps {
  bookingId: string;
}

export function RejectedBookingModal({ bookingId }: RejectedBookingModalProps) {
  const [loading, setLoading] = useState<"refund" | "rebook" | null>(null);
  const router = useRouter();

  const handleAction = async (action: "refund" | "rebook") => {
    setLoading(action);
    try {
      const res = await fetch("/api/payment/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      toast.success(action === "refund" ? "Refund requested successfully!" : "You can now pick another room.");
      
      // Refresh the page to clear the modal
      router.refresh();
      
      if (action === "rebook") {
        router.push("/student/rooms");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 ring-8 ring-amber-50/50">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Booking Not Approved
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Your recent hostel booking was not approved by the administrator. 
            Since you have already paid, you can either request a full refund to your original payment method or choose a different room immediately.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3">
            <button
              onClick={() => handleAction("rebook")}
              disabled={!!loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
            >
              {loading === "rebook" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Pick Another Room
            </button>
            
            <button
              onClick={() => handleAction("refund")}
              disabled={!!loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-secondary disabled:opacity-50"
            >
              {loading === "refund" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Refund My Money
            </button>
          </div>

          <p className="mt-6 text-[11px] text-muted-foreground">
            Refunds typically take 3-15 working days to reflect in your account.
          </p>
        </div>
      </div>
    </div>
  );
}
