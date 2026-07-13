"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { User, Lock, Save, Loader2, Bell, Shield } from "lucide-react";
import { BackButton } from "@/components/back-button";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("profile"); // 'profile' or 'preferences'

  useEffect(() => {
    if (window.location.hash === "#preferences") {
      setActiveTab("preferences");
    }
  }, []);

  const [profileData, setProfileData] = useState({
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileData.name, email: profileData.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await update({ name: profileData.name, email: profileData.email });
      toast.success("Profile updated successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Password changed successfully.");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleColor: Record<string, string> = {
    ADMIN:   "text-violet-700 bg-violet-50 ring-violet-200",
    STAFF:   "text-blue-700 bg-blue-50 ring-blue-200",
    STUDENT: "text-emerald-700 bg-emerald-50 ring-emerald-200",
  };
  const role = session?.user?.role ?? "STUDENT";

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <BackButton />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your profile and preferences.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-56 flex flex-row md:flex-col gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === "profile" 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" /> Profile Details
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === "security" 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Shield className="h-4 w-4" /> Security
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === "preferences" 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Bell className="h-4 w-4" /> Preferences
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Avatar + Role */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-primary/20">
                  {(session?.user?.name ?? "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{session?.user?.name}</p>
                  <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                  <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${roleColor[role]}`}>
                    {role}
                  </span>
                </div>
              </div>

              {/* Profile form */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 border-b border-border px-6 py-4 bg-secondary/20">
                  <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
                </div>
                <form onSubmit={handleProfileSave} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Full name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Email address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition-all hover:bg-primary/90 disabled:opacity-60"
                    >
                      {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {profileLoading ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 border-b border-border px-6 py-4 bg-secondary/20">
                  <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
                </div>
                <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Current password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">New password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Min. 8 characters"
                        className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Confirm password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Repeat new password"
                        className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition-all hover:bg-primary/90 disabled:opacity-60"
                    >
                      {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      {passwordLoading ? "Saving…" : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 border-b border-border px-6 py-4 bg-secondary/20">
                  <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notifications</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Receive an email when your booking status changes.</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" className="peer sr-only" defaultChecked />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Marketing Updates</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Receive news about new hostel openings.</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" className="peer sr-only" />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
