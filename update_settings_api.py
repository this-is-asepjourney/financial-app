import re

file_path = r'd:\repository\financial-app\src\app\api\user\settings\route.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Destructure paydayDate
old_destruct = "const { name, email, monthlyIncome, currency, currentPassword, newPassword } = body"
new_destruct = "const { name, email, monthlyIncome, currency, paydayDate, currentPassword, newPassword } = body"
content = content.replace(old_destruct, new_destruct)

# Set updateData
old_update = """        if (monthlyIncome !== undefined) updateData.monthlyIncome = parseFloat(monthlyIncome)
        if (currency !== undefined) updateData.currency = currency"""
new_update = """        if (monthlyIncome !== undefined) updateData.monthlyIncome = parseFloat(monthlyIncome)
        if (currency !== undefined) updateData.currency = currency
        if (paydayDate !== undefined) updateData.paydayDate = parseInt(paydayDate, 10)"""
content = content.replace(old_update, new_update)

# Select return
old_select = """                monthlyIncome: true,
                currency: true
            }
        })"""
new_select = """                monthlyIncome: true,
                currency: true,
                paydayDate: true
            }
        })"""
content = content.replace(old_select, new_select)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
