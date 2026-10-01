from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Keep exactly one current review script and bust browser/PWA caches.
script = '<script src="review-flags.js?v=8"></script>\n'
if 'review-flags.js' not in s:
    pos = s.lower().rfind('</body>')
    if pos < 0:
        raise SystemExit('Closing </body> not found')
    s = s[:pos] + script + s[pos:]
else:
    s = re.sub(r'<script[^>]+src=["\']review-flags\.js[^>]*></script>\s*', script, s, flags=re.I)

# Keep the reliable answer explanation fallback.
answer_script = '<script src="answer-fix.js?v=1"></script>\n'
if 'answer-fix.js' not in s:
    pos = s.lower().rfind('</body>')
    if pos < 0:
        raise SystemExit('Closing </body> not found')
    s = s[:pos] + answer_script + s[pos:]
else:
    s = re.sub(r'<script[^>]+src=["\']answer-fix\.js[^>]*></script>\s*', answer_script, s, flags=re.I)

css_marker = '/* TE_HEADER_SIZE_FIX_V1 */'
if css_marker not in s:
    css = '''\n<style id="te-header-size-fix">\n/* TE_HEADER_SIZE_FIX_V1 */\nheader h1{font-size:clamp(30px,5vw,52px)!important;line-height:1.02!important;margin:4px 0!important;max-width:100%;}\n@media(max-width:600px){header{align-items:flex-start!important;}header h1{font-size:28px!important;line-height:1.02!important;letter-spacing:-.5px!important;max-width:calc(100vw - 24px);}}\n</style>\n'''
    pos = s.lower().find('</head>')
    if pos < 0:
        raise SystemExit('Closing </head> not found')
    s = s[:pos] + css + s[pos:]

p.write_text(s, encoding='utf-8')
print('Applied review script v8, answer explanation fallback and header size fix')
