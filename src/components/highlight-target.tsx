"use client";

import { useEffect } from "react";

// Scrolls a row into view and briefly highlights it when navigated to via
// a notification link like /admin/complaints?complaint=<id>.
export function HighlightTarget({ id }: { id?: string }) {
  useEffect(() => {
    if (!id) return;
    const el = document.getElementById(`complaint-${id}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary", "bg-primary/5");
    const timeout = setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary", "bg-primary/5");
    }, 2500);

    return () => clearTimeout(timeout);
  }, [id]);

  return null;
}
