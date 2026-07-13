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
  const { staffId } = await req.json();

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      assignedToId: staffId || null,
      status: staffId ? "IN_PROGRESS" : "PENDING",
    },
  });

  if (staffId) {
    await notify([staffId], {
      title: "New Task Assigned",
      body: `You've been assigned: ${complaint.title}`,
      link: `/staff?complaint=${complaint.id}`,
    });
  }

  return NextResponse.json({ success: true, complaint });
}
