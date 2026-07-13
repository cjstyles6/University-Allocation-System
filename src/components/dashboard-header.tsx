"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Bell, Settings, LogOut, User, ChevronDown, Menu } from "lucide-react";
import { getPusherClient } from "@/lib/pusher-client";
import { NOTIFICATIONS_CHANNEL, NOTIFICATION_EVENT } from "@/lib/notification-channel";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav, type LinkItem } from "@/components/Sidebar";

interface Notification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface DashboardHeaderProps {
  userName: string;
  userEmail: string;
  userRole: string;
  pageTitle: string;
  links: LinkItem[];
}

export function DashboardHeader({ userName, userEmail, userRole, pageTitle, links }: DashboardHeaderProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch on mount, then live-refetch whenever anyone triggers a
  // notification event — the bell and any visible complaint list stay
  // current with no manual reload needed.
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();

    const client = getPusherClient();
    if (!client) return;

    const channel = client.subscribe(NOTIFICATIONS_CHANNEL);
    const handleEvent = () => {
      fetchNotifications();
      router.refresh();
    };
    channel.bind(NOTIFICATION_EVENT, handleEvent);

    return () => {
      channel.unbind(NOTIFICATION_EVENT, handleEvent);
      client.unsubscribe(NOTIFICATIONS_CHANNEL);
    };
  }, [router]);

  const handleOpenNotifications = async () => {
    setNotifOpen((v) => !v);
    if (!notifOpen && unreadCount > 0) {
      try {
        await fetch("/api/notifications", { method: "PATCH" });
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (err) {
        console.error("Failed to mark read", err);
      }
    }
  };

  const handleNotificationClick = (n: Notification) => {
    setNotifOpen(false);
    if (n.link) router.push(n.link);
  };

  const roleColor: Record<string, string> = {
    ADMIN: "text-violet-700 bg-violet-50 ring-violet-200",
    STAFF: "text-blue-700 bg-blue-50 ring-blue-200",
    STUDENT: "text-emerald-700 bg-emerald-50 ring-emerald-200",
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 relative z-40 md:px-6">
      {/* Left: mobile nav trigger + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="-ml-1 flex h-8 w-8 [display:flex] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:[display:none]"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </button>
        <h1 className="text-sm font-semibold text-foreground">{pageTitle}</h1>
        <span className={`[display:none] items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 sm:[display:inline-flex] ${roleColor[userRole] || ""}`}>
          {userRole}
        </span>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav
            links={links}
            role={userRole}
            userName={userName}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotifications}
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-lg shadow-black/5 animate-in fade-in zoom-in-95 duration-150 max-h-96 flex flex-col">
              <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      disabled={!n.link}
                      className={`w-full rounded-lg p-3 text-left text-sm transition-colors ${n.read ? "bg-transparent" : "bg-primary/5"} ${n.link ? "cursor-pointer hover:bg-secondary" : "cursor-default"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold ${n.read ? "text-foreground" : "text-primary"}`}>{n.title}</p>
                        {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-menu-btn"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="[display:none] max-w-[120px] truncate text-sm font-medium sm:[display:block]">{userName}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-border bg-card shadow-lg shadow-black/5 animate-in fade-in zoom-in-95 duration-150">
              {/* User info */}
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>

              {/* Links */}
              <div className="p-1.5">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Profile
                </Link>
                <Link
                  href="/profile#preferences"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Preferences
                </Link>
              </div>

              <div className="border-t border-border p-1.5">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
