from pathlib import Path
import re

root = Path('src')
files = list(root.glob('components/hosix/**/*.*')) + list(root.glob('hooks/useHosix*.ts'))
imports = set()
for f in files:
    if not f.is_file():
        continue
    text = f.read_text(encoding='utf-8')
    for line in text.splitlines():
        m = re.match(r"\s*import .* from ['\"](.+)['\"]", line)
        if m:
            imports.add(m.group(1))
        m2 = re.match(r"\s*import\(['\"](.+)['\"]\)", line)
        if m2:
            imports.add(m2.group(1))

for imp in sorted(imports):
    print(imp)
