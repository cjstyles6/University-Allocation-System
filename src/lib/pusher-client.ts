// src/lib/pusher-client.ts
// Lazy-initialise Pusher only in the browser to avoid SSR CommonJS constructor crash
let _pusherClient: import("pusher-js").default | null = null;

export function getPusherClient() {
  if (typeof window === "undefined") return null;
  if (_pusherClient) return _pusherClient;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PusherJS = require("pusher-js");
  const Ctor = PusherJS.default ?? PusherJS;

  _pusherClient = new Ctor(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });

  return _pusherClient;
}
