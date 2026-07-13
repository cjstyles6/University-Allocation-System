import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { number, hostelName, type, price } = await req.json();

  if (!number || !hostelName || !type || !price) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const existing = await prisma.room.findUnique({ where: { number } });
  if (existing) {
    return NextResponse.json({ error: `Room number ${number} already exists.` }, { status: 409 });
  }

  const room = await prisma.room.create({
    data: {
      number,
      hostelName,
      type,
      price: Number(price),
      images: [],
      status: "AVAILABLE",
    },
  });

  return NextResponse.json({ success: true, room }, { status: 201 });
}
