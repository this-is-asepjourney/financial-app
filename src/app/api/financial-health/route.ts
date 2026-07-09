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
                transactions: {
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
            wallet.transactions.forEach((t: any) => {
                if (t.type === 'income') futureNet += t.amount
                if (t.type === 'expense') futureNet -= t.amount
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
            totalDebt,
            investments,
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
            // Placeholder for actual Debt tracking
            Promise.resolve({ _sum: { amount: 0 } }),
            // Investments
            prisma.investment.aggregate({
                where: { userId },
                _sum: { currentValue: true, amount: true },
            }),
        ])

        const monthlyIncomeAmount = monthlyIncome._sum.amount || 0
        const monthlyExpenseAmount = monthlyExpenses._sum.amount || 0
        const investmentTotal = investments._sum.currentValue || investments._sum.amount || 0
        totalAssets += investmentTotal

        // 3. Classify Needs vs Wants heuristically
        let needsExpenses = 0
        let wantsExpenses = 0

        if (expensesByCategory.length > 0) {
            const categories = await prisma.category.findMany({
                where: { id: { in: expensesByCategory.map(e => e.categoryId as string) } }
            })

            expensesByCategory.forEach(expense => {
                const cat = categories.find(c => c.id === expense.categoryId)
                const amount = expense._sum.amount || 0
                const nameLower = (cat?.name || '').toLowerCase()
                
                const isNeed = needsKeywords.some(keyword => nameLower.includes(keyword))
                if (isNeed) {
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
            totalDebt: totalDebt._sum.amount || 0,
            monthlyDebtPayments: 0, 
            creditCardDebt: 0,
            totalAssets: totalAssets,
            investments: investmentTotal,
            retirementSavings: 0,
            hasHealthInsurance: false,
            hasLifeInsurance: false,
            hasDisabilityInsurance: false,
            hasBudget: true, 
            hasFinancialPlan: true,
            hasRetirementPlan: false,
            hasWill: false,
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
                savingsRate: healthScore.save.details.savingsRate,
                emergencyFundMonths: healthScore.save.details.emergencyFundMonths,
                debtToIncomeRatio: healthScore.borrow.details.debtToIncomeRatio,
                financialScore: healthScore.overallScore,
            },
            update: {
                totalIncome: monthlyIncomeAmount,
                totalExpenses: monthlyExpenseAmount,
                totalSavings: financialData.totalSavings,
                savingsRate: healthScore.save.details.savingsRate,
                emergencyFundMonths: healthScore.save.details.emergencyFundMonths,
                debtToIncomeRatio: healthScore.borrow.details.debtToIncomeRatio,
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