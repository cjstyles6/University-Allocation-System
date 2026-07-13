import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

const statusMessage: Record<string, string> = {
  IN_PROGRESS: "is now in progress",
  AWAITING_CONFIRMATION: "has been marked resolved by staff and is awaiting admin confirmation",
  PENDING: "was reopened",
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  // Staff can never set RESOLVED directly — only an admin can confirm a
  // complaint as fully resolved, via /api/admin/complaints/[id]/resolve.
  const valid = ["PENDING", "IN_PROGRESS", "AWAITING_CONFIRMATION"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const complaint = await prisma.complaint.update({
    where: { id },
    data: { status },
  });

  await notify([complaint.userId], {
    title: "Complaint Updated",
    body: `Your complaint "${complaint.title}" ${statusMessage[status]}.`,
    link: `/student/complaints?complaint=${complaint.id}`,
  });

  if (status === "AWAITING_CONFIRMATION") {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await notify(admins.map((u) => u.id), {
      title: "Ready for Confirmation",
      body: `"${complaint.title}" was marked resolved by staff — confirm to close it.`,
      link: `/admin/complaints?complaint=${complaint.id}`,
    });
  }

  return NextResponse.json({ success: true, complaint });
}
