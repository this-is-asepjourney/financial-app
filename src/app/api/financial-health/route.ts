import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateFinHealthScore, FinancialData } from '@/lib/financial-calculation'
import { getMonthRange } from '@/lib/utils'

// Heuristic keywords to classify Needs vs Wants
const needsKeywords = ['makanan', 'listrik', 'air', 'transportasi', 'kesehatan', 'tempat tinggal', 'asuransi', 'pendidikan', 'tagihan', 'kebutuhan', 'pulsa', 'kuota', 'bensin', 'kost', 'sewa']

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 })
        }

        const now = new Date()
        const { start, end } = getMonthRange(now)

        // 1. Fetch Wallets for Assets & Emergency Fund
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wallets = await (prisma as any).wallet.findMany({
            where: { userId },
            include: {
                transactionsFrom: {
                    where: { date: { gt: now } },
                    select: { amount: true, type: true }
                },
                transactionsTo: {
                    where: { date: { gt: now } },
                    select: { amount: true, type: true }
                }
            }
        })

        // Calculate actual current wallet balances (excluding future transactions)
        let totalCashAndBank = 0
        let totalAssets = 0

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wallets.forEach((wallet: any) => {
            let futureNet = 0
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            wallet.transactionsFrom.forEach((t: any) => {
                if (t.type === 'income') futureNet += t.amount
                if (t.type === 'expense' || t.type === 'transfer') futureNet -= t.amount
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            wallet.transactionsTo.forEach((t: any) => {
                if (t.type === 'transfer') futureNet += t.amount
            })
            const currentBalance = wallet.balance - futureNet
            
            totalAssets += currentBalance
            if (wallet.type === 'cash' || wallet.type === 'bank') {
                totalCashAndBank += currentBalance
            }
        })

        // 2. Fetch Transactions & Investments
        const [
            monthlyIncome,
            monthlyExpenses,
            expensesByCategory,
            debts,
            investments,
            budgets,
        ] = await Promise.all([
            // Monthly income
            prisma.transaction.aggregate({
                where: { userId, type: 'income', date: { gte: start, lte: end } },
                _sum: { amount: true },
            }),
            // Monthly expenses
            prisma.transaction.aggregate({
                where: { userId, type: 'expense', date: { gte: start, lte: end } },
                _sum: { amount: true },
            }),
            // Expenses by Category (for Needs vs Wants)
            prisma.transaction.groupBy({
                by: ['categoryId'],
                where: { userId, type: 'expense', date: { gte: start, lte: end }, categoryId: { not: null } },
                _sum: { amount: true }
            }),
            // Debt tracking
            prisma.debt.findMany({ where: { userId } }),
            // Investments
            prisma.investment.aggregate({
                where: { userId },
                _sum: { currentValue: true, amount: true },
            }),
            // Budgets for the current month
            prisma.budget.findMany({ where: { userId, month: start } })
        ])

        const monthlyIncomeAmount = monthlyIncome._sum.amount || 0
        const monthlyExpenseAmount = monthlyExpenses._sum.amount || 0
        const investmentTotal = investments._sum.currentValue || investments._sum.amount || 0
        totalAssets += investmentTotal

        let needsExpenses = 0
        let wantsExpenses = 0
        let monthlyDebtPayments = 0
        let insurancePayments = 0
        let retirementPayments = 0

        // Calculate debts explicitly from Debt model
        let totalDebtAmount = 0
        debts.forEach(debt => {
            totalDebtAmount += debt.remainingAmount || debt.totalAmount;
            monthlyDebtPayments += debt.monthlyPayment;
        });

        if (expensesByCategory.length > 0) {
            const categories = await prisma.category.findMany({
                where: { id: { in: expensesByCategory.map(e => e.categoryId as string) } }
            })

            const debtKeywords = ['hutang', 'cicilan', 'kredit', 'pinjaman', 'paylater']
            const insuranceKeywords = ['asuransi', 'bpjs']
            const retirementKeywords = ['pensiun', 'hari tua', 'jht']

            expensesByCategory.forEach(expense => {
                const cat = categories.find(c => c.id === expense.categoryId)
                const amount = expense._sum.amount || 0
                const nameLower = (cat?.name || '').toLowerCase()
                
                const isNeed = needsKeywords.some(keyword => nameLower.includes(keyword))
                const isDebtCategory = cat?.isDebtPayment || debtKeywords.some(keyword => nameLower.includes(keyword))
                const isInsurance = insuranceKeywords.some(keyword => nameLower.includes(keyword))
                const isRetirement = retirementKeywords.some(keyword => nameLower.includes(keyword))

                // If not tracked in explicit Debt model, add from transactions
                if (isDebtCategory && debts.length === 0) {
                    monthlyDebtPayments += amount
                }
                if (isInsurance) insurancePayments += amount
                if (isRetirement) retirementPayments += amount

                if (isNeed || isDebtCategory || isInsurance) {
                    needsExpenses += amount
                } else {
                    wantsExpenses += amount
                }
            })
        } else {
            // Fallback if no categorized expenses
            needsExpenses = monthlyExpenseAmount * 0.6
            wantsExpenses = monthlyExpenseAmount * 0.4
        }

        // 4. Construct Financial Data
        const financialData: FinancialData = {
            monthlyIncome: monthlyIncomeAmount,
            monthlyExpenses: monthlyExpenseAmount,
            needsExpenses,
            wantsExpenses,
            totalSavings: totalAssets, // Liquid Assets + Investments
            emergencyFund: totalCashAndBank, // Only highly liquid cash/bank
            monthlySavings: monthlyIncomeAmount - monthlyExpenseAmount,
            totalDebt: totalDebtAmount > 0 ? totalDebtAmount : monthlyDebtPayments * 12, // Use explicit debt or estimate
            monthlyDebtPayments: monthlyDebtPayments, 
            creditCardDebt: 0,
            totalAssets: totalAssets,
            investments: investmentTotal,
            retirementSavings: retirementPayments,
            hasHealthInsurance: insurancePayments > 0,
            hasLifeInsurance: false,
            hasDisabilityInsurance: false,
            hasBudget: true, 
            hasFinancialPlan: true,
            hasRetirementPlan: retirementPayments > 0,
            hasWill: false,
            budgets: budgets,
        }

        // 5. Calculate Score
        const healthScore = calculateFinHealthScore(financialData)

        // 6. Save to DB
        await prisma.financialHealth.upsert({
            where: {
                userId_month: { userId, month: start },
            },
            create: {
                userId,
                month: start,
                totalIncome: monthlyIncomeAmount,
                totalExpenses: monthlyExpenseAmount,
                totalSavings: financialData.totalSavings,
                savingsRate: healthScore.savingsRate.value,
                emergencyFundMonths: healthScore.emergencyFund.value,
                debtToIncomeRatio: healthScore.dti.value,
                financialScore: healthScore.overallScore,
            },
            update: {
                totalIncome: monthlyIncomeAmount,
                totalExpenses: monthlyExpenseAmount,
                totalSavings: financialData.totalSavings,
                savingsRate: healthScore.savingsRate.value,
                emergencyFundMonths: healthScore.emergencyFund.value,
                debtToIncomeRatio: healthScore.dti.value,
                financialScore: healthScore.overallScore,
            },
        })

        return NextResponse.json({
            health: healthScore,
            financialData,
            methodology: {
                framework: 'Financial Health Network (FinHealth Score®)',
                dimensions: ['Spend (50/30/20 Rule)', 'Save (Emergency Fund Theory)', 'Borrow (DTI Standards)', 'Plan (Financial Planning Standards)'],
                references: [
                    'Financial Health Network (FHN) - FinHealth Score®',
                    'Elizabeth Warren - 50/30/20 Budgeting Rule',
                    'Dave Ramsey & Suze Orman - Emergency Fund Theory',
                    'Consumer Financial Protection Bureau (CFPB) - DTI Standards',
                    'Wade Pfau - Retirement Savings Rate Research',
                ],
            },
        })
    } catch (error) {
        console.error('Error calculating financial health:', error)
        return NextResponse.json(
            { error: 'Gagal menghitung kesehatan finansial' },
            { status: 500 }
        )
    }
}