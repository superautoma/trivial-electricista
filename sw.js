const CACHE_NAME = "trivial-electricista-db8";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

const DB_LAYOUT_FIX = `<style id="db-layout-fix">
#databaseModal .panel{width:100%;max-width:1100px;overflow-x:hidden}
#databaseModal #dbPaginatedHost{width:100%;max-width:100%;margin:12px 0;min-width:0;overflow-x:hidden}
#databaseModal #dbPaginatedHost > div{width:100%;max-width:100%;min-width:0;overflow-x:hidden;display:block!important}
#databaseModal .db-row-card,#databaseModal #dbPaginatedHost > div > div{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box;overflow-wrap:anywhere}
@media(max-width:700px){#databaseModal{padding:8px!important;display:block!important}#databaseModal .panel{width:100%!important;max-width:100%!important;padding:12px!important;border-radius:12px}#databaseModal input#dbSearch,#databaseModal select#dbCategory{min-width:0!important;width:100%!important;box-sizing:border-box}#databaseModal #dbPaginatedHost{width:100%!important;overflow-x:hidden!important}}
#dbPaginatedHost .db-row-card,#dbPaginatedHost > div > div{background:#21170f!important;color:#fff!important;border-color:#8d652d!important}
#dbPaginatedHost .db-row-card *,#dbPaginatedHost > div > div *{color:#fff!important}
#dbPaginatedHost button{background:#555!important;color:#fff!important;border-color:#777!important}
</style>
<script id="db-layout-fix-script">
(function(){
 function fixDbHost(){
  const host=document.getElementById('dbPaginatedHost'); if(!host) return;
  const modal=document.getElementById('databaseModal'); if(!modal) return;
  const panel=modal.querySelector('.panel'); if(!panel) return;
  if(host.parentElement!==panel) panel.appendChild(host);
  host.style.setProperty('width','100%','important');host.style.setProperty('max-width','100%','important');host.style.setProperty('min-width','0','important');host.style.setProperty('display','block','important');host.style.setProperty('overflow-x','hidden','important');
  const grid=host.firstElementChild;
  if(grid){grid.style.setProperty('display','block','important');grid.style.setProperty('width','100%','important');grid.style.setProperty('max-width','100%','important');}
  host.querySelectorAll(':scope > div > div').forEach(card=>{card.style.setProperty('width','100%','important');card.style.setProperty('max-width','100%','important');card.style.setProperty('box-sizing','border-box','important');});
 }
 const observer=new MutationObserver(fixDbHost);
 function start(){fixDbHost();observer.observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
</script>`;
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith((async()=>{try{const response=await fetch(event.request);const type=response.headers.get("content-type")||"";if(event.request.mode==="navigate"&&response.ok&&type.includes("text/html")){let html=await response.text();if(!html.includes('id="db-layout-fix"'))html=html.replace(/<\/head>/i,DB_LAYOUT_FIX+"</head>");const headers=new Headers(response.headers);headers.delete("content-length");return new Response(html,{status:response.status,statusText:response.statusText,headers});}const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});return response;}catch(err){return caches.match(event.request).then(r=>r||caches.match("./index.html"));}})());});
