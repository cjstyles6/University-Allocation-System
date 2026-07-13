"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ComplaintDetailData {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  image: string | null;
  createdAt: Date | string;
  user?: { name: string } | null;
  room?: { number: string; hostelName: string } | null;
  assignedTo?: { name: string } | null;
}

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  AWAITING_CONFIRMATION: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

export function ComplaintDetailModal({
  complaint,
  open,
  onOpenChange,
}: {
  complaint: ComplaintDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6">{complaint.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[complaint.status]}`}>
              {complaint.status.replace("_", " ")}
            </span>
            <span>Filed {new Date(complaint.createdAt).toLocaleString()}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Category</p>
            <p className="mt-0.5 text-foreground">{complaint.category}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Room</p>
            <p className="mt-0.5 text-foreground">
              {complaint.room ? `${complaint.room.hostelName} · ${complaint.room.number}` : "—"}
            </p>
          </div>
          {complaint.user && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Reported by</p>
              <p className="mt-0.5 text-foreground">{complaint.user.name}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Assigned to</p>
            <p className="mt-0.5 text-foreground">{complaint.assignedTo?.name ?? "Unassigned"}</p>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Description</p>
          <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm text-foreground">
            {complaint.description}
          </p>
        </div>

        {complaint.image && (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Evidence</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={complaint.image}
              alt="Complaint evidence"
              className="max-h-64 w-full rounded-lg border border-border object-contain"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
