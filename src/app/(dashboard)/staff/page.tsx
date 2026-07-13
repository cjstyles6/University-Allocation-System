import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StaffTaskRow from "./task-row";
import { Clock, Wrench, CheckCircle2 } from "lucide-react";
import { HighlightTarget } from "@/components/highlight-target";

export default async function StaffDashboard({
  searchParams,
}: {
  searchParams: Promise<{ complaint?: string }>;
}) {
  const { complaint: highlightId } = await searchParams;
  const session = await getServerSession(authOptions);

  const [pending, inProgress, resolved, tasks] = await Promise.all([
    prisma.complaint.count({ where: { assignedToId: session?.user.id, status: "PENDING" } }),
    prisma.complaint.count({ where: { assignedToId: session?.user.id, status: "IN_PROGRESS" } }),
    prisma.complaint.count({ where: { assignedToId: session?.user.id, status: "RESOLVED" } }),
    prisma.complaint.findMany({
      where: { assignedToId: session?.user.id },
      include: { room: { select: { number: true, hostelName: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const stats = [
    { label: "Pending", value: pending, icon: Clock, color: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-100" },
    { label: "In Progress", value: inProgress, icon: Wrench, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100" },
    { label: "Resolved", value: resolved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
  ];

  const statusStyle: Record<string, string> = {
    PENDING: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    IN_PROGRESS: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    AWAITING_CONFIRMATION: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    RESOLVED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <HighlightTarget id={highlightId} />
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">My Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Track and update your assigned maintenance tasks.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
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

      {/* Complaints table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Assigned Tasks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((t) => (
                <StaffTaskRow key={t.id} task={t} statusStyle={statusStyle} />
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No tasks assigned to you yet.
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
