import os

pages = [
    'src/app/(dashboard)/transactions/page.tsx',
    'src/app/(dashboard)/debts/page.tsx',
    'src/app/(dashboard)/wallets/page.tsx',
    'src/app/(dashboard)/investments/page.tsx',
    'src/app/(dashboard)/goals/page.tsx',
    'src/app/(dashboard)/budget/page.tsx',
    'src/app/(dashboard)/categories/page.tsx',
]

for filepath in pages:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Common non-responsive headers
    content = content.replace(
        '<div className="flex justify-between items-center">',
        '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">'
    )
    content = content.replace(
        '<div className="flex justify-between items-center mb-6">',
        '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">'
    )
    content = content.replace(
        '<div className="flex justify-between items-center mb-4">',
        '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">'
    )
    
    # Forms inside flex missing wrap or flex-col
    content = content.replace(
        '<div className="flex space-x-2">',
        '<div className="flex flex-wrap gap-2">'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Flex responsiveness fixed!")
