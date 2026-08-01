from pathlib import Path
import re

root = Path('src')
entrypoints = [
    root / 'pages' / 'Hosix' / 'HosixLogin.tsx',
    root / 'components' / 'hosix' / 'HosixLayout.tsx',
]

import_re = re.compile(r"import\s+(?:[^'\"]+from\s+)?['\"]([^'\"]+)['\"]")
external_prefixes = [
    'react', '@tanstack', '@supabase', 'react-router-dom', 'date-fns', 'uuid', 'clsx', 'zod', 'sonner',
    'cmdk', 'd3', 'leaflet', 'recharts', 'react-leaflet', 'fast-', 'lodash', 'xlsx', 'input-otp', 'html2canvas',
    'jspdf', 'file-saver', 'topojson', '@radix-', '@hookform', '@types', '@tauri-apps', 'react-dnd', 'react-day-picker',
    'react-resizable-panels', 'next-themes', 'vaul', 'react-dom', 'react-error-boundary', 'lucide-react', 'date-fns/locale',
]

seen = set()
need = set()
stack = []

for ep in entrypoints:
    if ep.exists():
        stack.append(ep)
        need.add(ep)
    else:
        print(f'missing entry: {ep}')

while stack:
    f = stack.pop()
    if f in seen:
        continue
    seen.add(f)
    text = f.read_text(encoding='utf-8')
    for match in import_re.finditer(text):
        imp = match.group(1)
        if any(imp.startswith(prefix) for prefix in external_prefixes):
            continue
        if imp.startswith('@/'):
            candidate = root / imp[2:]
        elif imp.startswith('./') or imp.startswith('../'):
            candidate = (f.parent / imp)
        else:
            continue
        # resolve file path with possible extensions and index files
        candidates = [candidate, candidate.with_suffix('.ts'), candidate.with_suffix('.tsx'), candidate.with_suffix('.js'), candidate.with_suffix('.jsx')]
        if candidate.is_dir():
            candidates += [candidate / 'index.ts', candidate / 'index.tsx', candidate / 'index.js', candidate / 'index.jsx']
        resolved = next((c for c in candidates if c.exists()), None)
        if resolved is None:
            print('unresolved', imp, 'from', f)
            continue
        need.add(resolved)
        if resolved not in seen:
            stack.append(resolved)

print('\nDEPENDENCY FILES:')
for p in sorted(str(p) for p in need):
    print(p)

imports = set()
for p in sorted(need):
    text = p.read_text(encoding='utf-8')
    for match in import_re.finditer(text):
        imp = match.group(1)
        if imp.startswith('@/') or imp.startswith('./') or imp.startswith('../'):
            imports.add(imp)

print('\nLOCAL IMPORTS:')
for imp in sorted(imports):
    print(imp)
