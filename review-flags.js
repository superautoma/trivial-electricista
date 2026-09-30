(function(){
  'use strict';
  const KEY='trivial-electricista-review-flags-v6';
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
  const save=o=>{try{localStorage.setItem(KEY,JSON.stringify(o));return true}catch(e){return false}};
  let flags=load();

  const css=`
  #te-review-menu-button{background:#444;color:#fff;border:0;border-radius:10px;padding:10px 14px;font-weight:800;box-shadow:0 3px 10px #0008;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;width:100%;box-sizing:border-box;margin-top:8px}
  #te-review-badge{background:#d32f2f;color:#fff;border-radius:999px;padding:3px 8px;font-size:12px;font-weight:800}
  #te-review-panel{position:fixed;inset:0;background:#000b;z-index:100000;display:none;align-items:center;justify-content:center;padding:12px}
  #te-review-panel.show{display:flex}
  #te-review-panel .box{background:#2a1c11;color:#fff;border:3px solid #a97939;border-radius:16px;padding:18px;max-width:760px;width:100%;max-height:88vh;overflow:auto}
  #te-review-panel h2{color:#ffd54a;margin:0 0 12px}
  #te-review-panel .item{padding:12px;margin:8px 0;border:1px solid #6b4a2d;border-radius:10px;background:#1b120b}
  #te-review-panel .item .row{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}
  #te-review-panel .item button{background:#ffd54a;color:#20170b;border:0;border-radius:8px;padding:7px 10px;font-weight:bold}
  #te-review-panel .item button.remove{background:#555;color:#fff}
  #te-question-mark{background:#ffd54a;color:#20170b;border:0;border-radius:9px;padding:10px 14px;font-weight:800;display:inline-block}
  `;
  const st=document.createElement('style');st.id='te-review-css';st.textContent=css;document.head.appendChild(st);

  function norm(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase()}
  function questionFromDOM(){
    const modal=document.getElementById('questionModal');
    if(!modal || !modal.classList.contains('show')) return null;
    const q=(document.getElementById('questionText')?.innerText||'').trim();
    if(!q) return null;
    const cat=(document.getElementById('questionTitle')?.innerText||'').trim();
    return {q,cat,key:norm(q)};
  }
  function esc(s){return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
  function count(){return Object.keys(flags).length}
  function updateBadge(){
    const badge=document.getElementById('te-review-badge');
    if(badge){const n=count();badge.textContent=n;badge.style.display=n?'inline-block':'none'}
  }
  function isMarked(q){return !!(q&&flags[q.key])}
  function markQuestion(q){
    if(!q)return;
    if(flags[q.key]) delete flags[q.key];
    else flags[q.key]={question:q.q,category:q.cat,markedAt:Date.now()};
    save(flags);updateBadge();refreshQuestionButton();
  }
  function refreshQuestionButton(){
    const q=questionFromDOM();
    const b=document.getElementById('te-question-mark');
    if(!b)return;
    if(!q){b.style.display='none';return}
    b.style.display='inline-block';
    b.textContent=isMarked(q)?'✓ Marcada para revisar':'⚠️ Marcar para revisar';
    b.style.background=isMarked(q)?'#6b4a2d':'#ffd54a';
  }
  function ensureQuestionButton(){
    const modal=document.getElementById('questionModal');
    const actions=modal?.querySelector('.actions');
    if(!actions)return;
    let b=document.getElementById('te-question-mark');
    if(!b){
      b=document.createElement('button');
      b.id='te-question-mark';
      b.type='button';
      b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();markQuestion(questionFromDOM())});
      actions.insertBefore(b,actions.firstChild);
    }
    refreshQuestionButton();
  }

  function visible(el){
    if(!el)return false;
    const cs=getComputedStyle(el), r=el.getBoundingClientRect();
    return cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0;
  }

  // Find the actual menu by locating its visible menu buttons, rather than relying on CSS class names.
  function findMenuContainer(){
    const menuButton=[...document.querySelectorAll('button,a')].find(el=>visible(el)&&/^\s*(☰|≡)?\s*menú\s*$/i.test((el.innerText||el.textContent||'')));
    if(menuButton){
      let p=menuButton.parentElement;
      for(let i=0;p&&p!==document.body&&i<8;i++,p=p.parentElement){
        const txt=norm(p.innerText||'');
        const n=p.querySelectorAll('button,a').length;
        if(n>=2 && /nueva partida|editor|jugadores|configur|salir/.test(txt)) return p;
      }
    }
    const candidates=[];
    document.querySelectorAll('body *').forEach(el=>{
      if(!visible(el)||el.id==='questionModal'||el.id==='te-review-panel')return;
      const txt=norm(el.innerText||'');
      const n=el.querySelectorAll('button,a').length;
      if(n>=2 && n<=20 && /nueva partida/.test(txt) && /editor|jugadores|configur|salir/.test(txt)) candidates.push(el);
    });
    if(candidates.length) return candidates.sort((a,b)=>a.querySelectorAll('button,a').length-b.querySelectorAll('button,a').length)[0];
    return null;
  }

  function openReviewPanel(){renderPanel();document.getElementById('te-review-panel')?.classList.add('show')}

  function installMenuButton(){
    const menu=findMenuContainer();
    if(!menu)return false;
    let b=document.getElementById('te-review-menu-button');
    if(b && menu.contains(b)){updateBadge();return true}
    if(b)b.remove();
    b=document.createElement('button');
    b.id='te-review-menu-button';
    b.type='button';
    b.innerHTML='⚠️ Revisar marcadas <span id="te-review-badge"></span>';
    b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openReviewPanel()});
    const actions=menu.querySelector('.actions');
    if(actions) actions.appendChild(b); else menu.appendChild(b);
    updateBadge();
    return true;
  }

  function scheduleMenuInstall(){
    [60,180,400,800].forEach(ms=>setTimeout(installMenuButton,ms));
  }

  function menuWasClicked(target){
    const b=target?.closest?.('button,a');
    return !!b && /^\s*(☰|≡)?\s*menú\s*$/i.test((b.innerText||b.textContent||''));
  }

  function renderPanel(){
    const p=document.getElementById('te-review-panel');if(!p)return;
    const items=Object.entries(flags);
    let html='<div class="box"><h2>⚠️ Preguntas marcadas para revisar</h2>';
    html+=items.length?items.map(([key,v])=>'<div class="item"><b>'+(v.category?esc(v.category):'Pregunta')+'</b><div>'+esc(v.question||'')+'</div><div class="row"><button data-edit="'+encodeURIComponent(key)+'">✏️ Editar</button><button class="remove" data-remove="'+encodeURIComponent(key)+'">✓ Quitar marca</button></div></div>').join(''):'<p>No hay preguntas marcadas.</p>';
    html+='<button id="te-review-close" style="background:#555;color:#fff;border:0;border-radius:9px;padding:10px 16px;font-weight:bold">Cerrar</button></div>';
    p.innerHTML=html;
    p.querySelector('#te-review-close').onclick=()=>p.classList.remove('show');
    p.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{delete flags[decodeURIComponent(b.dataset.remove)];save(flags);updateBadge();renderPanel()});
    p.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
      const k=decodeURIComponent(b.dataset.edit);p.classList.remove('show');
      const arr=Array.isArray(window.questions)?window.questions:[];
      const idx=arr.findIndex(x=>norm(x.q)===k);
      if(idx>=0 && typeof window.editQuestion==='function') window.editQuestion(idx);
      else if(typeof window.openQuestionManagement==='function') window.openQuestionManagement();
      else if(typeof window.openEditor==='function') window.openEditor();
    });
  }

  function ensurePanel(){
    if(!document.getElementById('te-review-panel')){const p=document.createElement('div');p.id='te-review-panel';document.body.appendChild(p)}
  }

  function boot(){
    try{
      ensurePanel();
      ensureQuestionButton();
      document.addEventListener('click',function(e){
        if(menuWasClicked(e.target)) scheduleMenuInstall();
      },true);
      window.addEventListener('pageshow',scheduleMenuInstall);
      window.addEventListener('load',scheduleMenuInstall);
      scheduleMenuInstall();
      updateBadge();
    }catch(e){console.warn('Review flags disabled:',e)}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
