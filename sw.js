const CACHE_NAME = "trivial-electricista-db7";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

const DB_LAYOUT_FIX = `<style id="db-layout-fix">
#databaseModal .panel{width:100%;max-width:1100px;overflow-x:hidden}
#databaseModal #dbPaginatedHost{width:100%;max-width:100%;margin:12px 0;min-width:0;overflow-x:hidden}
#databaseModal #dbPaginatedHost > div{width:100%;max-width:100%;min-width:0}
#databaseModal .db-row-card,#databaseModal #dbPaginatedHost > div > div{max-width:100%;min-width:0;overflow-wrap:anywhere}
@media(max-width:700px){
 #databaseModal{padding:8px}
 #databaseModal .panel{width:100%;max-width:100%;padding:12px;border-radius:12px}
 #databaseModal input#dbSearch{min-width:0!important;width:100%!important}
 #databaseModal select#dbCategory{min-width:0!important;width:100%!important}
 #databaseModal #dbPaginatedHost{width:100%;overflow-x:hidden}
 #databaseModal #dbPaginatedHost > div{grid-template-columns:1fr!important}
}
#dbPaginatedHost .db-row-card,#dbPaginatedHost > div > div{background:#21170f!important;color:#fff!important;border-color:#8d652d!important}
#dbPaginatedHost .db-row-card *,#dbPaginatedHost > div > div *{color:#fff!important}
#dbPaginatedHost button{background:#555!important;color:#fff!important;border-color:#777!important}
</style>
<script id="db-layout-fix-script">
(function(){
 function fixDbHost(){
  const host=document.getElementById('dbPaginatedHost');
  const modal=document.getElementById('databaseModal');
  const panel=modal&&modal.querySelector('.panel');
  if(host&&panel&&(!modal.contains(host)||host.closest('#editorModal'))){panel.prepend(host);}
 }
 document.addEventListener('DOMContentLoaded',fixDbHost);
 window.addEventListener('load',fixDbHost);
})();
</script>`;

self.addEventListener("install", event => {
 event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
 if (event.request.method !== "GET") return;
 event.respondWith((async () => {
  try {
   const response = await fetch(event.request);
   const type = response.headers.get("content-type") || "";
   if (event.request.mode === "navigate" && response.ok && type.includes("text/html")) {
    let html = await response.text();
    html = html.replace('const editor=document.getElementById("editorModal") || document.body;', 'const editor=document.getElementById("databaseModal")?.querySelector(".panel") || document.body;');
    if (!html.includes('id="db-layout-fix"')) html = html.replace(/<\/head>/i, DB_LAYOUT_FIX + "</head>");
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
   }
   const copy=response.clone();
   caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});
   return response;
  } catch(err) {
   return caches.match(event.request).then(r=>r||caches.match("./index.html"));
  }
 })());
});
