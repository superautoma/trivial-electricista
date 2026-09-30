const CACHE_NAME = "trivial-electricista-db12";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

const FIX = `<style id="trivial-fix-db12">
@media(max-width:700px){#databaseModal{width:100%!important;max-width:100%!important;overflow-x:hidden!important}#databaseModal .panel{width:100%!important;max-width:100%!important;box-sizing:border-box!important}#databaseModal #dbPaginatedHost{width:100%!important;max-width:100%!important;min-width:0!important}#databaseModal #dbPaginatedHost>div{display:block!important;width:100%!important;max-width:100%!important}}
#dbPaginatedHost .db-row-card,#dbPaginatedHost>div>div{background:#21170f!important;color:#fff!important;border-color:#8d652d!important}
#dbPaginatedHost .db-row-card *,#dbPaginatedHost>div>div *{color:#fff!important}
</style>
<script id="trivial-fix-db12-script">
(function(){
 function hideCorrection(){
  const all=document.querySelectorAll('body *');
  for(const el of all){
   if(el.children.length>3) continue;
   const t=(el.textContent||'').replace(/\\s+/g,' ').trim().toLowerCase();
   if(t==='corrección de preguntas' || t==='✏️ corrección de preguntas' || t==='corrección de preguntas revisar y modificar preguntas' || t==='✏️ corrección de preguntas revisar y modificar preguntas'){
    let node=el;
    for(let i=0;i<6 && node.parentElement;i++){
     const p=node.parentElement;
     const pt=(p.textContent||'').replace(/\\s+/g,' ').trim().toLowerCase();
     if(pt.includes('corrección de preguntas') && pt.includes('revisar y modificar preguntas') && p.children.length<=5){node=p;} else break;
    }
    node.style.setProperty('display','none','important');
   }
  }
 }
 function fixDb(){
  const modal=document.getElementById('databaseModal');
  const host=document.getElementById('dbPaginatedHost');
  if(modal){const panel=modal.querySelector('.panel');if(panel&&host&&host.parentElement!==panel)panel.appendChild(host);}
  if(host){host.style.setProperty('width','100%','important');host.style.setProperty('max-width','100%','important');host.style.setProperty('min-width','0','important');host.style.setProperty('display','block','important');const g=host.firstElementChild;if(g){g.style.setProperty('display','block','important');g.style.setProperty('width','100%','important');g.style.setProperty('max-width','100%','important');}}
 }
 function fixBack(){
  const modal=document.getElementById('databaseModal');if(!modal||modal.dataset.back12)return;modal.dataset.back12='1';
  modal.addEventListener('click',e=>{const x=e.target.closest('button,a,[role="button"]');if(!x)return;const t=(x.textContent||'').replace(/\\s+/g,' ').trim().toLowerCase();if(t==='volver'||t.startsWith('← volver')){e.preventDefault();e.stopImmediatePropagation();modal.style.setProperty('display','none','important');const ed=document.getElementById('editorModal');if(ed)ed.style.removeProperty('display');}},true);
 }
 const run=()=>{fixDb();fixBack();hideCorrection();};
 const obs=new MutationObserver(run);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{run();obs.observe(document.body,{childList:true,subtree:true});});else{run();obs.observe(document.body,{childList:true,subtree:true});}
})();
</script>`;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith((async()=>{try{const r=await fetch(e.request);const type=r.headers.get('content-type')||'';if(e.request.mode==='navigate'&&r.ok&&type.includes('text/html')){let h=await r.text();if(!h.includes('trivial-fix-db12'))h=h.replace(/<\\/head>/i,FIX+'</head>');const hs=new Headers(r.headers);hs.delete('content-length');return new Response(h,{status:r.status,statusText:r.statusText,headers:hs});}const c=r.clone();caches.open(CACHE_NAME).then(x=>x.put(e.request,c)).catch(()=>{});return r;}catch(err){return caches.match(e.request).then(r=>r||caches.match('./index.html'));}})());});
