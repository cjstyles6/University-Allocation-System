"use client";

import { useState } from "react";
import { ComplaintDetailModal, type ComplaintDetailData } from "@/components/complaint-detail-modal";

export default function StudentComplaintRow({
  complaint: c,
  statusStyle,
}: {
  complaint: ComplaintDetailData;
  statusStyle: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        id={`complaint-${c.id}`}
        onClick={() => setOpen(true)}
        className="scroll-mt-20 flex cursor-pointer items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-secondary/20"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{c.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {c.category} · {new Date(c.createdAt).toLocaleDateString()}
            {c.room && ` · ${c.room.hostelName} Room ${c.room.number}`}
          </p>
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground/80">{c.description}</p>
          {c.assignedTo && (
            <p className="mt-1 text-[11px] font-medium text-primary/80">
              Assigned to {c.assignedTo.name}
            </p>
          )}
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[c.status]}`}
        >
          {c.status.replace("_", " ")}
        </span>
      </div>
      <ComplaintDetailModal complaint={c} open={open} onOpenChange={setOpen} />
    </>
  );
}
