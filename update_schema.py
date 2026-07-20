import re

file_path = r'd:\repository\financial-app\prisma\schema.prisma'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_str = """  monthlyIncome  Float     @default(0)
  currency       String    @default("IDR")
  createdAt      DateTime  @default(now())"""
new_str = """  monthlyIncome  Float     @default(0)
  currency       String    @default("IDR")
  paydayDate     Int       @default(1)
  createdAt      DateTime  @default(now())"""

content = content.replace(old_str, new_str)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
