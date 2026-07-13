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
  const { status } = await req.json();

  const valid = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  let releasedBookings: { userId: string }[] = [];

  const room = await prisma.$transaction(async (tx) => {
    const updatedRoom = await tx.room.update({ where: { id }, data: { status } });

    // Forcing a room available must also release any student still tied to
    // it, otherwise their dashboard keeps showing an active booking here.
    if (status === "AVAILABLE") {
      const activeBookings = await tx.booking.findMany({
        where: { roomId: id, status: { in: ["PENDING", "CONFIRMED"] } },
      });

      if (activeBookings.length > 0) {
        await tx.booking.updateMany({
          where: { id: { in: activeBookings.map((b) => b.id) } },
          data: { status: "CANCELLED" },
        });
        releasedBookings = activeBookings;
      }
    }

    return updatedRoom;
  });

  if (releasedBookings.length > 0) {
    await notify(releasedBookings.map((b) => b.userId), {
      title: "Booking Ended",
      body: `Your booking for Room ${room.number} (${room.hostelName}) has been ended by an administrator.`,
      link: "/student/rooms",
    });
  }

  return NextResponse.json({ success: true, room });
}
