import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BookingClient from "./booking-client";
import { BedDouble, Bed } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { getBookingInProgress } from "@/lib/active-booking";

const typeIcon: Record<string, React.ElementType> = {
  SINGLE: Bed,
  DOUBLE: BedDouble,
};

const typeStyle: Record<string, { card: string; badge: string; label: string }> = {
  SINGLE: {
    card:  "border-violet-100 hover:border-violet-300 hover:shadow-violet-100",
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    label: "Single",
  },
  DOUBLE: {
    card:  "border-purple-100 hover:border-purple-300 hover:shadow-purple-100",
    badge: "bg-purple-50 text-purple-700 ring-purple-200",
    label: "Double",
  },
};

export default async function RoomsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const existingBooking = await getBookingInProgress(session.user.id);

  const rooms = await prisma.room.findMany({
    orderBy: [{ hostelName: "asc" }, { number: "asc" }],
  });

  const hostels = rooms.reduce<Record<string, typeof rooms>>((acc, room) => {
    if (!acc[room.hostelName]) acc[room.hostelName] = [];
    acc[room.hostelName].push(room);
    return acc;
  }, {});

  const flwKey = process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || "FLWPUBK_TEST-SANDBOXDEMOKEY-X";

  return (
    <div className="animate-in fade-in duration-300 space-y-10">
      {/* Page heading */}
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Browse Rooms</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select a room from any hostel below to begin your booking and payment.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(typeStyle).map(([type, s]) => (
          <span
            key={type}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${s.badge}`}
          >
            {s.label}
          </span>
        ))}
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-400 ring-1 ring-gray-200">
          Occupied
        </span>
      </div>

      {/* Already-booked banner */}
      {existingBooking && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-4">
          <p className="text-sm font-semibold text-violet-800">
            {existingBooking.status === "PENDING" ? "Booking awaiting approval: " : "Active booking: "}
            {existingBooking.room.hostelName} · Room {existingBooking.room.number}
          </p>
          <p className="text-xs text-violet-600 mt-0.5">
            {new Date(existingBooking.checkIn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            {" → "}
            {new Date(existingBooking.checkOut).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            {existingBooking.status === "PENDING"
              ? " · An admin still needs to confirm this booking."
              : " · Your room frees up automatically after this date."}
          </p>
        </div>
      )}

      {/* Hostel sections */}
      {Object.entries(hostels).map(([hostelName, hostelRooms]) => {
        const available = hostelRooms.filter((r) => r.status === "AVAILABLE").length;

        return (
          <div key={hostelName}>
            {/* Hostel header */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">{hostelName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {available} available · {hostelRooms.length - available} occupied
                </p>
              </div>
              {/* Occupancy bar */}
              <div className="[display:none] items-center gap-2.5 sm:[display:flex]">
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(available / hostelRooms.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {Math.round((available / hostelRooms.length) * 100)}%
                </span>
              </div>
            </div>

            {/* Room grid */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
                {hostelRooms.map((room) => {
                  const Icon = typeIcon[room.type] || Bed;
                  const style = typeStyle[room.type];
                  const isMine = existingBooking?.roomId === room.id;
                  const isOccupied = room.status === "OCCUPIED" && !isMine;
                  const canBook = !isOccupied && !isMine && !existingBooking;

                  return (
                    <div
                      key={room.id}
                      className={`relative flex flex-col items-center justify-center gap-1.5 p-4 transition-all ${
                        isMine
                          ? "bg-violet-50/60 ring-1 ring-inset ring-violet-200"
                          : isOccupied
                          ? "bg-gray-50 cursor-not-allowed"
                          : `bg-card cursor-pointer hover:bg-violet-50/50 ${style.card}`
                      }`}
                    >
                      {/* Room icon */}
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${
                          isMine
                            ? "bg-violet-100 ring-violet-200"
                            : isOccupied
                            ? "bg-gray-100 ring-gray-200"
                            : style.badge
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isMine ? "text-violet-600" : isOccupied ? "text-gray-300" : ""}`} />
                      </div>

                      {/* Room number */}
                      <p className={`text-[13px] font-bold tracking-wide ${isMine ? "text-violet-800" : isOccupied ? "text-gray-300" : "text-foreground"}`}>
                        {room.number}
                      </p>

                      {/* Type + price or occupied label */}
                      {isMine ? (
                        <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200">
                          {existingBooking?.status === "PENDING" ? "Pending Approval" : "Your Room"}
                        </span>
                      ) : isOccupied ? (
                        <span className="text-[10px] font-medium text-gray-300 uppercase tracking-wider">Taken</span>
                      ) : (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${style.badge}`}>
                          {style.label}
                        </span>
                      )}

                      {/* Booking trigger */}
                      {canBook && (
                        <BookingClient
                          roomId={room.id}
                          roomNumber={room.number}
                          hostelName={hostelName}
                          price={room.price}
                          type={room.type}
                          userEmail={session.user.email ?? ""}
                          userName={session.user.name ?? ""}
                          flwKey={flwKey}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
