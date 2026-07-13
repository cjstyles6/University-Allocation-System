import { prisma } from "@/lib/prisma";
import AdminComplaintRow from "./complaint-row";
import { BackButton } from "@/components/back-button";
import { HighlightTarget } from "@/components/highlight-target";

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ complaint?: string }>;
}) {
  const { complaint: highlightId } = await searchParams;

  const [complaints, staffList] = await Promise.all([
    prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        room: { select: { number: true, hostelName: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "STAFF" },
      select: { id: true, name: true },
    }),
  ]);

  const statusStyle: Record<string, string> = {
    PENDING:                "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    IN_PROGRESS:            "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    AWAITING_CONFIRMATION:  "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    RESOLVED:               "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <HighlightTarget id={highlightId} />
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Complaint Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {complaints.length} total · {complaints.filter(c => c.status === "PENDING").length} pending ·{" "}
            {complaints.filter(c => c.status === "AWAITING_CONFIRMATION").length} awaiting your confirmation
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Assigned To</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Assign</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Confirm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {complaints.map((c) => (
                <AdminComplaintRow key={c.id} complaint={c} staffList={staffList} statusStyle={statusStyle} />
              ))}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-muted-foreground">No complaints yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
