import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

// Room allocations last exactly one semester (4 months). Once a booking's
// checkOut date passes, free the room and let the student book again.
export async function expireStaleBookings() {
  const stale = await prisma.booking.findMany({
    where: { status: { in: ["PENDING", "CONFIRMED"] }, checkOut: { lt: new Date() } },
    select: {
      id: true,
      roomId: true,
      userId: true,
      room: { select: { number: true, hostelName: true } },
    },
  });

  if (stale.length === 0) return;

  const bookingIds = stale.map((b) => b.id);
  const roomIds = stale.map((b) => b.roomId);

  await prisma.$transaction([
    prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status: "CANCELLED" },
    }),
    prisma.room.updateMany({
      where: { id: { in: roomIds }, status: "OCCUPIED" },
      data: { status: "AVAILABLE" },
    }),
  ]);

  await Promise.all(
    stale.map((b) =>
      notify([b.userId], {
        title: "Room Allocation Ended",
        body: `Your semester allocation for ${b.room.hostelName} Room ${b.room.number} has ended. Book a room again for the new semester.`,
        link: "/student/rooms",
      })
    )
  );
}
