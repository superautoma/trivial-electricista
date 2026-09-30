from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = 'id="fix-editor-duplicate-list-global-v2"'
if marker not in s:
    css = '''<style id="fix-editor-duplicate-list-global-v2">
/* The legacy editor list can live outside #editorModal. Hide it globally so
   the paginated database editor is the only question list shown. */
#editorList { display: none !important; }
#dbPaginatedHost { display: block !important; width: 100% !important; max-width: none !important; box-sizing: border-box !important; }
</style>\n'''
    pos = s.lower().find('</head>')
    if pos < 0:
        raise SystemExit('Closing </head> not found')
    s = s[:pos] + css + s[pos:]
    p.write_text(s, encoding='utf-8')
    print('Applied global duplicate-list fix')
else:
    print('Global duplicate-list fix already present')
