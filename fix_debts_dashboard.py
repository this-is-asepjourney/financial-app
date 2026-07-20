import re

file_path = r'd:\repository\financial-app\src\app\(dashboard)\dashboard\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix debtType in data fetching
old_fetch = """                debts.forEach((d: any) => {
                    if (d.type === 'debt') {
                        debtsSummary.totalRemaining += d.remainingAmount
                        debtsSummary.count++
                    } else if (d.type === 'receivable') {
                        receivablesSummary.totalRemaining += d.remainingAmount
                        receivablesSummary.count++
                    }
                })"""
new_fetch = """                debts.forEach((d: any) => {
                    if (d.debtType === 'debt') {
                        debtsSummary.totalRemaining += d.remainingAmount
                        debtsSummary.count++
                    } else if (d.debtType === 'receivable') {
                        receivablesSummary.totalRemaining += d.remainingAmount
                        receivablesSummary.count++
                    }
                })"""
content = content.replace(old_fetch, new_fetch)

# Fix debtType in topDebts rendering
old_render1 = "d.type === 'debt' ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-600'"
new_render1 = "d.debtType === 'debt' ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-600'"
content = content.replace(old_render1, new_render1)

old_render2 = "d.type === 'debt' ? <ArrowDownRight className=\"h-4 w-4\" /> : <ArrowUpRight className=\"h-4 w-4\" />"
new_render2 = "d.debtType === 'debt' ? <ArrowDownRight className=\"h-4 w-4\" /> : <ArrowUpRight className=\"h-4 w-4\" />"
content = content.replace(old_render2, new_render2)

old_render3 = "d.type === 'debt' ? 'Anda berutang' : 'Berutang ke Anda'"
new_render3 = "d.debtType === 'debt' ? 'Anda berutang' : 'Berutang ke Anda'"
content = content.replace(old_render3, new_render3)

old_render4 = "d.type === 'debt' ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'"
new_render4 = "d.debtType === 'debt' ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'"
content = content.replace(old_render4, new_render4)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
