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
  const { action } = await req.json(); // 'confirm' | 'reject'

  if (!["confirm", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { user: true, room: true },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  if (action === "confirm") {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: "CONFIRMED" },
      }),
      prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "OCCUPIED" },
      }),
    ]);
    await notify([booking.userId], {
      title: "Room Allocation Confirmed 🎉",
      body: `Your room has been confirmed: ${booking.room.hostelName} · Room ${booking.room.number}. Welcome!`,
      link: "/student",
    });
  } else {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: "REJECTED" },
      }),
      // Free the room back up so others can book it
      prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "AVAILABLE" },
      }),
    ]);
    await notify([booking.userId], {
      title: "Booking Not Approved",
      body: `Your booking for Room ${booking.room.number} was not approved. Please contact the hostel office or choose another room.`,
      link: "/student",
    });
  }

  return NextResponse.json({ success: true });
}
