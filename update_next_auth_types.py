import re

file_path = r'd:\repository\financial-app\src\types\next-auth.d.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# session user
old_su = """      monthlyIncome?: number | null
      currency?: string | null
    }"""
new_su = """      monthlyIncome?: number | null
      currency?: string | null
      paydayDate?: number | null
    }"""
content = content.replace(old_su, new_su)

# user
old_u = """    monthlyIncome?: number | null
    currency?: string | null
  }
}"""
new_u = """    monthlyIncome?: number | null
    currency?: string | null
    paydayDate?: number | null
  }
}"""
content = content.replace(old_u, new_u)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
