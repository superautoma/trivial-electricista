from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

new_script = r'''<script id="db-pagination-final">
(function(){
  const state={page:1,size:50,items:[],filtered:[]};
  function getDB(){
    return Array.isArray(window.questions) ? window.questions : (typeof questions!=="undefined" && Array.isArray(questions) ? questions : []);
  }
  function text(q){ return [q.q,q.cat,q.explanation,...(q.a||[])].join(" ").toLowerCase(); }
  function ensureHost(){
    let host=document.getElementById("dbPaginatedHost");
    if(host) return host;
    const panel=document.querySelector("#editorModal > .panel");
    if(!panel) return null;
    host=document.createElement("div");
    host.id="dbPaginatedHost";
    host.style.cssText="width:100%;box-sizing:border-box;margin:12px 0;";
    const list=document.getElementById("editorList");
    if(list) panel.insertBefore(host,list); else panel.appendChild(host);
    return host;
  }
  function apply(){
    const term=(document.getElementById("searchQ")?.value||"").trim().toLowerCase();
    state.items=getDB();
    state.filtered=term ? state.items.filter(q=>text(q).includes(term)) : state.items.slice();
    const pages=Math.max(1,Math.ceil(state.filtered.length/state.size));
    if(state.page>pages) state.page=pages;
    render();
  }
  function render(){
    const host=ensureHost(); if(!host) return;
    const total=state.filtered.length;
    const pages=Math.max(1,Math.ceil(total/state.size));
    const start=(state.page-1)*state.size;
    const pageItems=state.filtered.slice(start,start+state.size);
    host.innerHTML="";
    const size=document.createElement("div"); size.className="db-page-size";
    size.innerHTML="<label>Preguntas por página:</label>";
    const sel=document.createElement("select");
    [25,50,100,250].forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=n;if(n===state.size)o.selected=true;sel.appendChild(o);});
    sel.onchange=()=>{state.size=+sel.value;state.page=1;render();};
    size.appendChild(sel); host.appendChild(size);
    const info=document.createElement("div"); info.className="db-page-info";
    info.textContent=total?`Mostrando ${start+1}–${Math.min(start+pageItems.length,total)} de ${total} preguntas`:"No hay preguntas que coincidan";
    host.appendChild(info);
    const nav=document.createElement("div"); nav.className="db-pagination";
    function btn(label,disabled,fn){const b=document.createElement("button");b.textContent=label;b.disabled=disabled;b.onclick=fn;nav.appendChild(b);}
    btn("«",state.page===1,()=>{state.page=1;render()}); btn("‹",state.page===1,()=>{state.page--;render()});
    let a=Math.max(1,state.page-2), b=Math.min(pages,a+4); a=Math.max(1,b-4);
    for(let n=a;n<=b;n++){const x=document.createElement("button");x.textContent=n;x.className=n===state.page?"active":"";x.onclick=()=>{state.page=n;render()};nav.appendChild(x);}
    btn("›",state.page===pages,()=>{state.page++;render()}); btn("»",state.page===pages,()=>{state.page=pages;render()}); host.appendChild(nav);
    const list=document.createElement("div"); list.style.cssText="display:grid;gap:8px;width:100%;";
    pageItems.forEach((q,idx)=>{
      const card=document.createElement("div"); card.className="db-question-card";
      const id=start+idx+1; const correct=(q.a||[])[q.c]||"";
      card.innerHTML=`<div class="qnumber"><b>#${id}</b> · ${escapeHtml(q.cat??"")}</div><div class="qtext-full"><b>${escapeHtml(q.q||"")}</b></div><div class="qanswer-line">Correcta: <b>${escapeHtml(correct)}</b></div><div class="db-row-actions"><button type="button" data-export="${start+idx}">Ver/editar</button></div>`;
      card.querySelector("[data-export]").onclick=()=>editFromDB(start+idx); list.appendChild(card);
    });
    host.appendChild(list);
  }
  function escapeHtml(s){return String(s).replace(/[&<>\"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[m]));}
  function editFromDB(index){const q=getDB()[index];if(!q)return;if(window.DBOpenEditor){window.DBOpenEditor(index);return;}const search=document.getElementById("searchQ");if(search){search.value=(q.q||"").slice(0,120);if(typeof window.renderEditor==="function")window.renderEditor();}}
  window.DBPagination={apply,render};
  document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>{const search=document.getElementById("searchQ");if(search&&!search.dataset.paginationBound){search.dataset.paginationBound="1";search.addEventListener("input",()=>{state.page=1;apply();});}apply();},900));
})();
</script>'''

start = s.find('<script id="db-pagination-final">')
if start < 0: raise SystemExit('db-pagination-final not found')
end = s.find('</script>', start)
if end < 0: raise SystemExit('script end not found')
s = s[:start] + new_script + s[end+9:]

css = r'''<style id="db-pagination-fixed-final">
#editorModal{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:9990!important;box-sizing:border-box!important;background:rgba(0,0,0,.78)!important;display:none!important;align-items:center!important;justify-content:center!important;padding:8px!important;overflow:auto!important}
#editorModal.show{display:flex!important}
#editorModal>.panel{position:relative!important;display:block!important;width:min(1000px,calc(100vw - 16px))!important;max-width:1000px!important;max-height:calc(100vh - 16px)!important;margin:0!important;overflow:auto!important;box-sizing:border-box!important}
#dbPaginatedHost{width:100%!important;box-sizing:border-box!important}
#dbPaginatedHost .db-question-card{width:100%;box-sizing:border-box;background:#21170f!important;color:#fff!important;border:1px solid #8d652d;border-radius:10px;padding:12px}
#dbPaginatedHost .qnumber{color:#ffd54a!important;font-size:13px;margin-bottom:6px}
#dbPaginatedHost .qtext-full{color:#fff!important;white-space:normal;overflow-wrap:anywhere;line-height:1.35}
#dbPaginatedHost .qanswer-line{color:#e8d8bd!important;margin-top:6px}
#dbPaginatedHost .db-row-actions{margin-top:8px}
@media(max-width:600px){#editorModal{align-items:flex-start;padding:8px!important}#editorModal>.panel{width:calc(100vw - 16px)!important;max-width:none!important;max-height:calc(100vh - 16px)!important;padding:14px!important}}
</style>
'''
if 'id="db-pagination-fixed-final"' not in s:
    marker='</style>\n<script id="db-pagination-final">'
    idx=s.find(marker)
    if idx<0: raise SystemExit('pagination style marker not found')
    s=s[:idx+len('</style>\n')] + css + s[idx+len('</style>\n'):]

p.write_text(s,encoding='utf-8')
print('patched', p)
