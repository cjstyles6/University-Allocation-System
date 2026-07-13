import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Gate: student must have paid first ────────────────────────────
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.hasPaid) {
      return NextResponse.json(
        { error: "Please complete your accommodation payment before booking a room." },
        { status: 403 }
      );
    }

    // ── Gate: no existing active booking ──────────────────────────────
    const existingBooking = await prisma.booking.findFirst({
      where: { userId: session.user.id, status: { in: ["PENDING", "CONFIRMED"] } },
    });
    if (existingBooking) {
      return NextResponse.json(
        { error: "You already have an active booking. Cancel it first." },
        { status: 409 }
      );
    }

    const { roomId, semester, checkIn, checkOut } = await req.json();
    if (!roomId || !semester || !checkIn || !checkOut) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // ── Transactional booking ─────────────────────────────────────────
    const { booking, room } = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room || room.status !== "AVAILABLE") {
        throw new Error("This room is no longer available. Please choose another.");
      }

      const newBooking = await tx.booking.create({
        data: {
          userId: session.user.id,
          roomId,
          semester,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          status: "PENDING",       // Admin must confirm
          paymentStatus: "PAID",   // Already paid before booking
        },
      });

      // Immediately block the room so others can't book it while admin reviews
      await tx.room.update({
        where: { id: roomId },
        data: { status: "OCCUPIED" },
      });

      return { booking: newBooking, room };
    });

    // Notify the student their request is pending review, and notify admins
    // that a new allocation request needs their review — previously admins
    // only found out by manually checking the dashboard table.
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await Promise.all([
      notify([session.user.id], {
        title: "Booking Request Submitted",
        body: `Your request for Room ${room.number} (${room.hostelName}) has been submitted and is awaiting admin approval.`,
        link: "/student",
      }),
      notify(admins.map((u) => u.id), {
        title: "New Room Allocation Request",
        body: `${session.user.name} requested Room ${room.number} (${room.hostelName}).`,
        link: "/admin",
      }),
    ]);

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
