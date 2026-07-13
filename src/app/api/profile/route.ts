import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, currentPassword, newPassword } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updateData: Record<string, string> = {};

  if (name && name !== user.name) updateData.name = name;
  if (email && email !== user.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    updateData.email = email;
  }

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Current password required." }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.password ?? "");
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ message: "No changes." });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ success: true, user: updated });
}
