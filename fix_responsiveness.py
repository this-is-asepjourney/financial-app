import os

fixes = [
    {
        'file': 'src/app/(dashboard)/debts/page.tsx',
        'replacements': [
            ('<div className="grid grid-cols-2 gap-4">', '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">'),
            ('<div className="grid grid-cols-2 gap-3', '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3')
        ]
    },
    {
        'file': 'src/app/(dashboard)/wallets/page.tsx',
        'replacements': [
            ('<div className="grid grid-cols-2 gap-3">', '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">')
        ]
    },
    {
        'file': 'src/app/(dashboard)/investments/page.tsx',
        'replacements': [
            ('<div className="grid grid-cols-2 gap-4">', '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">')
        ]
    },
    {
        'file': 'src/app/(dashboard)/categories/page.tsx',
        'replacements': [
            ('<div className="grid grid-cols-6 gap-2', '<div className="grid grid-cols-4 sm:grid-cols-6 gap-2'),
            ('<div className="grid grid-cols-8 gap-2', '<div className="grid grid-cols-5 sm:grid-cols-8 gap-2')
        ]
    }
]

for item in fixes:
    filepath = item['file']
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    for old, new in item['replacements']:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)
        
print("Responsive grid fixes applied!")
