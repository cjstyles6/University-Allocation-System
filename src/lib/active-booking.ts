import { prisma } from "@/lib/prisma";

// A confirmed, unexpired booking — the student actually occupies this room.
export function getActiveBooking(userId: string) {
  return prisma.booking.findFirst({
    where: { userId, status: "CONFIRMED", checkOut: { gt: new Date() } },
    include: { room: { select: { number: true, type: true, hostelName: true, price: true } } },
  });
}

// Any booking still holding a room slot for this student, confirmed or
// awaiting admin approval. Use this for "do you already have a room in
// flight" checks (dashboard display, blocking a second booking) — it
// matches the same rule /api/bookings enforces, so the UI never shows
// "no booking" while the API still rejects a new one as a duplicate.
export function getBookingInProgress(userId: string) {
  return prisma.booking.findFirst({
    where: { userId, status: { in: ["PENDING", "CONFIRMED"] }, checkOut: { gt: new Date() } },
    include: { room: { select: { number: true, type: true, hostelName: true, price: true } } },
  });
}
