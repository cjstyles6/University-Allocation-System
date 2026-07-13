"use client";

import { useState } from "react";
import StaffTaskActions from "./task-actions";
import { ComplaintDetailModal, type ComplaintDetailData } from "@/components/complaint-detail-modal";

interface Props {
  task: ComplaintDetailData;
  statusStyle: Record<string, string>;
}

export default function StaffTaskRow({ task: t, statusStyle }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        id={`complaint-${t.id}`}
        onClick={() => setOpen(true)}
        className="scroll-mt-20 cursor-pointer transition-colors hover:bg-secondary/20"
      >
        <td className="px-6 py-3 font-medium text-foreground">{t.title}</td>
        <td className="px-6 py-3 text-muted-foreground">{t.category}</td>
        <td className="px-6 py-3 text-muted-foreground">{t.user?.name}</td>
        <td className="px-6 py-3 text-muted-foreground">
          {t.room ? `${t.room.hostelName} · ${t.room.number}` : "General"}
        </td>
        <td className="px-6 py-3">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[t.status]}`}>
            {t.status.replace("_", " ")}
          </span>
        </td>
        <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
          <StaffTaskActions complaintId={t.id} currentStatus={t.status} />
        </td>
      </tr>
      <ComplaintDetailModal complaint={t} open={open} onOpenChange={setOpen} />
    </>
  );
}
