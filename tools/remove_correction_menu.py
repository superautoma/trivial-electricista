from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

line = '<button class="menu-action" onclick="closeModal(\'settingsMenuModal\');openQuestionCorrection()">✏️<span><b>Corrección de preguntas</b><small>Revisar y modificar preguntas</small></span></button>\n'

if line in s:
    s = s.replace(line, '', 1)
    p.write_text(s, encoding='utf-8')
    print('Removed Corrección de preguntas from the main game menu')
else:
    if 'Corrección de preguntas' not in s:
        print('Menu entry already absent')
    else:
        raise SystemExit('The correction menu entry was found, but its exact markup did not match; no changes made')
