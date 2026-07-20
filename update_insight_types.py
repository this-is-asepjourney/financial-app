import re

file_path = r'd:\repository\financial-app\src\lib\financial-calculation.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_core = """    // Core Settings
    paydayDate?: number
}"""
new_core = """    // Core Settings
    paydayDate?: number
    
    // Insights
    topWantsCategory?: { name: string, amount: number }
    topNeedsCategory?: { name: string, amount: number }
}"""
content = content.replace(old_core, new_core)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
