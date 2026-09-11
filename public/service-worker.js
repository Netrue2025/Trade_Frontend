const CACHE_VERSION = "netruefi-pwa-v10";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  OFFLINE_URL,
  "/config.js",
  "/styles.css",
  "/app.js",
  "/components/signal-page.js",
  "/vendor/lightweight-charts.js",
  "/favicon.png",
  "/og-image-whatsapp.jpg",
  "/services/default-digital-service.png",
  "/netruefi-logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/badge-96.png",
  "/sounds/alert.mp3",
];
const SAFE_ROUTE_PREFIXES = [
  "/",
  "/?tab=home",
  "/?tab=wallet",
  "/?tab=history",
  "/?tab=signals",
  "/?tab=store",
  "/?tab=referral",
  "/?tab=quest",
  "/?tab=settings",
  "/?tab=services",
  "/?tab=admin",
  "/?tab=adminQuests",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== APP_SHELL_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isSensitiveRequest(url) {
  return url.pathname.startsWith("/api");
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    return caches.match(OFFLINE_URL);
  }
}

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(APP_SHELL_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstStatic(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(APP_SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request);
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || isSensitiveRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }
  if (url.pathname === "/config.js") {
    event.respondWith(networkFirstStatic(request));
    return;
  }
  if ([".js", ".css"].some((extension) => url.pathname.endsWith(extension))) {
    event.respondWith(networkFirstStatic(request));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  event.respondWith(cacheFirstStatic(request));
});

function normalizeRoute(route) {
  const raw = String(route || "/?tab=home");
  let path = "/?tab=home";
  try {
    const parsed = new URL(raw, self.location.origin);
    path = `${parsed.pathname || "/"}${parsed.search || ""}`;
  } catch {
    path = "/?tab=home";
  }
  return SAFE_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}&`))
    ? path
    : "/?tab=home";
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = String(payload.title || "NetrueFi");
  const options = {
    body: String(payload.body || "You have a new update."),
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/badge-96.png",
    tag: payload.tag || undefined,
    renotify: false,
    data: {
      route: normalizeRoute(payload.data && payload.data.route),
      type: payload.data && payload.data.type,
      entityId: payload.data && payload.data.entityId,
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const route = normalizeRoute(event.notification.data && event.notification.data.route);
  const targetUrl = new URL(route, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
