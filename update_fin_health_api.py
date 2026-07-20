import re

file_path = r'd:\repository\financial-app\src\app\api\financial-health\route.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fetch User to get paydayDate
old_fetch = """        // 1. Fetch Wallets for Assets & Emergency Fund
        const wallets = await prisma.wallet.findMany({"""
new_fetch = """        // 0. Fetch User settings
        const userDb = await prisma.user.findUnique({
            where: { id: userId },
            select: { paydayDate: true }
        })
        const paydayDate = userDb?.paydayDate || 1

        // 1. Fetch Wallets for Assets & Emergency Fund
        const wallets = await prisma.wallet.findMany({"""
content = content.replace(old_fetch, new_fetch)

# 2. Add paydayDate to financialData
old_fd = """            budgets: budgets,
            avgMonthlyExpenses,
        }"""
new_fd = """            budgets: budgets,
            avgMonthlyExpenses,
            paydayDate,
        }"""
content = content.replace(old_fd, new_fd)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
