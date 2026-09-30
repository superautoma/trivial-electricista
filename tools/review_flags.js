/* Trivial Electricista - marcar preguntas para revisar posteriormente. */
(function () {
  'use strict';
  const KEY = 'trivialElectricista_reviewFlags_v1';
  const BTN_ID = 'te-review-mark-btn';
  const LIST_ID = 'te-review-list-btn';
  const STYLE_ID = 'te-review-flags-style';
  const MODAL_ID = 'te-review-modal';

  function readFlags() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }
  function writeFlags(v) { localStorage.setItem(KEY, JSON.stringify(v)); }
  function visible(el) {
    if (!el) return false;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  }
  function cleanText(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function currentQuestion() {
    // Prefer a visible question heading in the active question/game area.
    const candidates = Array.from(document.querySelectorAll('h1,h2,h3,h4,p,div,span'))
      .filter(visible)
      .map(el => ({el, text: cleanText(el.textContent)}))
      .filter(x => x.text.startsWith('¿') && x.text.includes('?') && x.text.length >= 20 && x.text.length <= 500));
    // Avoid editor/database cards when the editor is open.
    const editorOpen = Array.from(document.querySelectorAll('body *')).some(el => visible(el) && /Editor de preguntas y respuestas/i.test(cleanText(el.textContent)));
    const filtered = editorOpen ? candidates.filter(x => !x.text.includes('¿Qué tensión corresponde normalmente') || !x.el.closest('#dbPaginatedHost')) : candidates;
    if (!filtered.length) return null;
    // The smallest element containing the question is generally the actual question label.
    filtered.sort((a,b) => a.text.length - b.text.length);
    const x = filtered[0];
    return { text: x.text, el: x.el };
  }
  function keyFor(text) {
    let h = 2166136261;
    for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h,16777619); }
    return 'q_' + (h >>> 0).toString(16);
  }
  function isEditorVisible() {
    return Array.from(document.querySelectorAll('body *')).some(el => visible(el) && /Editor de preguntas y respuestas/i.test(cleanText(el.textContent)));
  }
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style'); s.id = STYLE_ID;
    s.textContent = `
#${BTN_ID},#${LIST_ID}{position:fixed;z-index:2147483640;border:2px solid #a87925;border-radius:14px;padding:10px 14px;font:700 16px system-ui,sans-serif;box-shadow:0 4px 14px #0008;cursor:pointer}
#${BTN_ID}{right:14px;bottom:86px;background:#ffd34f;color:#20170f}
#${LIST_ID}{left:14px;bottom:86px;background:#3b3025;color:#fff}
#${MODAL_ID}{position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}
#${MODAL_ID} .te-review-box{max-width:760px;width:100%;max-height:88vh;overflow:auto;background:#241a12;color:#fff;border:3px solid #a87925;border-radius:18px;padding:18px;box-sizing:border-box;font-family:system-ui,sans-serif}
#${MODAL_ID} .te-item{border:1px solid #8d672e;border-radius:12px;padding:12px;margin:10px 0;background:#302217}
#${MODAL_ID} .te-item button{margin:8px 8px 0 0;border:0;border-radius:9px;padding:8px 12px;font-weight:700;cursor:pointer}
#${MODAL_ID} .te-close{background:#666;color:#fff} #${MODAL_ID} .te-unmark{background:#e6b72f;color:#20170f}
@media(max-width:600px){#${BTN_ID},#${LIST_ID}{font-size:14px;padding:9px 11px}}
`;
    document.head.appendChild(s);
  }
  function ensureButtons() {
    ensureStyle();
    let mark = document.getElementById(BTN_ID);
    let list = document.getElementById(LIST_ID);
    if (!mark) { mark=document.createElement('button'); mark.id=BTN_ID; mark.type='button'; document.body.appendChild(mark); mark.addEventListener('click', markCurrent); }
    if (!list) { list=document.createElement('button'); list.id=LIST_ID; list.type='button'; document.body.appendChild(list); list.addEventListener('click', showReviewList); }
    const flags=readFlags(); list.textContent='📋 Revisar marcadas ('+Object.keys(flags).length+')';
    const q=currentQuestion();
    mark.style.display=(!isEditorVisible() && q) ? 'block' : 'none';
    if (q) { const k=keyFor(q.text); mark.textContent=flags[k]?'✅ Marcada para revisar':'⚠️ Marcar para revisar'; mark.dataset.key=k; }
    list.style.display=Object.keys(flags).length ? 'block' : 'none';
  }
  function markCurrent() {
    const q=currentQuestion(); if (!q) return;
    const flags=readFlags(), k=keyFor(q.text);
    if (flags[k]) { delete flags[k]; writeFlags(flags); }
    else { flags[k]={question:q.text,markedAt:new Date().toISOString()}; writeFlags(flags); }
    ensureButtons();
  }
  function showReviewList() {
    const old=document.getElementById(MODAL_ID); if(old) old.remove();
    const flags=readFlags(), keys=Object.keys(flags);
    const m=document.createElement('div'); m.id=MODAL_ID;
    const box=document.createElement('div'); box.className='te-review-box';
    box.innerHTML='<h2>⚠️ Preguntas para revisar</h2><p>Estas preguntas quedan guardadas en este dispositivo para corregirlas después.</p>';
    if(!keys.length) box.innerHTML += '<p>No hay preguntas marcadas.</p>';
    keys.forEach(k=>{
      const item=document.createElement('div'); item.className='te-item';
      const p=document.createElement('div'); p.textContent=flags[k].question;
      const b=document.createElement('button'); b.className='te-unmark'; b.textContent='✓ Quitar marca';
      b.onclick=()=>{const f=readFlags();delete f[k];writeFlags(f);item.remove();ensureButtons();};
      item.appendChild(p);item.appendChild(b);box.appendChild(item);
    });
    const close=document.createElement('button'); close.className='te-close'; close.textContent='Cerrar'; close.onclick=()=>m.remove(); box.appendChild(close);
    m.appendChild(box); document.body.appendChild(m);
  }
  function init(){ ensureButtons(); setInterval(ensureButtons,1000); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
