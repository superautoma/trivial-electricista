const CACHE_NAME = "trivial-electricista-db5";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

// Corrección aislada del visor de preguntas de la base de datos.
// No modifica la partida, el tablero, el dado ni la lógica del editor.
const DB_CARD_FIX = `<style id="db-cards-contrast-fix">
/* Tarjetas creadas por el visor paginado */
#dbPaginatedHost .db-row-card,
#dbPaginatedHost > div > div {
  background:#21170f !important;
  color:#ffffff !important;
  border-color:#8d652d !important;
}
#dbPaginatedHost .db-row-card *,
#dbPaginatedHost > div > div * {
  color:#ffffff !important;
}
#dbPaginatedHost .db-row-actions button,
#dbPaginatedHost button[data-export] {
  background:#555555 !important;
  color:#ffffff !important;
  border-color:#777777 !important;
}
</style>`;

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

      // Solo transformamos la navegación HTML. Los demás recursos quedan intactos.
      if (event.request.mode === "navigate" && response.ok && type.includes("text/html")) {
        const html = await response.text();
        const fixed = html.includes('id="db-cards-contrast-fix"')
          ? html
          : html.replace(/<\/head>/i, DB_CARD_FIX + "</head>");
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
      return caches.match(event.request).then(r => r || caches.match("./index.html"));
    }
  })());
});
