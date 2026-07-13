import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Bed, AlertCircle, ArrowRight } from "lucide-react";
import { NewComplaintModal } from "@/components/new-complaint-modal";
import { getBookingInProgress } from "@/lib/active-booking";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);

  const [booking, recentComplaints, totalComplaints] = await Promise.all([
    getBookingInProgress(session!.user.id),
    prisma.complaint.findMany({
      where: { userId: session?.user.id },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.complaint.count({ where: { userId: session?.user.id } }),
  ]);

  const isConfirmed = booking?.status === "CONFIRMED";

  const statusStyle: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    AWAITING_CONFIRMATION: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    RESOLVED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  };

  const payStyle: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    PAID: "bg-emerald-50 text-emerald-700",
    FAILED: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome banner */}
      <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Welcome back</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{session?.user.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">Here&apos;s a summary of your hostel status.</p>
        {!booking && (
          <Link
            href="/student/rooms"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition-all hover:bg-primary/90"
          >
            Book a Room <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Accommodation</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 ring-1 ring-violet-100">
              <Bed className="h-4 w-4 text-violet-600" />
            </div>
          </div>
          {booking ? (
            <div className="mt-3">
              <p className="text-lg font-bold text-foreground">{booking.room.hostelName}</p>
              <p className="text-sm text-muted-foreground">Room {booking.room.number} · {booking.room.type}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(booking.checkIn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                {" → "}
                {new Date(booking.checkOut).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              {isConfirmed ? (
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${payStyle[booking.paymentStatus]}`}>
                  {booking.paymentStatus}
                </span>
              ) : (
                <span className="mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700">
                  Awaiting admin approval
                </span>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No room booked yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Complaints Filed</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 ring-1 ring-amber-100">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-amber-600">{totalComplaints}</p>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Complaints</h3>
          <NewComplaintModal
            disabled={!isConfirmed}
            roomLabel={isConfirmed && booking ? `${booking.room.hostelName} · Room ${booking.room.number}` : undefined}
          />
        </div>
        <div className="divide-y divide-border">
          {recentComplaints.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-6 py-3.5">
              <div>
                <p className="text-sm font-medium text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.category} · {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[c.status]}`}>
                {c.status.replace("_", " ")}
              </span>
            </div>
          ))}
          {recentComplaints.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No complaints filed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
