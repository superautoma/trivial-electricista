from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
marker = 'review-flags.js'
if marker in s:
    print('Review flags already installed')
    raise SystemExit(0)

script = '<script src="review-flags.js"></script>\n'
pos = s.lower().rfind('</body>')
if pos < 0:
    raise SystemExit('Closing </body> not found')
s = s[:pos] + script + s[pos:]
p.write_text(s, encoding='utf-8')
print('Installed review-flags.js')
