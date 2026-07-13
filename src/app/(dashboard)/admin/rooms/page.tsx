import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import AdminRoomActions from "./room-actions";
import { BackButton } from "@/components/back-button";

export default async function AdminRoomsPage() {
  const rooms = await prisma.room.findMany({
    orderBy: [{ hostelName: "asc" }, { number: "asc" }],
    include: {
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  const hostels = rooms.reduce<Record<string, typeof rooms>>((acc, r) => {
    if (!acc[r.hostelName]) acc[r.hostelName] = [];
    acc[r.hostelName].push(r);
    return acc;
  }, {});

  const statusStyle: Record<string, string> = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    OCCUPIED:  "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    MAINTENANCE: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Room Management</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{rooms.length} total rooms across {Object.keys(hostels).length} hostels</p>
          </div>
        </div>
        <Link
          href="/admin/rooms/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition-all hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" /> Add Room
        </Link>
      </div>

      {Object.entries(hostels).map(([hostelName, hostelRooms]) => (
        <div key={hostelName} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border bg-secondary/20 px-6 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{hostelName}</h3>
            <span className="text-xs text-muted-foreground">
              {hostelRooms.filter(r => r.status === "AVAILABLE").length} available / {hostelRooms.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Booked By</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hostelRooms.map((room) => (
                  <tr key={room.id} className="transition-colors hover:bg-secondary/20">
                    <td className="px-6 py-3 font-mono font-semibold text-foreground">{room.number}</td>
                    <td className="px-6 py-3 text-muted-foreground">{room.type}</td>
                    <td className="px-6 py-3 text-foreground font-medium">₦{room.price.toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[room.status]}`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {room.bookings[0] ? (
                        <div>
                          <p className="font-medium text-foreground">{room.bookings[0].user.name}</p>
                          <p className="text-xs text-muted-foreground">{room.bookings[0].user.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <AdminRoomActions roomId={room.id} currentStatus={room.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
