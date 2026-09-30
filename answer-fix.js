(function(){
  'use strict';
  const CACHE_KEY='trivial-electricista-question-explanations-v1';
  let dataCache=null;

  const norm=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
  const visible=el=>{
    if(!el)return false;
    const cs=getComputedStyle(el),r=el.getBoundingClientRect();
    return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0;
  };
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  async function loadQuestions(){
    if(Array.isArray(window.questions)&&window.questions.length){dataCache=window.questions;return dataCache;}
    if(dataCache)return dataCache;
    try{
      const cached=localStorage.getItem(CACHE_KEY);
      if(cached){const parsed=JSON.parse(cached);if(Array.isArray(parsed)&&parsed.length){dataCache=parsed;return parsed;}}
    }catch(e){}
    try{
      const r=await fetch('preguntas.json?v=1',{cache:'no-store'});
      const arr=await r.json();
      if(Array.isArray(arr)){dataCache=arr;try{localStorage.setItem(CACHE_KEY,JSON.stringify(arr))}catch(e){};return arr;}
    }catch(e){console.warn('No se pudo cargar preguntas.json',e)}
    return [];
  }

  function currentQuestion(){
    const modal=document.getElementById('questionModal');
    if(!modal||!visible(modal))return null;
    const text=(document.getElementById('questionText')?.innerText||'').trim();
    if(!text)return null;
    return {modal,text,key:norm(text)};
  }

  function answerButtons(modal){
    const all=[...modal.querySelectorAll('button')].filter(visible);
    return all.filter(b=>{
      const t=norm(b.innerText||b.textContent||'');
      if(!t)return false;
      if(/^cerrar$/.test(t)||/marcada|marcar para revisar|siguiente|continuar/.test(t))return false;
      if(b.id==='te-question-mark'||b.closest('.actions'))return false;
      return true;
    }).slice(0,4);
  }

  function findQuestion(arr,text){
    const key=norm(text);
    return arr.find(q=>norm(q.q||q.question||q.text)===key)||null;
  }

  function existingExplanation(modal){
    const nodes=[...modal.querySelectorAll('*')];
    return nodes.find(el=>{
      const t=norm(el.innerText||'');
      return /^explicación\b/.test(t) || /explicación pendiente de revisión técnica/.test(t);
    });
  }

  function showExplanation(modal,q,correctText){
    let box=modal.querySelector('#te-answer-explanation-fix');
    const explanation=String(q?.explanation||'').trim() || ('La respuesta correcta es «'+correctText+'». Esta es la opción que corresponde a lo indicado en la pregunta.');
    if(!box){
      box=document.createElement('div');
      box.id='te-answer-explanation-fix';
      box.style.cssText='margin:14px 0 0;padding:14px 16px;background:#fff8dc;color:#21170d;border-left:6px solid #ffd54a;border-radius:12px;font-size:17px;line-height:1.35;box-sizing:border-box;';
      const title=document.createElement('div');
      title.style.cssText='font-weight:800;font-size:19px;margin-bottom:7px;';
      title.textContent='💡 Explicación';
      const body=document.createElement('div');
      body.className='te-answer-explanation-body';
      box.append(title,body);
      const actions=modal.querySelector('.actions');
      if(actions) actions.parentElement.insertBefore(box,actions);
      else modal.querySelector('.modal-content,.content,.box')?.appendChild(box) || modal.appendChild(box);
    }
    const body=box.querySelector('.te-answer-explanation-body');
    if(body)body.textContent=explanation;
    box.style.display='block';

    // Make sure the user can always leave the question instead of getting stuck.
    let close=modal.querySelector('#te-answer-close-fix');
    if(!close){
      close=document.createElement('button');
      close.id='te-answer-close-fix';
      close.type='button';
      close.textContent='Cerrar';
      close.style.cssText='margin-top:12px;background:#666;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-weight:800;font-size:16px;';
      const actions=modal.querySelector('.actions');
      if(actions)actions.appendChild(close); else box.appendChild(close);
      close.addEventListener('click',function(e){
        e.preventDefault();e.stopPropagation();
        const existing=[...modal.querySelectorAll('button')].find(b=>b!==close&&/^\s*cerrar\s*$/i.test(b.innerText||b.textContent||'')&&visible(b));
        if(existing){existing.click();return;}
        modal.classList.remove('show');
        modal.style.display='none';
      });
    }
  }

  let lastKey='';
  async function handleAnswer(button){
    const cur=currentQuestion();
    if(!cur)return;
    const arr=await loadQuestions();
    const q=findQuestion(arr,cur.text);
    if(!q||typeof q.c!=='number'||!Array.isArray(q.a))return;
    const buttons=answerButtons(cur.modal);
    const idx=buttons.indexOf(button);
    let selected=-1;
    if(idx>=0)selected=idx;
    if(selected<0){
      const bt=norm(button.innerText||button.textContent||'');
      selected=q.a.findIndex(a=>norm(a)===bt);
    }
    if(selected<0||selected===q.c)return;
    const key=cur.key+'|'+selected;
    if(lastKey===key)return;
    lastKey=key;
    // Let the original game handler run first. If it did not create the explanation,
    // install the reliable fallback shortly afterwards.
    setTimeout(()=>{
      const modal=document.getElementById('questionModal');
      if(!modal||!visible(modal))return;
      const pending=existingExplanation(modal);
      const txt=norm(pending?.innerText||'');
      if(!pending || /pendiente de revisión/.test(txt))showExplanation(modal,q,q.a[q.c]);
    },180);
    setTimeout(()=>{lastKey=''},1000);
  }

  function boot(){
    const install=()=>{
      const modal=document.getElementById('questionModal');
      if(!modal||modal.dataset.teAnswerFix==='1')return;
      modal.dataset.teAnswerFix='1';
      modal.addEventListener('click',e=>{
        const b=e.target?.closest?.('button');
        if(b)handleAnswer(b);
      },true);
    };
    install();
    new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
