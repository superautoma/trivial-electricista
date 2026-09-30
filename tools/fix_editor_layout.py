from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

start = s.find('<script id="db-pagination-final">')
if start < 0:
    raise SystemExit('db-pagination-final not found')
end = s.find('</script>', start)
if end < 0:
    raise SystemExit('script end not found')

new_script = r'''<script id="db-pagination-final">
(function(){
  const state={page:1,size:50,items:[],filtered:[]};
  function getDB(){ return Array.isArray(window.questions) ? window.questions : (typeof questions!=="undefined" && Array.isArray(questions) ? questions : []); }
  function text(q){ return [q.q,q.cat,q.explanation,...(q.a||[])].join(" ").toLowerCase(); }
  function ensureHost(){
    const panel=document.querySelector("#editorModal > .panel");
    if(!panel) return null;
    // Siempre reubicar el host dentro del panel. La versión anterior podía
    // dejarlo como hermano del panel, creando exactamente la columna izquierda
    // que aparece en Android.
    let host=document.getElementById("dbPaginatedHost");
    if(!host){ host=document.createElement("div"); host.id="dbPaginatedHost"; }
    if(host.parentElement !== panel){
      const list=document.getElementById("editorList");
      if(list && list.parentElement===panel) panel.insertBefore(host,list);
      else panel.appendChild(host);
    }
    host.style.cssText="display:block;width:100%;max-width:none;box-sizing:border-box;margin:12px 0;";
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
    const total=state.filtered.length, pages=Math.max(1,Math.ceil(total/state.size));
    const start=(state.page-1)*state.size, pageItems=state.filtered.slice(start,start+state.size);
    host.innerHTML="";
    const size=document.createElement("div"); size.className="db-page-size"; size.innerHTML="<label>Preguntas por página:</label>";
    const sel=document.createElement("select"); [25,50,100,250].forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=n;if(n===state.size)o.selected=true;sel.appendChild(o);});
    sel.onchange=()=>{state.size=+sel.value;state.page=1;render();}; size.appendChild(sel); host.appendChild(size);
    const info=document.createElement("div"); info.className="db-page-info"; info.textContent=total?`Mostrando ${start+1}–${Math.min(start+pageItems.length,total)} de ${total} preguntas`:"No hay preguntas que coincidan"; host.appendChild(info);
    const nav=document.createElement("div"); nav.className="db-pagination";
    function btn(label,disabled,fn){const b=document.createElement("button");b.textContent=label;b.disabled=disabled;b.onclick=fn;nav.appendChild(b);}
    btn("«",state.page===1,()=>{state.page=1;render()}); btn("‹",state.page===1,()=>{state.page--;render()});
    let a=Math.max(1,state.page-2), b=Math.min(pages,a+4); a=Math.max(1,b-4);
    for(let n=a;n<=b;n++){const x=document.createElement("button");x.textContent=n;x.className=n===state.page?"active":"";x.onclick=()=>{state.page=n;render()};nav.appendChild(x);}
    btn("›",state.page===pages,()=>{state.page++;render()}); btn("»",state.page===pages,()=>{state.page=pages;render()}); host.appendChild(nav);
    const list=document.createElement("div"); list.style.cssText="display:grid;gap:8px;width:100%;";
    pageItems.forEach((q,idx)=>{
      const card=document.createElement("div"); card.className="db-question-card";
      const id=start+idx+1, correct=(q.a||[])[q.c]||"";
      card.innerHTML=`<div class="qnumber"><b>#${id}</b> · ${escapeHtml(q.cat??"")}</div><div class="qtext-full"><b>${escapeHtml(q.q||"")}</b></div><div class="qanswer-line">Correcta: <b>${escapeHtml(correct)}</b></div><div class="db-row-actions"><button type="button">Ver/editar</button></div>`;
      card.querySelector("button").onclick=()=>editFromDB(start+idx); list.appendChild(card);
    });
    host.appendChild(list);
  }
  function escapeHtml(s){return String(s).replace(/[&<>\"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[m]));}
  function editFromDB(index){const q=getDB()[index];if(!q)return;if(window.DBOpenEditor){window.DBOpenEditor(index);return;}const search=document.getElementById("searchQ");if(search){search.value=(q.q||"").slice(0,120);if(typeof window.renderEditor==="function")window.renderEditor();}}
  window.DBPagination={apply,render};
  document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>{const search=document.getElementById("searchQ");if(search&&!search.dataset.paginationBound){search.dataset.paginationBound="1";search.addEventListener("input",()=>{state.page=1;apply();});}apply();},900));
})();
</script>'''
s = s[:start] + new_script + s[end+9:]

hard_css = r'''<style id="editor-layout-hard-fix">
#editorModal{box-sizing:border-box!important}
#editorModal>.panel{width:calc(100vw - 16px)!important;max-width:1000px!important;min-width:0!important}
#editorModal>#dbPaginatedHost{display:none!important}
#editorModal>.panel>#dbPaginatedHost{display:block!important;width:100%!important;max-width:none!important;min-width:0!important}
@media(max-width:600px){#editorModal>.panel{width:calc(100vw - 16px)!important;max-width:none!important;padding:14px!important}}
</style>
'''
if 'id="editor-layout-hard-fix"' not in s:
    s=s.replace('</head>',hard_css+'</head>',1)

p.write_text(s,encoding='utf-8')
print('patched')
