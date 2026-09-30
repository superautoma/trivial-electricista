from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
old_css = '.answer-explanation{margin:14px 0 4px;padding:12px 14px;border-left:4px solid #d9a52b;border-radius:10px;background:#fff8df;color:#2a2117;text-align:left}'
new_css = old_css + ';display:none!important}.answer-explanation.visible{display:block!important}'
if old_css in s and '.answer-explanation.visible{display:block!important}' not in s:
    s = s.replace(old_css, new_css, 1)
old_reset = 'const explanationBox=document.getElementById("answerExplanation"); if(explanationBox){explanationBox.style.display="none";explanationBox.innerHTML="";}'
new_reset = 'const explanationBox=document.getElementById("answerExplanation"); if(explanationBox){explanationBox.classList.remove("visible"); explanationBox.style.setProperty("display","none","important"); explanationBox.innerHTML="";}'
s = s.replace(old_reset, new_reset)
old_show = 'box.classList.add("visible");\n   box.style.display="block";'
new_show = 'box.classList.add("visible");\n   box.style.setProperty("display","block","important");'
s = s.replace(old_show, new_show)
p.write_text(s, encoding='utf-8')
