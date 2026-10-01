(function(){
 'use strict';
 const KEY='trivial_question_management_password_v1';
 const protectedModals=new Set(['editorModal','editModal','databaseModal','markedQuestionsModal','fullDbEditor']);
 const rawOpen=window.openModal,rawClose=window.closeModal;
 let unlocked=false,pending=null,busy=false;
 function record(){
  const value=localStorage.getItem(KEY);
  if(!value)return null;
  const r=JSON.parse(value);
  if(r.version!==1||r.iterations!==210000||!Array.isArray(r.salt)||r.salt.length!==16||!Array.isArray(r.hash)||r.hash.length!==32)throw Error('La configuración de la contraseña no se puede leer.');
  return r;
 }
 async function derive(password,salt){
  if(!window.crypto?.subtle)throw Error('Este navegador no permite configurar la contraseña. Abre la aplicación mediante su enlace HTTPS.');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new Uint8Array(salt),iterations:210000,hash:'SHA-256'},key,256));
 }
 async function matches(password,r){
  const hash=await derive(password,r.salt);let difference=0;
  for(let i=0;i<hash.length;i++)difference|=hash[i]^r.hash[i];
  return difference===0;
 }
 const html=`
 <div id="questionPasswordAccessModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="questionPasswordAccessTitle">
  <div class="panel" style="max-width:460px">
   <h2 id="questionPasswordAccessTitle">🔒 Gestión de preguntas</h2>
   <p>Introduce la contraseña para acceder.</p>
   <form id="questionPasswordAccessForm">
    <label for="questionPasswordAccessInput">Contraseña</label>
    <input id="questionPasswordAccessInput" type="password" autocomplete="current-password" required>
    <p id="questionPasswordAccessMessage" role="status" style="color:#ffb4ab;min-height:20px"></p>
    <div class="actions"><button id="questionPasswordUnlock" class="primary" type="submit">Entrar</button><button class="secondary" id="questionPasswordCancel" type="button">Cancelar</button></div>
   </form>
  </div>
 </div>
 <div id="questionPasswordSettingsModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="questionPasswordSettingsTitle">
  <div class="panel" style="max-width:520px">
   <h2 id="questionPasswordSettingsTitle">🔐 Contraseña de gestión</h2>
   <p id="questionPasswordState"></p>
   <p style="font-size:14px;color:#e7cf9f">Protege el acceso a la gestión en este dispositivo. Al salir de la gestión, vuelve a pedirse.</p>
   <form id="questionPasswordSettingsForm">
    <div id="questionPasswordCurrentGroup"><label for="questionPasswordCurrent">Contraseña actual</label><input id="questionPasswordCurrent" type="password" autocomplete="current-password"></div>
    <label for="questionPasswordNew" style="margin-top:12px">Nueva contraseña (mínimo 4 caracteres)</label><input id="questionPasswordNew" type="password" autocomplete="new-password" minlength="4">
    <label for="questionPasswordConfirm" style="margin-top:12px">Repetir nueva contraseña</label><input id="questionPasswordConfirm" type="password" autocomplete="new-password">
    <p id="questionPasswordSettingsMessage" role="status" style="color:#ffb4ab;min-height:20px"></p>
    <div class="actions"><button class="primary" id="questionPasswordSave" type="submit">Establecer contraseña</button><button class="danger" id="questionPasswordRemove" type="button">Quitar contraseña</button><button class="secondary" id="questionPasswordSettingsClose" type="button">Volver</button></div>
   </form>
  </div>
 </div>`;
 function el(id){return document.getElementById(id);}
 function clearAccess(){el('questionPasswordAccessForm').reset();el('questionPasswordAccessMessage').textContent='';}
 function errorMessage(error){return error?.message||'No se pudo completar la operación.';}
 function request(action){
  let r;
  try{r=record();}catch(e){alert(errorMessage(e));return;}
  if(!r||unlocked)return action();
  pending=action;clearAccess();rawOpen('questionPasswordAccessModal');
  el('questionPasswordAccessInput').focus();
 }
 window.openModal=function(id){
  if(protectedModals.has(id))return request(()=>rawOpen(id));
  return rawOpen(id);
 };
 function relockAfterExit(){
  queueMicrotask(()=>{
   const active=[...protectedModals].some(id=>el(id)?.classList.contains('show')||(id==='fullDbEditor'&&el(id)?.style.display==='flex'));
   if(!active&&!pending)unlocked=false;
  });
 }
 window.closeModal=function(id){
  const result=rawClose(id);
  if(protectedModals.has(id))relockAfterExit();
  return result;
 };
 // Proteger las entradas y acciones de gestión, además de sus diálogos.
 ['openQuestionManagement','openQuestionCorrection','openEditor','openDatabaseViewer','openMarkedQuestions','openFullDatabaseEditor','DBOpenEditor','newQuestion','editQuestion','editDatabaseQuestion','saveQuestion','saveDatabaseQuestion','deleteQuestionAt','deleteQuestion','deleteDatabaseQuestion','importQuestionsDatabase','exportQuestionsDatabase'].forEach(name=>{
  const original=window[name];
  if(typeof original==='function')window[name]=function(...args){return request(()=>original.apply(this,args));};
 });
 function refreshSettings(){
  const r=record();
  el('questionPasswordState').textContent=r?'Protección activada.':'La gestión está actualmente sin contraseña.';
  el('questionPasswordCurrentGroup').hidden=!r;
  el('questionPasswordCurrent').required=!!r;
  el('questionPasswordSave').textContent=r?'Cambiar contraseña':'Establecer contraseña';
  el('questionPasswordRemove').hidden=!r;
 }
 window.openQuestionPasswordSettings=function(){
  el('questionPasswordSettingsForm').reset();el('questionPasswordSettingsMessage').textContent='';
  try{refreshSettings();rawClose('settingsMenuModal');rawOpen('questionPasswordSettingsModal');
   el(record()?'questionPasswordCurrent':'questionPasswordNew').focus();
  }catch(e){alert(errorMessage(e));}
 };
 function setBusy(value){
  busy=value;
  ['questionPasswordSave','questionPasswordRemove','questionPasswordSettingsClose','questionPasswordUnlock','questionPasswordCancel'].forEach(id=>el(id).disabled=value);
 }
 function dismissAccess(){
  if(busy)return;
  pending=null;clearAccess();rawClose('questionPasswordAccessModal');rawOpen('settingsMenuModal');
 }
 async function unlock(event){
  event.preventDefault();if(busy)return;setBusy(true);
  try{
   const r=record();
   if(r&&!await matches(el('questionPasswordAccessInput').value,r)){
    el('questionPasswordAccessMessage').textContent='Contraseña incorrecta.';el('questionPasswordAccessInput').value='';el('questionPasswordAccessInput').focus();return;
   }
   unlocked=true;const action=pending;pending=null;clearAccess();rawClose('questionPasswordAccessModal');
   if(action)action();
  }catch(e){el('questionPasswordAccessMessage').textContent=errorMessage(e);}
  finally{setBusy(false);}
 }
 async function updatePassword(remove){
  if(busy)return;setBusy(true);
  const message=el('questionPasswordSettingsMessage');message.textContent='';message.style.color='#ffb4ab';
  try{
   const r=record();
   if(r&&!await matches(el('questionPasswordCurrent').value,r)){message.textContent='La contraseña actual no es correcta.';return;}
   if(remove){
    if(!r){message.textContent='No hay ninguna contraseña configurada.';return;}
    localStorage.removeItem(KEY);
   }else{
    const password=el('questionPasswordNew').value;
    if(password.length<4){message.textContent='Usa al menos 4 caracteres.';return;}
    if(password!==el('questionPasswordConfirm').value){message.textContent='Las nuevas contraseñas no coinciden.';return;}
    const salt=crypto.getRandomValues(new Uint8Array(16));const hash=await derive(password,salt);
    localStorage.setItem(KEY,JSON.stringify({version:1,iterations:210000,salt:[...salt],hash:[...hash]}));
   }
   unlocked=false;pending=null;el('questionPasswordSettingsForm').reset();refreshSettings();
   message.style.color='#b6d8ae';message.textContent=remove?'Contraseña eliminada.':r?'Contraseña cambiada.':'Contraseña establecida.';
  }catch(e){message.style.color='#ffb4ab';message.textContent=errorMessage(e);}
  finally{setBusy(false);}
 }
 function install(){
  document.body.insertAdjacentHTML('beforeend',html);
  const grid=document.querySelector('#settingsMenuModal .settings-menu-grid');
  if(grid){
   const button=document.createElement('button');button.className='menu-action';button.type='button';
   button.innerHTML='🔐<span><b>Contraseña de gestión</b><small>Establecer, cambiar o quitar</small></span>';
   button.onclick=window.openQuestionPasswordSettings;grid.appendChild(button);
  }
  el('questionPasswordAccessForm').addEventListener('submit',unlock);
  el('questionPasswordCancel').addEventListener('click',dismissAccess);
  el('questionPasswordSettingsForm').addEventListener('submit',e=>{e.preventDefault();updatePassword(false);});
  el('questionPasswordRemove').addEventListener('click',()=>updatePassword(true));
  el('questionPasswordSettingsClose').addEventListener('click',()=>{
   if(busy)return;el('questionPasswordSettingsForm').reset();rawClose('questionPasswordSettingsModal');rawOpen('settingsMenuModal');
  });
  document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&el('questionPasswordAccessModal').classList.contains('show')){e.preventDefault();dismissAccess();}
  });
  window.addEventListener('storage',e=>{
   if(e.key!==KEY&&e.key!==null)return;
   unlocked=false;pending=null;
   protectedModals.forEach(id=>{if(el(id)?.classList.contains('show'))rawClose(id);if(id==='fullDbEditor'&&el(id))el(id).style.display='none';});
   if(el('questionPasswordAccessModal').classList.contains('show'))dismissAccess();
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
