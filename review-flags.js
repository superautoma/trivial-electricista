(function(){
  'use strict';
  const KEY='trivial-electricista-review-flags-v3';
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
  const save=o=>{try{localStorage.setItem(KEY,JSON.stringify(o));return true}catch(e){return false}};
  let flags=load();
  const css=`
  #te-review-tools{position:fixed;right:12px;bottom:18px;z-index:99999;display:flex;gap:7px;flex-direction:column;align-items:flex-end;font-family:Arial,sans-serif}
  #te-review-tools button{border:0;border-radius:10px;padding:10px 13px;font-weight:800;box-shadow:0 3px 10px #0008;cursor:pointer}
  #te-review-list{background:#444;color:#fff}
  #te-review-badge{display:none;background:#d32f2f;color:#fff;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800}
  #te-review-panel{position:fixed;inset:0;background:#000b;z-index:100000;display:none;align-items:center;justify-content:center;padding:12px}
  #te-review-panel.show{display:flex}
  #te-review-panel .box{background:#2a1c11;color:#fff;border:3px solid #a97939;border-radius:16px;padding:18px;max-width:760px;width:100%;max-height:88vh;overflow:auto}
  #te-review-panel h2{color:#ffd54a;margin:0 0 12px}
  #te-review-panel .item{padding:12px;margin:8px 0;border:1px solid #6b4a2d;border-radius:10px;background:#1b120b}
  #te-review-panel .item .row{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}
  #te-review-panel .item button{background:#ffd54a;color:#20170b;border:0;border-radius:8px;padding:7px 10px;font-weight:bold}
  #te-review-panel .item button.remove{background:#555;color:#fff}
  #te-question-mark{background:#ffd54a;color:#20170b;border:0;border-radius:9px;padding:10px 14px;font-weight:800}
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase()}
  function questionFromDOM(){
    const modal=document.getElementById('questionModal');
    if(!modal || !modal.classList.contains('show')) return null;
    const q=(document.getElementById('questionText')?.innerText||'').trim();
    if(!q) return null;
    return {q,cat:(document.getElementById('questionTitle')?.innerText||'').trim(),key:norm(q)};
  }
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function updateBadge(){
    const n=Object.keys(flags).length;
    const badge=document.getElementById('te-review-badge');
    if(badge){badge.style.display=n?'block':'none';badge.textContent=n+' marcada'+(n===1?'':'s')}
    const list=document.getElementById('te-review-list');
    if(list)list.textContent='⚠️ Revisar marcadas'+(n?' ('+n+')':'');
  }
  function marked(q){return !!(q&&flags[q.key])}
  function markQuestion(q){
    if(!q)return;
    if(flags[q.key])delete flags[q.key];
    else flags[q.key]={question:q.q,category:q.cat,markedAt:Date.now()};
    save(flags);updateBadge();refreshQuestionButton();
  }
  function refreshQuestionButton(){
    const b=document.getElementById('te-question-mark');if(!b)return;
    const q=questionFromDOM();
    if(!q){b.style.display='none';return}
    b.style.display='inline-block';
    b.textContent=marked(q)?'✓ Marcada para revisar':'⚠️ Marcar para revisar';
    b.style.background=marked(q)?'#6b4a2d':'#ffd54a';
    b.style.color='#20170b';
  }
  function ensureQuestionButton(){
    const modal=document.getElementById('questionModal'),actions=modal?.querySelector('.actions');
    if(!actions)return;
    let b=document.getElementById('te-question-mark');
    if(!b){
      b=document.createElement('button');b.id='te-question-mark';b.type='button';
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const q=questionFromDOM();if(q)markQuestion(q)},true);
      actions.insertBefore(b,actions.firstChild);
    }
    refreshQuestionButton();
  }
  function getSavedQuestions(){try{const a=JSON.parse(localStorage.getItem('trivial_questions')||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
  function editMarked(key){
    const arr=getSavedQuestions();
    const idx=arr.findIndex(x=>norm(x.q)===key);
    if(typeof window.editQuestion==='function' && idx>=0){window.editQuestion(idx);return}
    if(typeof window.openQuestionManagement==='function')window.openQuestionManagement();
  }
  function renderPanel(){
    const p=document.getElementById('te-review-panel');if(!p)return;
    const items=Object.entries(flags);
    let html='<div class="box"><h2>⚠️ Preguntas marcadas para revisar</h2>';
    html+=items.length?items.map(([key,v])=>'<div class="item"><b>'+esc(v.category||'Pregunta')+'</b><div>'+esc(v.question||'')+'</div><div class="row"><button data-edit="'+encodeURIComponent(key)+'">✏️ Editar</button><button class="remove" data-remove="'+encodeURIComponent(key)+'">✓ Quitar marca</button></div></div>').join(''):'<p>No hay preguntas marcadas.</p>';
    html+='<button id="te-review-close" style="background:#555;color:#fff;border:0;border-radius:9px;padding:10px 16px;font-weight:bold">Cerrar</button></div>';
    p.innerHTML=html;
    p.querySelector('#te-review-close').onclick=()=>p.classList.remove('show');
    p.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{delete flags[decodeURIComponent(b.dataset.remove)];save(flags);updateBadge();renderPanel();refreshQuestionButton()});
    p.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{editMarked(decodeURIComponent(b.dataset.edit));p.classList.remove('show')});
  }
  function ensureUI(){
    if(!document.getElementById('te-review-tools')){
      const wrap=document.createElement('div');wrap.id='te-review-tools';
      wrap.innerHTML='<span id="te-review-badge"></span><button id="te-review-list" type="button">⚠️ Revisar marcadas</button>';
      document.body.appendChild(wrap);
      document.getElementById('te-review-list').onclick=e=>{e.preventDefault();e.stopPropagation();renderPanel();document.getElementById('te-review-panel').classList.add('show')};
    }
    if(!document.getElementById('te-review-panel')){const p=document.createElement('div');p.id='te-review-panel';document.body.appendChild(p)}
    ensureQuestionButton();updateBadge();
  }
  const obs=new MutationObserver(()=>{ensureUI();refreshQuestionButton()});
  obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  setInterval(()=>{ensureUI();refreshQuestionButton()},1000);
  window.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('te-review-panel')?.classList.remove('show')});
  ensureUI();
})();
