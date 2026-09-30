(function(){
  'use strict';
  // Marca la opción seleccionada en rojo únicamente cuando el juego confirma
  // que la respuesta ha sido incorrecta. No depende de window.questions.
  function install(){
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

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
