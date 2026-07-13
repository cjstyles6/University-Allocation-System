import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.complaint.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }
  if (existing.status !== "AWAITING_CONFIRMATION") {
    return NextResponse.json(
      { error: "Only complaints awaiting confirmation can be resolved." },
      { status: 409 }
    );
  }

  const complaint = await prisma.complaint.update({
    where: { id },
    data: { status: "RESOLVED" },
  });

  await notify([complaint.userId], {
    title: "Complaint Resolved",
    body: `Your complaint "${complaint.title}" has been confirmed resolved.`,
    link: `/student/complaints?complaint=${complaint.id}`,
  });

  return NextResponse.json({ success: true, complaint });
}
