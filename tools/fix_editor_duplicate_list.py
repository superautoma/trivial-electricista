from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = 'id="fix-editor-duplicate-list"'
if marker not in s:
    css = '''<style id="fix-editor-duplicate-list">
/* The old editor list (#editorList) was left visible beside the new paginated database list. */
#editorModal #editorList { display: none !important; }
#editorModal #dbPaginatedHost { display: block !important; width: 100% !important; }
</style>\n'''
    pos = s.lower().find('</head>')
    if pos < 0:
        raise SystemExit('Closing </head> not found')
    s = s[:pos] + css + s[pos:]
    p.write_text(s, encoding='utf-8')
    print('Applied duplicate-list fix')
else:
    print('Duplicate-list fix already present')
