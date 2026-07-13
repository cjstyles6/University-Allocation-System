import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveBooking } from "@/lib/active-booking";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Gate: student must have an active room booking ─────────────────
    const activeBooking = await getActiveBooking(session.user.id);
    if (!activeBooking) {
      return NextResponse.json(
        { error: "You need an active room booking before filing a complaint." },
        { status: 403 }
      );
    }

    const { title, description, category, image } = await req.json();

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        category,
        image,
        userId: session.user.id,
        roomId: activeBooking.roomId,
        status: "PENDING",
      },
      include: {
        user: { select: { name: true, email: true } },
        room: { select: { number: true } }
      }
    });

    // Notify admins instantly — only admins can act on an unassigned
    // complaint (staff only see it once it's assigned to them, which
    // fires its own notification from the assign route).
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await notify(admins.map((u) => u.id), {
      title: "New Complaint",
      body: `${category}: ${title}`,
      link: `/admin/complaints?complaint=${complaint.id}`,
    });

    return NextResponse.json({ success: true, complaint }, { status: 201 });
  } catch (error: any) {
    console.error("Complaint Creation Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
