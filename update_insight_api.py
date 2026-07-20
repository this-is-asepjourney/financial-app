import re

file_path = r'd:\repository\financial-app\src\app\api\financial-health\route.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add tracking variables
old_vars = """        let needsExpenses = 0
        let wantsExpenses = 0
        let monthlyDebtPayments = 0
        let insurancePayments = 0
        let retirementPayments = 0"""
new_vars = """        let needsExpenses = 0
        let wantsExpenses = 0
        let monthlyDebtPayments = 0
        let insurancePayments = 0
        let retirementPayments = 0
        
        let topWantsCategory = { name: '', amount: 0 }
        let topNeedsCategory = { name: '', amount: 0 }"""
content = content.replace(old_vars, new_vars)

# Populate tracking variables inside the loop
old_loop = """                if (isNeed || isDebtCategory || isInsurance) {
                    needsExpenses += amount
                } else {
                    wantsExpenses += amount
                }
            })"""
new_loop = """                if (isNeed || isDebtCategory || isInsurance) {
                    needsExpenses += amount
                    if (amount > topNeedsCategory.amount) {
                        topNeedsCategory = { name: cat?.name || 'Kebutuhan', amount }
                    }
                } else {
                    wantsExpenses += amount
                    if (amount > topWantsCategory.amount) {
                        topWantsCategory = { name: cat?.name || 'Keinginan', amount }
                    }
                }
            })"""
content = content.replace(old_loop, new_loop)

# Add to FinancialData
old_fd = """            avgMonthlyExpenses,
            paydayDate,
        }"""
new_fd = """            avgMonthlyExpenses,
            paydayDate,
            topWantsCategory,
            topNeedsCategory,
        }"""
content = content.replace(old_fd, new_fd)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
