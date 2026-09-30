const CACHE_NAME = "trivial-electricista-db6";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

// FIX AISLADO: solo corrige la presentación de las tarjetas del visor de BD.
const DB_CARD_FIX = `<style id="db-cards-contrast-fix">
#dbPaginatedHost [style*="background:#fafafa"]{
  background:#21170f !important;
  color:#ffffff !important;
  border-color:#8d652d !important;
}
#dbPaginatedHost [style*="background:#fafafa"] *{
  color:#ffffff !important;
}
#dbPaginatedHost .db-row-actions button,
#dbPaginatedHost button[data-export]{
  background:#555 !important;
  color:#fff !important;
  border-color:#777 !important;
}
</style>`;

function transformHTML(html){
  // Además de CSS, corregimos el estilo inline que crea las tarjetas.
  html = html.replace(/background:#fafafa/g, 'background:#21170f;color:#fff');
  return html.includes('id="db-cards-contrast-fix"')
    ? html
    : html.replace(/<\\/head>/i, DB_CARD_FIX + "</head>");
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      const type = response.headers.get("content-type") || "";
      if (event.request.mode === "navigate" && response.ok && type.includes("text/html")) {
        const html = await response.text();
        const fixed = transformHTML(html);
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        return new Response(fixed, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      }
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(()=>{});
      return response;
    } catch (err) {
      const cached = await caches.match(event.request);
      if(cached) return cached;
      return caches.match("./index.html");
    }
  })());
});
