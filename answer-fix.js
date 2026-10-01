(function(){
  'use strict';

  // ============================================================
  // CORRECCIÓN VISUAL DE RESPUESTA INCORRECTA
  // ============================================================
  function installWrongAnswerFix(){
    const modal=document.getElementById('questionModal');
    if(!modal || modal.dataset.teWrongAnswerColorV2==='1')return;
    modal.dataset.teWrongAnswerColorV2='1';

    modal.addEventListener('click',function(e){
      const button=e.target?.closest?.('#answers button');
      if(!button)return;

      setTimeout(function(){
        const status=document.getElementById('status');
        const text=(status?.textContent||'').toLowerCase();
        if(!text.includes('respuesta incorrecta'))return;

        button.style.setProperty('background','#d32f2f','important');
        button.style.setProperty('background-color','#d32f2f','important');
        button.style.setProperty('color','#fff','important');
        button.style.setProperty('border-color','#ff8a80','important');
        button.style.setProperty('box-shadow','0 0 0 3px rgba(211,47,47,.35)','important');
      },30);
    },true);
  }

  // ============================================================
  // PREGUNTAS MARCADAS PARA REVISAR
  // Se guarda únicamente en localStorage del dispositivo.
  // No modifica las preguntas ni la partida.
  // ============================================================
  const REVIEW_KEY='trivial-electricista-review-flags-v8';
  let reviewFlags={};

  function loadReviewFlags(){
    try{
      reviewFlags=JSON.parse(localStorage.getItem(REVIEW_KEY)||'{}')||{};
    }catch(e){reviewFlags={};}
  }

  function saveReviewFlags(){
    try{localStorage.setItem(REVIEW_KEY,JSON.stringify(reviewFlags));return true;}
    catch(e){return false;}
  }

  function norm(s){
    return String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function esc(s){
    return String(s??'').replace(/[&<>\"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function currentQuestion(){
    const modal=document.getElementById('questionModal');
    if(!modal || !modal.classList.contains('show'))return null;
    const el=document.getElementById('questionText');
    const q=(el?.innerText||el?.textContent||'').trim();
    if(!q)return null;
    const title=document.getElementById('questionTitle');
    const cat=(title?.innerText||title?.textContent||'').trim();
    return {q:q,cat:cat,key:norm(q)};
  }

  function markedCount(){return Object.keys(reviewFlags).length;}

  function updateReviewBadge(){
    const badge=document.getElementById('te-review-badge');
    if(!badge)return;
    const n=markedCount();
    badge.textContent=String(n);
    badge.style.display=n?'inline-block':'none';
  }

  function refreshMarkButton(){
    const b=document.getElementById('te-question-mark');
    if(!b)return;
    const q=currentQuestion();
    if(!q){b.style.display='none';return;}
    b.style.display='inline-block';
    const marked=!!reviewFlags[q.key];
    b.textContent=marked?'✓ Marcada para revisar':'⚠️ Marcar para revisar';
    b.style.background=marked?'#6b4a2d':'#ffd54a';
    b.style.color='#20170b';
  }

  function toggleCurrentQuestion(){
    const q=currentQuestion();
    if(!q)return;
    if(reviewFlags[q.key]){
      delete reviewFlags[q.key];
    }else{
      reviewFlags[q.key]={question:q.q,category:q.cat,markedAt:Date.now()};
    }
    saveReviewFlags();
    refreshMarkButton();
    updateReviewBadge();
  }

  function ensureQuestionMarkButton(){
    const modal=document.getElementById('questionModal');
    const actions=modal?.querySelector('.actions');
    if(!actions)return false;

    let b=document.getElementById('te-question-mark');
    if(!b){
      b=document.createElement('button');
      b.id='te-question-mark';
      b.type='button';
      b.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        toggleCurrentQuestion();
      },true);
      actions.insertBefore(b,actions.firstChild);
    }
    refreshMarkButton();
    return true;
  }

  function isVisible(el){
    if(!el)return false;
    const cs=getComputedStyle(el);
    const r=el.getBoundingClientRect();
    return cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0;
  }

  // Busca el menú principal sin depender de una estructura concreta.
  function findMenuContainer(){
    const candidates=[];
    document.querySelectorAll('body *').forEach(function(el){
      if(!isVisible(el)||el.id==='questionModal'||el.id==='te-review-panel')return;
      const text=norm(el.innerText||'');
      const buttons=el.querySelectorAll('button,a');
      if(buttons.length>=2 && buttons.length<=25 && /nueva partida/.test(text) && /editor|jugadores|configur/.test(text)){
        candidates.push(el);
      }
    });
    candidates.sort(function(a,b){return a.querySelectorAll('button,a').length-b.querySelectorAll('button,a').length;});
    return candidates[0]||null;
  }

  function openReviewPanel(){
    renderReviewPanel();
    document.getElementById('te-review-panel')?.classList.add('show');
  }

  function installReviewMenuButton(){
    const menu=findMenuContainer();
    if(!menu)return false;

    let b=document.getElementById('te-review-menu-button');
    if(b && menu.contains(b)){
      updateReviewBadge();
      return true;
    }
    if(b)b.remove();

    b=document.createElement('button');
    b.id='te-review-menu-button';
    b.type='button';
    b.innerHTML='⚠️ Revisar preguntas <span id="te-review-badge"></span>';
    b.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      openReviewPanel();
    });

    const actions=menu.querySelector('.actions');
    if(actions)actions.appendChild(b);else menu.appendChild(b);
    updateReviewBadge();
    return true;
  }

  function scheduleReviewMenu(){
    [100,300,700,1200,2000].forEach(function(ms){setTimeout(installReviewMenuButton,ms);});
  }

  function renderReviewPanel(){
    const panel=document.getElementById('te-review-panel');
    if(!panel)return;

    const items=Object.entries(reviewFlags);
    let html='<div class="box">';
    html+='<h2>⚠️ Preguntas marcadas para revisar</h2>';

    if(!items.length){
      html+='<p>No hay preguntas marcadas.</p>';
    }else{
      html+='<p style="color:#e7cf9f">Hay '+items.length+' pregunta'+(items.length===1?'':'s')+' pendiente'+(items.length===1?'':'s')+' de revisión.</p>';
      items.forEach(function(pair){
        const key=pair[0],v=pair[1]||{};
        html+='<div class="item">';
        html+='<div style="color:#ffd54a;font-weight:800">'+esc(v.category||'Pregunta')+'</div>';
        html+='<div style="margin-top:5px">'+esc(v.question||'')+'</div>';
        html+='<div class="row">';
        html+='<button type="button" data-edit="'+encodeURIComponent(key)+'">✏️ Ir al editor</button>';
        html+='<button type="button" class="remove" data-remove="'+encodeURIComponent(key)+'">✓ Quitar marca</button>';
        html+='</div></div>';
      });
    }

    html+='<button type="button" id="te-review-close" style="background:#555;color:#fff;border:0;border-radius:9px;padding:10px 16px;font-weight:bold">Cerrar</button>';
    html+='</div>';
    panel.innerHTML=html;

    panel.querySelector('#te-review-close')?.addEventListener('click',function(){panel.classList.remove('show');});

    panel.querySelectorAll('[data-remove]').forEach(function(btn){
      btn.addEventListener('click',function(){
        delete reviewFlags[decodeURIComponent(btn.dataset.remove||'')];
        saveReviewFlags();
        updateReviewBadge();
        renderReviewPanel();
      });
    });

    panel.querySelectorAll('[data-edit]').forEach(function(btn){
      btn.addEventListener('click',function(){
        const key=decodeURIComponent(btn.dataset.edit||'');
        panel.classList.remove('show');
        goToEditor(key);
      });
    });
  }

  function goToEditor(key){
    const arr=Array.isArray(window.questions)?window.questions:[];
    const idx=arr.findIndex(function(x){return norm(x?.q||x?.question||'')===key;});

    if(idx>=0 && typeof window.editQuestion==='function'){
      window.editQuestion(idx);
      return;
    }
    if(typeof window.openQuestionManagement==='function'){
      window.openQuestionManagement();
      return;
    }
    if(typeof window.openEditor==='function'){
      window.openEditor();
      return;
    }

    // Si el editor no expone una función pública, abrimos el editor mediante
    // el botón visible y dejamos la pregunta marcada para localizarla allí.
    const editor=[...document.querySelectorAll('button,a')].find(function(el){
      return isVisible(el)&&/preguntas y respuestas|editor/i.test((el.innerText||el.textContent||''));
    });
    if(editor)editor.click();
  }

  function ensureReviewPanel(){
    if(document.getElementById('te-review-panel'))return;
    const panel=document.createElement('div');
    panel.id='te-review-panel';
    document.body.appendChild(panel);
  }

  function injectReviewStyles(){
    if(document.getElementById('te-review-css'))return;
    const style=document.createElement('style');
    style.id='te-review-css';
    style.textContent=`
      #te-question-mark{background:#ffd54a;color:#20170b;border:0;border-radius:9px;padding:10px 14px;font-weight:800;display:inline-block}
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
    `;
    document.head.appendChild(style);
  }

  function bootReviewFlags(){
    loadReviewFlags();
    injectReviewStyles();
    ensureReviewPanel();

    // El modal puede existir después de cargar este script, por eso se intenta
    // varias veces y también se observa el DOM para cambios dinámicos.
    [100,300,700,1200].forEach(function(ms){setTimeout(ensureQuestionMarkButton,ms);});
    scheduleReviewMenu();
    updateReviewBadge();

    const observer=new MutationObserver(function(){
      ensureQuestionMarkButton();
      if(!document.getElementById('te-review-menu-button'))installReviewMenuButton();
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

    document.addEventListener('click',function(){
      setTimeout(function(){
        ensureQuestionMarkButton();
        installReviewMenuButton();
      },50);
    },true);
  }

  function boot(){
    try{
      installWrongAnswerFix();
      bootReviewFlags();
    }catch(e){console.warn('Trivial Electricista fixes disabled:',e)}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
