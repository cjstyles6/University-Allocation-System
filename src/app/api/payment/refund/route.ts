import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId, action } = await req.json();

  if (!bookingId || !["refund", "rebook"].includes(action)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId: session.user.id },
      include: { room: true },
    });

    if (!booking || booking.status !== "REJECTED") {
      return NextResponse.json({ error: "Booking not found or not rejected." }, { status: 404 });
    }

    if (action === "rebook") {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });
      await notify([session.user.id], {
        title: "Ready to Rebook",
        body: "You can now select another room. Your previous payment is still valid.",
        link: "/student/rooms",
      });
      return NextResponse.json({ success: true });
    }

    // Action is REFUND
    const payment = await prisma.payment.findFirst({
      where: { userId: session.user.id, status: "PAID" },
      orderBy: { createdAt: "desc" },
    });

    if (!payment || !payment.transactionId) {
      return NextResponse.json({ error: "No successful transaction found to refund." }, { status: 404 });
    }

    // Call Flutterwave Refund API
    const flwSecretKey = process.env.FLW_SECRET_KEY;
    if (!flwSecretKey) {
      console.error("FLW_SECRET_KEY is missing in environment variables");
      return NextResponse.json({ error: "Refund service unavailable. Please contact support." }, { status: 500 });
    }

    const flwResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${payment.transactionId}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${flwSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comments: "Customer requested refund for rejected room booking.",
      }),
    });

    const flwData = await flwResponse.json();

    if (!flwResponse.ok) {
      console.error("Flutterwave Refund Error:", flwData);
      return NextResponse.json({ error: flwData.message || "Flutterwave refund failed." }, { status: 400 });
    }

    // Update DB on successful refund
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { hasPaid: false },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      }),
    ]);

    await notify([session.user.id], {
      title: "Refund Processed",
      body: `Your refund for Room ${booking.room.number} has been initiated successfully.`,
      link: "/student",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Refund Route Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
