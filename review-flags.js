(function(){
  'use strict';
  const KEY='trivial-electricista-review-flags-v2';
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
  const save=o=>{try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}};
  let flags=load();
  let lastQuestionKey='';
  let fallbackShown=false;
  const css=`
  #te-review-tools{position:fixed;right:12px;bottom:18px;z-index:99999;display:flex;gap:7px;flex-direction:column;align-items:flex-end;font-family:Arial,sans-serif}
  #te-review-tools button{border:0;border-radius:10px;padding:10px 13px;font-weight:800;box-shadow:0 3px 10px #0008;cursor:pointer}
  #te-review-mark{background:#ffd54a;color:#20170b}
  #te-review-list{background:#444;color:#fff}
  #te-review-badge{display:none;background:#d32f2f;color:#fff;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800}
  #te-review-panel{position:fixed;inset:0;background:#000b;z-index:100000;display:none;align-items:center;justify-content:center;padding:12px}
  #te-review-panel.show{display:flex}
  #te-review-panel .box{background:#2a1c11;color:#fff;border:3px solid #a97939;border-radius:16px;padding:18px;max-width:760px;width:100%;max-height:88vh;overflow:auto}
  #te-review-panel h2{color:#ffd54a;margin:0 0 12px}
  #te-review-panel .item{padding:10px;margin:7px 0;border:1px solid #6b4a2d;border-radius:10px;background:#1b120b}
  #te-review-panel .item button{float:right;background:#ffd54a;color:#20170b;border:0;border-radius:8px;padding:6px 9px;font-weight:bold}
  #te-fallback-explanation{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100001;background:#fff7d8;color:#24190d;border-left:6px solid #ffd54a;border-radius:14px;padding:18px;max-width:700px;width:calc(100% - 28px);box-shadow:0 12px 40px #000b;display:none;font-family:Arial,sans-serif}
  #te-fallback-explanation.show{display:block}
  #te-fallback-explanation h3{margin:0 0 8px}
  #te-fallback-explanation .ok{margin-top:12px;background:#555;color:#fff;border:0;border-radius:9px;padding:10px 16px;font-weight:bold}
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  function currentQuestion(){const modal=document.querySelector('.modal.show')||document.querySelector('.modal');if(!modal)return null;const text=modal.innerText||'';const m=text.match(/Pregunta\s+(\d+)/i);const id=m?m[1]:'';const q=(modal.querySelector('.question')||modal.querySelector('[class*=question]'))?.innerText?.trim()||'';const key=id||q.slice(0,120);return {modal,id,q,key,text}}
  function markCurrent(){const x=currentQuestion();if(!x||!x.key)return;flags[x.key]={id:x.id||null,question:x.q||x.text.slice(0,250),markedAt:Date.now()};save(flags);update();const b=document.getElementById('te-review-mark');if(b){b.textContent='✓ Marcada para revisar';b.disabled=true}}
  function unmark(key){delete flags[key];save(flags);update();renderReviewPanel()}
  function update(){const n=Object.keys(flags).length;const badge=document.getElementById('te-review-badge');if(badge){badge.style.display=n?'block':'none';badge.textContent=n+' marcada'+(n===1?'':'s')}const b=document.getElementById('te-review-list');if(b)b.textContent='⚠️ Revisar marcadas'+(n?' ('+n+')':'')}
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function renderReviewPanel(){const p=document.getElementById('te-review-panel');if(!p)return;const items=Object.entries(flags);p.innerHTML='<div class="box"><h2>⚠️ Preguntas marcadas para revisar</h2>'+(items.length?items.map(([k,v])=>'<div class="item"><button data-unmark="'+encodeURIComponent(k)+'">Quitar marca</button><b>Pregunta '+(v.id||'')+'</b><br>'+esc(v.question||'')+'</div>').join(''):'<p>No hay preguntas marcadas.</p>')+'<button id="te-review-close" style="background:#555;color:#fff;border:0;border-radius:9px;padding:10px 16px;font-weight:bold">Cerrar</button></div>';p.querySelector('#te-review-close').onclick=()=>p.classList.remove('show');p.querySelectorAll('[data-unmark]').forEach(b=>b.onclick=()=>unmark(decodeURIComponent(b.dataset.unmark)))}
  function ensureUI(){if(!document.getElementById('te-review-tools')){const wrap=document.createElement('div');wrap.id='te-review-tools';wrap.innerHTML='<span id="te-review-badge"></span><button id="te-review-mark">⚠️ Marcar para revisar</button><button id="te-review-list">⚠️ Revisar marcadas</button>';document.body.appendChild(wrap);document.getElementById('te-review-mark').onclick=markCurrent;document.getElementById('te-review-list').onclick=()=>{renderReviewPanel();document.getElementById('te-review-panel').classList.add('show')};update()}if(!document.getElementById('te-review-panel')){const p=document.createElement('div');p.id='te-review-panel';document.body.appendChild(p)}if(!document.getElementById('te-fallback-explanation')){const d=document.createElement('div');d.id='te-fallback-explanation';document.body.appendChild(d)}}
  function refreshQuestionUI(){ensureUI();const x=currentQuestion();const mark=document.getElementById('te-review-mark');if(!x||!x.key){mark.style.display='none';return}mark.style.display='block';mark.disabled=!!flags[x.key];mark.textContent=flags[x.key]?'✓ Marcada para revisar':'⚠️ Marcar para revisar';lastQuestionKey=x.key}
  function hasExplanation(modal){if(!modal)return false;const t=(modal.innerText||'').toLowerCase();return t.includes('explicación')&&!t.includes('explicación pendiente de revisión técnica')}
  function getCorrectText(modal){const t=modal?.innerText||'';const m=t.match(/Correcta\s*:\s*([^\n]+)/i);if(m&&m[1])return m[1].trim();const buttons=[...modal.querySelectorAll('.answers button, button')];const good=buttons.find(b=>{const s=(b.className||'').toString().toLowerCase();const bg=getComputedStyle(b).backgroundColor||'';return /correct|success|green/.test(s)||bg.includes('67, 160, 71')||bg.includes('56, 123, 61')});return good?good.innerText.trim():''}
  function showFallback(modal,selectedText){if(fallbackShown||hasExplanation(modal))return;const d=document.getElementById('te-fallback-explanation');if(!d)return;const correct=getCorrectText(modal);const ok=!!(correct&&selectedText&&correct.trim().toLowerCase()===selectedText.trim().toLowerCase());d.innerHTML='<h3>💡 Explicación</h3><div>'+(correct?(ok?'La respuesta es correcta: <b>'+esc(correct)+'</b>.':'La respuesta correcta es <b>'+esc(correct)+'</b>.'):'No se pudo cargar la explicación de esta pregunta. La pregunta queda disponible para revisarla posteriormente.')+'</div><button class="ok">Continuar</button>';d.querySelector('.ok').onclick=()=>{fallbackShown=false;d.classList.remove('show');const close=[...modal.querySelectorAll('button')].find(b=>/cerrar|continuar|siguiente|aceptar/i.test(b.innerText||''));if(close)close.click();else if(modal)modal.classList.remove('show')};d.classList.add('show');fallbackShown=true}
  document.addEventListener('click',function(e){const b=e.target.closest('.answers button');if(!b)return;const modal=b.closest('.modal.show')||b.closest('.modal');const selected=(b.innerText||'').trim();setTimeout(()=>{refreshQuestionUI();if(!modal)return;const cls=(b.className||'').toString().toLowerCase();const bg=getComputedStyle(b).backgroundColor||'';const looksWrong=/wrong|incorrect|error|danger|red/.test(cls)||bg.includes('211, 47, 47')||bg.includes('198, 40, 40');if(looksWrong){setTimeout(()=>showFallback(modal,selected),180)}else{setTimeout(()=>{if(!hasExplanation(modal))showFallback(modal,selected)},650)}},80)},true);
  window.addEventListener('error',function(e){const x=currentQuestion();if(x&&/answer|respuesta|explanation|explic/i.test((e.message||'')+' '+(e.filename||'')))setTimeout(()=>showFallback(x.modal,''),50)});
  const obs=new MutationObserver(()=>refreshQuestionUI());obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});setInterval(refreshQuestionUI,700);ensureUI();
})();
