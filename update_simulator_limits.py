import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\financial-health\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Improve handleSimChange logic
old_handle_sim_change = """    // Handle simulation changes
    const handleSimChange = (field: keyof FinancialData, value: number) => {
        if (!simData) return
        const newData = { ...simData, [field]: value }
        
        // Auto-recalculate related fields if necessary (e.g. monthlySavings)
        newData.monthlySavings = newData.monthlyIncome - newData.monthlyExpenses
        
        setSimData(newData)
        setSimHealth(calculateFinHealthScore(newData))
    }"""

new_handle_sim_change = """    // Handle simulation changes
    const handleSimChange = (field: keyof FinancialData, value: number) => {
        if (!simData) return
        const newData = { ...simData, [field]: value }
        
        // Logical bounds:
        // Expenses cannot exceed Income
        if (newData.monthlyExpenses > newData.monthlyIncome) {
            newData.monthlyExpenses = newData.monthlyIncome
        }
        // Debt Payments cannot exceed Expenses (since they are a subset of expenses realistically)
        if (newData.monthlyDebtPayments > newData.monthlyExpenses) {
            newData.monthlyDebtPayments = newData.monthlyExpenses
        }
        
        // Auto-recalculate related fields if necessary (e.g. monthlySavings)
        newData.monthlySavings = newData.monthlyIncome - newData.monthlyExpenses
        
        setSimData(newData)
        setSimHealth(calculateFinHealthScore(newData))
    }"""

content = content.replace(old_handle_sim_change, new_handle_sim_change)

# 2. Update Input Limits
old_income = """<input 
                                    type="range" 
                                    min={0} max={Math.max(simData.monthlyIncome * 3, 50000000)} step={500000}
                                    value={simData.monthlyIncome}"""
new_income = """<input 
                                    type="range" 
                                    min={0} max={Math.max((realData?.monthlyIncome || 10000000) * 3, 50000000)} step={100000}
                                    value={simData.monthlyIncome}"""
content = content.replace(old_income, new_income)


old_expense = """<input 
                                    type="range" 
                                    min={0} max={Math.max(simData.monthlyExpenses * 2, 30000000)} step={100000}
                                    value={simData.monthlyExpenses}"""
new_expense = """<input 
                                    type="range" 
                                    min={0} max={simData.monthlyIncome} step={100000}
                                    value={simData.monthlyExpenses}"""
content = content.replace(old_expense, new_expense)


old_debt = """<input 
                                    type="range" 
                                    min={0} max={Math.max(simData.monthlyDebtPayments * 3, 20000000)} step={100000}
                                    value={simData.monthlyDebtPayments}"""
new_debt = """<input 
                                    type="range" 
                                    min={0} max={simData.monthlyIncome} step={100000}
                                    value={simData.monthlyDebtPayments}"""
content = content.replace(old_debt, new_debt)


old_efund = """<input 
                                    type="range" 
                                    min={0} max={Math.max(simData.emergencyFund * 3, 100000000)} step={500000}
                                    value={simData.emergencyFund}"""
new_efund = """<input 
                                    type="range" 
                                    min={0} max={Math.max((realData?.totalAssets || 0) * 2, (simData.monthlyExpenses || 5000000) * 12, 50000000)} step={100000}
                                    value={simData.emergencyFund}"""
content = content.replace(old_efund, new_efund)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
