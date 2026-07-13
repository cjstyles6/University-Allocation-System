import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  LayoutDashboard, Bed, AlertCircle, CheckCircle2, Clock, Building2, BadgeCheck,
} from "lucide-react";
import AdminBookingActions from "./booking-actions";
import { RoomOccupancyChart, ComplaintsByCategoryChart } from "./dashboard-charts";

export default async function AdminDashboard() {
  const [
    totalRooms, occupiedRooms, availableRooms,
    totalComplaints, pendingComplaints, awaitingConfirmation, resolvedComplaints,
    totalStudents,
    roomsByHostelStatus, complaintsByCategory,
    recentComplaints,
    pendingBookings,
  ] = await Promise.all([
    prisma.room.count(),
    prisma.room.count({ where: { status: "OCCUPIED" } }),
    prisma.room.count({ where: { status: "AVAILABLE" } }),
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: "PENDING" } }),
    prisma.complaint.count({ where: { status: "AWAITING_CONFIRMATION" } }),
    prisma.complaint.count({ where: { status: "RESOLVED" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.room.groupBy({ by: ["hostelName", "status"], _count: true }),
    prisma.complaint.groupBy({ by: ["category"], _count: true }),
    prisma.complaint.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } }, room: { select: { number: true } } },
    }),
    prisma.booking.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { name: true, email: true } }, room: { select: { number: true, hostelName: true, type: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const stats = [
    { label: "Total Rooms", value: totalRooms, icon: Building2, color: "text-violet-600", bg: "bg-violet-50", ring: "ring-violet-100" },
    { label: "Occupied", value: occupiedRooms, icon: Bed, color: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-100" },
    { label: "Available", value: availableRooms, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
    { label: "Total Students", value: totalStudents, icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100" },
    { label: "Total Complaints", value: totalComplaints, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100" },
    { label: "Pending", value: pendingComplaints, icon: Clock, color: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-100" },
    { label: "Awaiting Confirmation", value: awaitingConfirmation, icon: BadgeCheck, color: "text-violet-600", bg: "bg-violet-50", ring: "ring-violet-100" },
    { label: "Resolved", value: resolvedComplaints, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
  ];

  const statusStyle: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    AWAITING_CONFIRMATION: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    RESOLVED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  };

  // Pivot room counts into one row per hostel for the occupancy chart.
  const occupancyByHostel = new Map<string, { hostel: string; available: number; occupied: number; maintenance: number }>();
  for (const row of roomsByHostelStatus) {
    const key = row.hostelName;
    if (!occupancyByHostel.has(key)) {
      occupancyByHostel.set(key, { hostel: key.replace(" Hostel", ""), available: 0, occupied: 0, maintenance: 0 });
    }
    const entry = occupancyByHostel.get(key)!;
    if (row.status === "AVAILABLE") entry.available = row._count;
    if (row.status === "OCCUPIED") entry.occupied = row._count;
    if (row.status === "MAINTENANCE") entry.maintenance = row._count;
  }
  const occupancyData = Array.from(occupancyByHostel.values());

  const categoryData = complaintsByCategory
    .map((row) => ({ category: row.category, count: row._count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Overview</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome back. Here&apos;s what&apos;s happening in your hostel.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} ring-1 ${s.ring}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className={`mt-3 text-3xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/rooms" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary">
          <Bed className="h-4 w-4 text-muted-foreground" /> Manage Rooms
        </Link>
        <Link href="/admin/complaints" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary">
          <AlertCircle className="h-4 w-4 text-muted-foreground" /> Assign Complaints
        </Link>
        <Link href="/admin/users" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary">
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" /> View Users
        </Link>
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Room Occupancy by Hostel</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Available, occupied, and under-maintenance rooms per hostel.</p>
          </div>
          <div className="p-4">
            <RoomOccupancyChart data={occupancyData} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Complaints by Category</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Where maintenance issues are coming from most.</p>
          </div>
          <div className="p-4">
            <ComplaintsByCategoryChart data={categoryData} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Pending Bookings */}
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Pending Room Allocations</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Students who have paid and selected a room</p>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Semester</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingBookings.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-secondary/20">
                    <td className="px-6 py-3">
                      <p className="font-medium text-foreground">{b.user.name}</p>
                      <p className="text-[11px] text-muted-foreground">{b.user.email}</p>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-foreground">{b.room.hostelName}</p>
                      <p className="text-xs text-muted-foreground">{b.room.number} · {b.room.type}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-200">
                        {b.semester.replace("_", " ")}
                      </span>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-1">PAID</p>
                    </td>
                    <td className="px-6 py-3">
                      <AdminBookingActions bookingId={b.id} />
                    </td>
                  </tr>
                ))}
                {pendingBookings.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">No pending bookings.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Complaints</h3>
            <Link href="/admin/complaints" className="text-xs font-medium text-primary hover:text-primary/75 transition-colors">View all</Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentComplaints.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-secondary/20">
                    <td className="px-6 py-3 font-medium text-foreground">{c.user.name}</td>
                    <td className="px-6 py-3">
                      <p className="text-foreground">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.category} · {c.room?.number ?? "General"}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[c.status]}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentComplaints.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-sm text-muted-foreground">No complaints yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
