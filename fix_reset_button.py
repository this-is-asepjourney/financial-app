import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\financial-health\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Change the condition for the reset button
old_button_cond = "{simHealth.overallScore !== realHealth.overallScore && ("
new_button_cond = "{(simData.monthlyIncome !== realData.monthlyIncome || simData.monthlyExpenses !== realData.monthlyExpenses || simData.monthlyDebtPayments !== realData.monthlyDebtPayments || simData.emergencyFund !== realData.emergencyFund) && ("

content = content.replace(old_button_cond, new_button_cond)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
