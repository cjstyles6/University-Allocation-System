"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  complaintId: string;
  staffList: { id: string; name: string }[];
  currentAssigneeId: string;
}

export default function AdminComplaintAssign({ complaintId, staffList, currentAssigneeId }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(currentAssigneeId);
  const [isPending, startTransition] = useTransition();

  const handleAssign = (staffId: string) => {
    setValue(staffId);
    startTransition(async () => {
      const res = await fetch(`/api/admin/complaints/${complaintId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
      });
      if (res.ok) {
        toast.success("Complaint assigned.");
        router.refresh();
      } else {
        toast.error("Assignment failed.");
      }
    });
  };

  return (
    <select
      value={value}
      onChange={(e) => handleAssign(e.target.value)}
      disabled={isPending}
      className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-primary/60 focus:outline-none disabled:opacity-50"
    >
      <option value="">Unassigned</option>
      {staffList.map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  );
}
