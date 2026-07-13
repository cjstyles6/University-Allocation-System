"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner";
import { ComplaintCategory } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  Wrench,
  Zap,
  Droplets,
  Wifi,
  Sparkles,
  MoreHorizontal,
  Loader2,
  Check,
  X,
  Lock,
  MapPin,
} from "lucide-react";

const CATEGORIES: { value: ComplaintCategory; label: string; icon: React.ElementType }[] = [
  { value: "MAINTENANCE", label: "Maintenance", icon: Wrench },
  { value: "ELECTRICITY", label: "Electricity", icon: Zap },
  { value: "WATER", label: "Water", icon: Droplets },
  { value: "INTERNET", label: "Internet", icon: Wifi },
  { value: "CLEANLINESS", label: "Cleanliness", icon: Sparkles },
  { value: "OTHER", label: "Other", icon: MoreHorizontal },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "MAINTENANCE" as ComplaintCategory,
};

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-xs transition-all duration-200 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10";

export function NewComplaintModal({
  disabled = false,
  roomLabel,
}: {
  disabled?: boolean;
  roomLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleOpenChange = (next: boolean) => {
    if (loading) return;
    setOpen(next);
    if (!next) {
      setFormData(EMPTY_FORM);
      setImageUrl(null);
      setSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, image: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit complaint");

      setSuccess(true);
      setTimeout(() => {
        setLoading(false);
        handleOpenChange(false);
        toast.success("Complaint submitted. Staff have been notified!");
        router.refresh();
      }, 900);
    } catch (err) {
      setLoading(false);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title="Book a room before filing a complaint"
        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground/60"
      >
        <Lock className="h-3.5 w-3.5" />
        New Complaint
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="group inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/15 hover:shadow-sm active:scale-95">
          <PlusCircle className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
          New Complaint
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={!loading}
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        onInteractOutside={(e) => loading && e.preventDefault()}
      >
        <div className="bg-gradient-to-br from-violet-50 to-transparent px-6 pt-6 pb-4 dark:from-violet-950/30">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Report an Issue</DialogTitle>
            <DialogDescription>
              Submit a new complaint and staff will be notified instantly.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-5 overflow-y-auto px-6 pb-6 pt-1">
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-300 [animation-delay:60ms]">
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Issue Title</label>
            <input
              type="text"
              required
              autoFocus
              className={fieldClass}
              placeholder="E.g. Leaking pipe in bathroom"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-300 [animation-delay:120ms]">
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(({ value, label, icon: Icon }) => {
                const selected = formData.category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: value })}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-[11px] font-semibold transition-all duration-200 active:scale-95 ${
                      selected
                        ? "border-primary/40 bg-primary/10 text-primary shadow-sm ring-2 ring-primary/20"
                        : "border-border bg-background text-muted-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-transform duration-200 ${selected ? "scale-110" : ""}`}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {roomLabel && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-300 [animation-delay:180ms]">
              <label className="mb-1.5 block text-xs font-semibold text-foreground">Room</label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {roomLabel}
              </div>
            </div>
          )}

          <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-300 [animation-delay:240ms]">
            <label className="mb-1.5 block text-xs font-semibold text-foreground">Description</label>
            <textarea
              required
              rows={3}
              className={`${fieldClass} resize-none`}
              placeholder="Provide more details about the issue..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards duration-300 [animation-delay:300ms]">
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Evidence <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            {!imageUrl ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm transition-colors duration-200 hover:border-primary/30 hover:bg-primary/5">
                <UploadDropzone
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    setImageUrl(res[0].url);
                    toast.success("Image attached!");
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`Upload failed: ${error.message}`);
                  }}
                  className="ut-active:border-primary"
                />
              </div>
            ) : (
              <div className="relative inline-block animate-in fade-in-0 zoom-in-95 rounded-lg border border-border bg-muted/30 p-2 duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Uploaded evidence" className="max-h-36 rounded-md object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm transition-all duration-200 hover:bg-rose-600 hover:scale-110 active:scale-90"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards [animation-delay:360ms] ${
              success
                ? "bg-emerald-500 shadow-emerald-200"
                : "bg-primary shadow-violet-200 hover:bg-primary/90 hover:shadow-md hover:shadow-violet-200 disabled:opacity-80"
            }`}
          >
            {success ? (
              <span className="flex items-center gap-2 animate-in zoom-in-50 duration-300">
                <Check className="h-4 w-4" /> Submitted!
              </span>
            ) : loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </span>
            ) : (
              "Submit Complaint"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
