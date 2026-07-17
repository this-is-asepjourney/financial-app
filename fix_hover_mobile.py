import os

files = [
    'src/app/(dashboard)/wallets/page.tsx',
    'src/app/(dashboard)/investments/page.tsx',
    'src/app/(dashboard)/debts/page.tsx',
    'src/app/(dashboard)/categories/page.tsx'
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Fix invisible buttons on mobile
    content = content.replace(
        'opacity-0 group-hover:opacity-100',
        'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Hover responsiveness fixed!")
