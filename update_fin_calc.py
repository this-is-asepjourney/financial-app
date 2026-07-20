import re

file_path = r'd:\repository\financial-app\src\lib\financial-calculation.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_bud = """    // Budgets
    budgets: { amount: number; spent: number }[]
}"""
new_bud = """    // Budgets
    budgets: { amount: number; spent: number }[]
    
    // Core Settings
    paydayDate?: number
}"""
content = content.replace(old_bud, new_bud)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
