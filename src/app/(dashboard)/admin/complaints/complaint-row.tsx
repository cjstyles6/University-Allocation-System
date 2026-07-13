"use client";

import { useState } from "react";
import AdminComplaintAssign from "./complaint-assign";
import AdminComplaintResolve from "./complaint-resolve";
import { ComplaintDetailModal, type ComplaintDetailData } from "@/components/complaint-detail-modal";

interface Props {
  complaint: ComplaintDetailData & { assignedToId: string | null };
  staffList: { id: string; name: string }[];
  statusStyle: Record<string, string>;
}

export default function AdminComplaintRow({ complaint: c, staffList, statusStyle }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        id={`complaint-${c.id}`}
        onClick={() => setOpen(true)}
        className="scroll-mt-20 cursor-pointer transition-colors hover:bg-secondary/20"
      >
        <td className="px-6 py-3 font-medium text-foreground">{c.user?.name}</td>
        <td className="px-6 py-3 text-foreground">{c.title}</td>
        <td className="px-6 py-3 text-muted-foreground">{c.category}</td>
        <td className="px-6 py-3 text-muted-foreground">
          {c.room ? `${c.room.hostelName} · ${c.room.number}` : "—"}
        </td>
        <td className="px-6 py-3">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[c.status]}`}>
            {c.status.replace("_", " ")}
          </span>
        </td>
        <td className="px-6 py-3 text-muted-foreground">{c.assignedTo?.name ?? "Unassigned"}</td>
        <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
          <AdminComplaintAssign
            complaintId={c.id}
            staffList={staffList}
            currentAssigneeId={c.assignedToId ?? ""}
          />
        </td>
        <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
          {c.status === "AWAITING_CONFIRMATION" ? (
            <AdminComplaintResolve complaintId={c.id} />
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </td>
      </tr>
      <ComplaintDetailModal complaint={c} open={open} onOpenChange={setOpen} />
    </>
  );
}
