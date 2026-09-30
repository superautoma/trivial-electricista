from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')
script = '<script src="answer-fix.js?v=1"></script>\n'
if 'answer-fix.js' not in s:
    pos = s.lower().rfind('</body>')
    if pos < 0:
        raise SystemExit('Closing </body> not found')
    s = s[:pos] + script + s[pos:]
else:
    s = re.sub(r'answer-fix\.js(?:\?v=[^"\']+)?</script>', 'answer-fix.js?v=1</script>', s)
p.write_text(s, encoding='utf-8')
print('Installed answer explanation fallback')
