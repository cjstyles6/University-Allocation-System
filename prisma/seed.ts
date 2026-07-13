import { PrismaClient, RoomType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const hostels = [
  { name: "Claire Hostel", rooms: 30 },
  { name: "Jamilah Hostel", rooms: 30 },
  { name: "Kwame Hostel", rooms: 30 },
];

// DOUBLE is a whole-room price split between 2 occupants (₦125,000/person).
const prices: Record<RoomType, number> = {
  SINGLE: 150000,
  DOUBLE: 250000,
};

function getRoomType(roomNumber: number): RoomType {
  return roomNumber <= 15 ? "SINGLE" : "DOUBLE";
}

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Clear existing rooms ─────────────────────────────────────────────────
  await prisma.room.deleteMany();
  console.log("  ✓ Cleared existing rooms");

  // ─── Seed rooms ───────────────────────────────────────────────────────────
  const roomData = hostels.flatMap(({ name, rooms }) =>
    Array.from({ length: rooms }, (_, i) => {
      const n = i + 1;
      const type = getRoomType(n);
      return {
        number: `${name.split(" ")[0].charAt(0)}-${String(n).padStart(2, "0")}`,
        hostelName: name,
        type,
        price: prices[type],
        images: [],
        status: "AVAILABLE" as const,
      };
    })
  );

  await prisma.room.createMany({ data: roomData });
  console.log(`  ✓ Seeded ${roomData.length} rooms across ${hostels.length} hostels`);

  // ─── Seed admin account ───────────────────────────────────────────────────
  const adminEmail = "admin@hostel.edu";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const hashed = await bcrypt.hash("Admin@123456", 12);
    await prisma.user.create({
      data: {
        name: "System Administrator",
        email: adminEmail,
        password: hashed,
        role: "ADMIN",
      },
    });
    console.log(`  ✓ Admin account created: ${adminEmail} / Admin@123456`);
  } else {
    console.log("  ℹ Admin account already exists — skipping");
  }

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
