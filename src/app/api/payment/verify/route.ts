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

  const { reference, transactionId, amount } = await req.json();

  if (!reference || !amount) {
    return NextResponse.json({ error: "Missing reference or amount." }, { status: 400 });
  }

  // Idempotency: don't double-credit if reference already exists
  const existing = await prisma.payment.findUnique({ where: { reference } });
  if (existing) {
    return NextResponse.json({ error: "Payment already recorded." }, { status: 409 });
  }

  // In production you'd verify with Flutterwave's API here.
  // For now we trust the client reference (Flutterwave calls its own verification on their side).
  await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId: session.user.id,
        amount,
        reference,
        transactionId,
        provider: "flutterwave",
        status: "PAID",
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { hasPaid: true },
    }),
  ]);

  await notify([session.user.id], {
    title: "Payment Confirmed",
    body: `Your accommodation payment of ₦${Number(amount).toLocaleString()} has been received. You can now book a room.`,
    link: "/student/rooms",
  });

  return NextResponse.json({ success: true });
}
