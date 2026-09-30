const CACHE_NAME = "trivial-electricista-db4";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

// Corrección aislada para el visor paginado de preguntas.
// No modifica la partida ni el editor de preguntas: solo evita que las
// tarjetas generadas dinámicamente queden blancas con texto blanco.
const DB_CARD_FIX = `<style id="db-cards-contrast-fix">
#dbPaginatedHost > div[style*="display:grid"] > div {
  background:#21170f !important;
  color:#fff !important;
  border:1px solid #8d652d !important;
}
#dbPaginatedHost > div[style*="display:grid"] > div b,
#dbPaginatedHost > div[style*="display:grid"] > div span,
#dbPaginatedHost > div[style*="display:grid"] > div div {
  color:inherit !important;
}
#dbPaginatedHost .db-row-actions button {
  background:#555 !important;
  color:#fff !important;
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

      // Solo se transforma HTML de navegación. El resto de recursos queda intacto.
      if (event.request.mode === "navigate" && response.ok && type.includes("text/html")) {
        const html = await response.text();
        const fixed = html.includes('id="db-cards-contrast-fix"')
          ? html
          : html.replace(/<\/head>/i, DB_CARD_FIX + "</head>");
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        const finalResponse = new Response(fixed, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, finalResponse.clone())).catch(()=>{});
        return finalResponse;
      }

      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(()=>{});
      return response;
    } catch (err) {
      return caches.match(event.request).then(r => r || caches.match("./index.html"));
    }
  })());
});
