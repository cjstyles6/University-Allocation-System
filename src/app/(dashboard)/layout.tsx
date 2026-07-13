import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { prisma } from "@/lib/prisma";
import { RejectedBookingModal } from "@/components/rejected-booking-modal";
import { expireStaleBookings } from "@/lib/booking-lifecycle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  await expireStaleBookings();

  const role = session.user.role;
  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";

  // Check for rejected bookings that need attention (for students only)
  let rejectedBookingId: string | null = null;
  if (role === "STUDENT") {
    const rejectedBooking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        status: "REJECTED",
        paymentStatus: "PAID",
      },
      select: { id: true },
    });
    if (rejectedBooking) {
      rejectedBookingId = rejectedBooking.id;
    }
  }

  const adminLinks = [
    { label: "Overview", href: "/admin", icon: "LayoutDashboard" },
    { label: "Rooms", href: "/admin/rooms", icon: "Bed" },
    { label: "Bookings", href: "/admin/bookings", icon: "CheckSquare" },
    { label: "Complaints", href: "/admin/complaints", icon: "AlertCircle" },
    { label: "Users", href: "/admin/users", icon: "Users" },
  ];

  const staffLinks = [
    { label: "My Tasks", href: "/staff", icon: "LayoutDashboard" },
    { label: "Rooms & Students", href: "/staff/rooms", icon: "Bed" },
  ];

  const studentLinks = [
    { label: "Dashboard", href: "/student", icon: "LayoutDashboard" },
    { label: "Book a Room", href: "/student/rooms", icon: "Bed" },
    { label: "My Complaints", href: "/student/complaints", icon: "AlertCircle" },
    { label: "Profile", href: "/profile", icon: "UserCircle" },
  ];

  const links =
    role === "ADMIN" ? adminLinks : role === "STAFF" ? staffLinks : studentLinks;

  const pageTitles: Record<string, string> = {
    ADMIN: "Admin Control Panel",
    STAFF: "Staff Dashboard",
    STUDENT: "Student Portal",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar links={links} role={role} userName={userName} />
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <DashboardHeader
          userName={userName}
          userEmail={userEmail}
          userRole={role}
          pageTitle={pageTitles[role] || "Dashboard"}
          links={links}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
      {rejectedBookingId && <RejectedBookingModal bookingId={rejectedBookingId} />}
    </div>
  );
}
