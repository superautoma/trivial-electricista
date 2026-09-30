(function(){
  'use strict';

  // Compatibilidad: la explicación la gestiona el juego principal.
  // Aquí solo corregimos el estado visual de una respuesta incorrecta.
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase();}

  function getCurrentQuestion(){
    const text=document.getElementById('questionText')?.innerText?.trim()||'';
    if(!text)return null;
    const arr=Array.isArray(window.questions)?window.questions:[];
    const key=norm(text);
    return arr.find(q=>norm(q?.q)===key)||null;
  }

  function install(){
    const modal=document.getElementById('questionModal');
    if(!modal || modal.dataset.teWrongAnswerColor==='1')return;
    modal.dataset.teWrongAnswerColor='1';

    modal.addEventListener('click',function(e){
      const button=e.target?.closest?.('#answers button');
      if(!button)return;

      const q=getCurrentQuestion();
      if(!q || !Array.isArray(q.a) || typeof q.c!=='number')return;

      const selected=norm(button.textContent||'').replace(/^[a-d][)\\.:-]\\s*/i,'');
      const correct=norm(q.a[q.c]);

      if(selected===correct)return;

      // La respuesta elegida es incorrecta: rojo, no amarillo.
      button.style.setProperty('background','#d32f2f','important');
      button.style.setProperty('color','#fff','important');
      button.style.setProperty('border-color','#ff8a80','important');
      button.style.setProperty('box-shadow','0 0 0 2px rgba(211,47,47,.35)','important');
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
