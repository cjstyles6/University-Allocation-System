"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Calendar, Check, Loader2 } from "lucide-react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";

interface BookingClientProps {
  roomId: string;
  roomNumber: string;
  hostelName: string;
  price: number;
  type: string;
  userEmail: string;
  userName: string;
  flwKey: string;
}

// Each semester allocates a room for exactly 4 months.
const SEMESTER_LENGTH_MONTHS = 4;

function addMonths(dateStr: string, months: number) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Generate the next few academic semesters from current year
function getSemesters() {
  const now = new Date();
  const year = now.getFullYear();
  const semesters = [];

  for (let y = year; y <= year + 2; y++) {
    const firstCheckIn = `${y}-09-01`;
    semesters.push({
      label: `First Semester ${y}/${y + 1}`,
      value: `FIRST_${y}`,
      checkIn: firstCheckIn,
      checkOut: addMonths(firstCheckIn, SEMESTER_LENGTH_MONTHS),
    });
    const secondCheckIn = `${y + 1}-02-01`;
    semesters.push({
      label: `Second Semester ${y}/${y + 1}`,
      value: `SECOND_${y}`,
      checkIn: secondCheckIn,
      checkOut: addMonths(secondCheckIn, SEMESTER_LENGTH_MONTHS),
    });
  }

  // Only show semesters that haven't ended yet
  return semesters.filter((s) => new Date(s.checkOut) > now).slice(0, 4);
}

const typeLabel: Record<string, string> = {
  SINGLE: "Single Room",
  DOUBLE: "Double Room",
};

export default function BookingClient({
  roomId, roomNumber, hostelName, price, type, userEmail, userName, flwKey
}: BookingClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const semesters = getSemesters();
  const selectedSem = semesters.find((s) => s.value === selected);

  const config = {
    public_key: flwKey,
    tx_ref: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    amount: price,
    currency: "NGN",
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: userEmail,
      name: userName,
      phone_number: "",
    },
    customizations: {
      title: "University Hostel Accommodation",
      description: `Payment for ${hostelName} - Room ${roomNumber}`,
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const processBookingWithPayment = async (response: any) => {
    setLoading(true);
    try {
      // 1. Verify Payment
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: response.tx_ref,
          transactionId: String(response.transaction_id),
          amount: price,
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || "Payment verification failed");
      }

      // 2. Create Booking
      if (!selectedSem) throw new Error("Semester not selected");
      
      const bookRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          semester: selected,
          checkIn: selectedSem.checkIn,
          checkOut: selectedSem.checkOut,
        }),
      });
      
      const bookData = await bookRes.json();
      if (!bookRes.ok) throw new Error(bookData.error || "Booking failed");

      toast.success(`Payment successful! Room ${roomNumber} booked for ${selectedSem.label}.`);
      setOpen(false);
      router.push("/student");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !selectedSem) {
      toast.error("Please select a semester.");
      return;
    }

    handleFlutterPayment({
      callback: (response) => {
        closePaymentModal();
        if (response.status === "successful" || response.status === "completed") {
          processBookingWithPayment(response);
        } else {
          toast.error("Payment was not successful.");
        }
      },
      onClose: () => {
        if (!loading) toast.info("Payment modal closed.");
      },
    });
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-primary/5 opacity-0 hover:opacity-100 transition-opacity"
      >
        <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white shadow-sm">
          Select
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div>
                <h3 className="text-base font-bold text-foreground">Confirm Booking</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {hostelName} · Room {roomNumber} · {typeLabel[type] ?? type}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={initiatePayment} className="px-6 py-5 space-y-5">
              {/* Fee summary */}
              <div className="flex items-center justify-between rounded-xl bg-violet-50 border border-violet-100 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Semester Fee</p>
                  <p className="text-[11px] text-violet-500 mt-0.5">Covers full semester accommodation</p>
                </div>
                <p className="text-xl font-bold text-violet-700">₦{price.toLocaleString()}</p>
              </div>

              {/* Student */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Booking for</span>
                <span className="font-medium text-foreground">{userName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{userEmail}</span>
              </div>

              {/* Semester selector */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Select Semester
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {semesters.map((sem) => (
                    <button
                      key={sem.value}
                      type="button"
                      onClick={() => setSelected(sem.value)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                        selected === sem.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-white hover:border-gray-300"
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${selected === sem.value ? "text-primary" : "text-foreground"}`}>
                          {sem.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(sem.checkIn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          {" → "}
                          {new Date(sem.checkOut).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      {selected === sem.value && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !selected}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-sm shadow-violet-200 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  : selected
                  ? `Pay ₦${price.toLocaleString()} & Book`
                  : "Select a semester to continue"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
