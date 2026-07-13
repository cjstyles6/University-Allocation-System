"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";
import { BackButton } from "@/components/back-button";

export default function NewRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    hostelName: "Claire Hostel",
    number: "",
    type: "SINGLE",
    price: "150000",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      toast.success("Room created successfully!");
      router.push("/admin/rooms");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    // DOUBLE is a whole-room price split between 2 occupants (125/person).
    const newPrice = type === "DOUBLE" ? "250000" : "150000";
    setForm({ ...form, type, price: newPrice });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Add New Room</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Create a new room available for booking.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4 bg-secondary/20">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Room Details</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground tracking-wide">Hostel</label>
              <select
                required
                value={form.hostelName}
                onChange={(e) => setForm({ ...form, hostelName: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary/60 focus:outline-none"
              >
                <option value="Claire Hostel">Claire Hostel</option>
                <option value="Jamilah Hostel">Jamilah Hostel</option>
                <option value="Kwame Hostel">Kwame Hostel</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground tracking-wide">Room Number</label>
              <input
                type="text"
                required
                placeholder="e.g. C-31"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground tracking-wide">Room Type</label>
              <select
                required
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary/60 focus:outline-none"
              >
                <option value="SINGLE">Single</option>
                <option value="DOUBLE">Double</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground tracking-wide">Price (₦) per Semester</label>
              <input
                type="number"
                required
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:border-primary/60 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
