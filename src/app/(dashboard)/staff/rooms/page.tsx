import { prisma } from "@/lib/prisma";

export default async function StaffRoomsPage() {
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
    OCCUPIED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    MAINTENANCE: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  };

  const totalAvailable = rooms.filter((r) => r.status === "AVAILABLE").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Rooms & Students</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {rooms.length} total rooms · {totalAvailable} available across {Object.keys(hostels).length} hostels
        </p>
      </div>

      {Object.entries(hostels).map(([hostelName, hostelRooms]) => (
        <div key={hostelName} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border bg-secondary/20 px-6 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{hostelName}</h3>
            <span className="text-xs text-muted-foreground">
              {hostelRooms.filter((r) => r.status === "AVAILABLE").length} available / {hostelRooms.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hostelRooms.map((room) => (
                  <tr key={room.id} className="transition-colors hover:bg-secondary/20">
                    <td className="px-6 py-3 font-mono font-semibold text-foreground">{room.number}</td>
                    <td className="px-6 py-3 text-muted-foreground">{room.type}</td>
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
