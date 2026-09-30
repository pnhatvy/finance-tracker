const CACHE_NAME = "vys-finance-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Chỉ xử lý các request tải tài nguyên (GET)
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Có mạng: Tải bản mới nhất và lưu lại vào cache
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Chỉ cache các request hợp lệ từ http/https
          if (event.request.url.startsWith("http")) {
            cache.put(event.request, resClone);
          }
        });
        return response;
      })
      .catch(() => {
        // Mất mạng: Trả về file đã lưu trong cache
        return caches.match(event.request);
      }),
  );
});
