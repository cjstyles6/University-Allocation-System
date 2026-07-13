import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { NOTIFICATIONS_CHANNEL, NOTIFICATION_EVENT } from "@/lib/notification-channel";

// Persists a notification for each user and pings them live over Pusher.
// Clients listen on NOTIFICATIONS_CHANNEL and just refetch their own
// notifications when they hear the event — cheap, and avoids needing a
// private per-user channel for what's a small, infrequent event.
export async function notify(
  userIds: string[],
  data: { title: string; body: string; link?: string }
) {
  if (userIds.length === 0) return;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...data })),
  });

  await pusherServer.trigger(NOTIFICATIONS_CHANNEL, NOTIFICATION_EVENT, {});
}
