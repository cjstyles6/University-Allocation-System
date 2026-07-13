import { prisma } from "@/lib/prisma";
import AdminBookingActions from "../booking-actions";
import { BackButton } from "@/components/back-button";
import { format } from "date-fns";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { name: true, email: true } },
      room: { select: { number: true, hostelName: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  const statusStyle: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    CONFIRMED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    CANCELLED: "bg-gray-50 text-gray-700 ring-1 ring-gray-200",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Booking Approvals</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {bookings.length} total bookings · {pendingCount} awaiting approval
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Room Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Semester & Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((booking) => (
                <tr key={booking.id} className="transition-colors hover:bg-secondary/20">
                  <td className="px-6 py-4 text-muted-foreground">
                    {format(booking.createdAt, "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{booking.user.name}</p>
                    <p className="text-[11px] text-muted-foreground">{booking.user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{booking.room.hostelName}</p>
                    <p className="text-xs text-muted-foreground">{booking.room.number} · {booking.room.type}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">
                      {booking.semester.replace("_", " ")}
                    </span>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${booking.paymentStatus === "PAID" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Payment: {booking.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[booking.status]}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {booking.status === "PENDING" && booking.paymentStatus === "PAID" ? (
                      <AdminBookingActions bookingId={booking.id} />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
