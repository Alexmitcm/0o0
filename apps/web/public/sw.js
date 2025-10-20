self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", async () => {
  // Unregister the service worker
  try {
    await self.registration.unregister();
  } catch (error) {
    console.log("Service worker unregister failed:", error);
  }

  // Delete all caches
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  } catch (error) {
    console.log("Cache deletion failed:", error);
  }

  // Reload all clients
  try {
    const clientsList = await clients.matchAll({ type: "window" });
    for (const client of clientsList) {
      if (client.navigate) {
        client.navigate(client.url);
      }
    }
  } catch (error) {
    console.log("Client navigation failed:", error);
  }
});

// Handle fetch events properly
self.addEventListener("fetch", (event) => {
  // Just pass through without caching for now
  event.respondWith(fetch(event.request));
});
