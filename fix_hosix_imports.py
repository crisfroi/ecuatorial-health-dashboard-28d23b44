from pathlib import Path
import re

root = Path(r'c:/Users/HP/Desktop/Proyectos y Empresas/geprostec/RENAPROSA/Renaprosa2/SERMED2')
pattern = re.compile(r"from ['\"]@/integrations/supabase/client['\"]")
replacement = "from '@/integrations/supabase/hosixClient'"
updated = 0
files = list(root.glob('src/hooks/useHosix*.ts'))
files += [p for p in root.rglob('*.ts*') if 'src/components/hosix' in p.as_posix()]
files += [p for p in root.rglob('*.ts*') if 'src/pages/Hosix' in p.as_posix()]
for f in files:
    text = f.read_text(encoding='utf-8')
    new_text, count = pattern.subn(replacement, text)
    if count:
        f.write_text(new_text, encoding='utf-8')
        updated += 1
        print(f'Updated {count} occurrence(s) in {f}')
print(f'Updated {updated} files')
