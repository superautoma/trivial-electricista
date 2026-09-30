from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Keep the review script and bust the browser/PWA cache whenever this feature changes.
marker = 'review-flags.js'
if marker not in s:
    script = '<script src="review-flags.js?v=6"></script>\n'
    pos = s.lower().rfind('</body>')
    if pos < 0:
        raise SystemExit('Closing </body> not found')
    s = s[:pos] + script + s[pos:]
else:
    import re
    s = re.sub(r'review-flags\\.js(?:\\?v=[^"\']+)?</script>', 'review-flags.js?v=6</script>', s)

# Fix the title size on phones and keep it compact on desktop.
css_marker = '/* TE_HEADER_SIZE_FIX_V1 */'
if css_marker not in s:
    css = '''\n<style id="te-header-size-fix">\n/* TE_HEADER_SIZE_FIX_V1 */\nheader h1{font-size:clamp(30px,5vw,52px)!important;line-height:1.02!important;margin:4px 0!important;max-width:100%;}\n@media(max-width:600px){header{align-items:flex-start!important;}header h1{font-size:28px!important;line-height:1.02!important;letter-spacing:-.5px!important;max-width:calc(100vw - 24px);}}\n</style>\n'''
    pos = s.lower().find('</head>')
    if pos < 0:
        raise SystemExit('Closing </head> not found')
    s = s[:pos] + css + s[pos:]

p.write_text(s, encoding='utf-8')
print('Applied review script v6 and header size fix')
