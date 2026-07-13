import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { BackButton } from "@/components/back-button";
import { CreateStaffModal } from "./create-staff-modal";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bookings: true, complaints: true } },
    },
  });

  const roleBadge: Record<string, string> = {
    ADMIN:   "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    STAFF:   "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    STUDENT: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">User Management</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{users.length} total users</p>
          </div>
        </div>
        <CreateStaffModal />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Complaints</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-secondary/20">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleBadge[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center text-muted-foreground">{u._count.bookings}</td>
                  <td className="px-6 py-3 text-center text-muted-foreground">{u._count.complaints}</td>
                  <td className="px-6 py-3 text-muted-foreground">{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
