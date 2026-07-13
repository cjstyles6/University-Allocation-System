import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AlertCircle } from "lucide-react";
import { NewComplaintModal } from "@/components/new-complaint-modal";
import { getActiveBooking } from "@/lib/active-booking";
import { HighlightTarget } from "@/components/highlight-target";
import StudentComplaintRow from "./complaint-row";

export default async function StudentComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ complaint?: string }>;
}) {
  const { complaint: highlightId } = await searchParams;
  const session = await getServerSession(authOptions);

  const [complaints, activeBooking] = await Promise.all([
    prisma.complaint.findMany({
      where: { userId: session?.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        room: { select: { number: true, hostelName: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    getActiveBooking(session!.user.id),
  ]);

  const statusStyle: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    AWAITING_CONFIRMATION: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    RESOLVED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  };

  const roomLabel = activeBooking
    ? `${activeBooking.room.hostelName} · Room ${activeBooking.room.number}`
    : undefined;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <HighlightTarget id={highlightId} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">My Complaints</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track every issue you&apos;ve reported and its current status.
          </p>
        </div>
        <NewComplaintModal disabled={!activeBooking} roomLabel={roomLabel} />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="divide-y divide-border">
          {complaints.map((c) => (
            <StudentComplaintRow key={c.id} complaint={c} statusStyle={statusStyle} />
          ))}
          {complaints.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No complaints yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Report an issue and staff will be notified instantly.
                </p>
              </div>
              <NewComplaintModal disabled={!activeBooking} roomLabel={roomLabel} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
