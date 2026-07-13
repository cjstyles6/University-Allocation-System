"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Bed, AlertCircle, Users, Wrench,
  GraduationCap, ChevronRight, UserCircle, CheckSquare,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Bed, AlertCircle, Users, Wrench, GraduationCap, UserCircle, CheckSquare,
};

const roleLabel: Record<string, string> = {
  ADMIN: "Administrator",
  STAFF: "Maintenance Staff",
  STUDENT: "Student",
};

export interface LinkItem { label: string; href: string; icon: string; }

// Shared nav content rendered both in the always-visible desktop rail and
// inside the mobile Sheet drawer, so the two never drift out of sync.
export function SidebarNav({
  links,
  role,
  userName,
  onNavigate,
}: {
  links: LinkItem[];
  role: string;
  userName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  // Pick the single most specific (longest) matching link, so a sibling
  // route that happens to be a prefix of another (e.g. /staff vs
  // /staff/rooms) doesn't get marked active alongside it.
  const activeHref = links.reduce<string | null>((best, link) => {
    const matches = pathname === link.href || pathname.startsWith(`${link.href}/`);
    if (!matches) return best;
    if (!best || link.href.length > best.length) return link.href;
    return best;
  }, null);

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-200 bg-violet-50">
          <GraduationCap className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground">Hostel Portal</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
        <p className="mb-2 px-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {roleLabel[role] || role}
        </p>

        {links.map((link) => {
          const Icon = iconMap[link.icon] || LayoutDashboard;
          const isActive = link.href === activeHref;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`group flex items-center justify-between rounded-md px-2.5 py-2 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"}`} />
                {link.label}
              </div>
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary/50" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer — compact, links to profile */}
      <div className="border-t border-border p-3">
        <Link
          href="/profile"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-secondary"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground leading-none">{userName}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Profile & Settings</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function Sidebar({ links, role, userName }: { links: LinkItem[]; role: string; userName: string }) {
  return (
    <div className="[display:none] w-56 flex-col border-r border-border bg-card md:[display:flex]">
      <SidebarNav links={links} role={role} userName={userName} />
    </div>
  );
}
