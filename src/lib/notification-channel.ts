// Shared constants only — safe to import from both server routes and
// client components. Keep server-only code (prisma, pusher server SDK)
// out of this file so client bundles never pull them in.
export const NOTIFICATIONS_CHANNEL = "app-notifications";
export const NOTIFICATION_EVENT = "notification";
