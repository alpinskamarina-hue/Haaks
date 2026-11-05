// Haaks service worker: shows push notifications about new jobs and the number on the app icon.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title || "Haaks", {
        body: data.body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: data.tag || "haaks-feed",
        renotify: true,
        data: { url: data.url || "/dashboard/leads/feed" },
      });
      if (typeof data.count === "number" && self.navigator.setAppBadge) {
        await self.navigator.setAppBadge(data.count).catch(() => {});
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/dashboard/leads/feed", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) {
        await open.focus();
        return open.navigate(url);
      }
      return self.clients.openWindow(url);
    })(),
  );
});

// «Мои карты» must open at the till without internet: the cards page is fetched from the network
// when possible and kept; without a connection the kept copy is shown. Next.js script files have
// a hash in their name, so they are kept once and reused (cards page needs them offline).
const CARDS_CACHE = "haaks-cards-v1";
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate" && url.pathname === "/dashboard/cards") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CARDS_CACHE);
        try {
          const res = await fetch(req);
          if (res.ok && !res.redirected) await cache.put("/dashboard/cards", res.clone());
          return res;
        } catch {
          return (await cache.match("/dashboard/cards")) || Response.error();
        }
      })(),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CARDS_CACHE);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) await cache.put(req, res.clone());
        return res;
      })(),
    );
  }
});
