import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMonthRange } from '@/lib/utils'

export async function GET(request: Request) {
        try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month')
        const date = month ? new Date(month) : new Date()
        const { start, end } = getMonthRange(date)

        const [incomeTransactions, expenseTransactions, transferTransactions] = await Promise.all([
            prisma.transaction.aggregate({
                where: {
                    userId,
                    type: 'income',
                    date: { gte: start, lte: end },
                },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.transaction.aggregate({
                where: {
                    userId,
                    type: 'expense',
                    date: { gte: start, lte: end },
                },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.transaction.aggregate({
                where: {
                    userId,
                    type: 'transfer',
                    date: { gte: start, lte: end },
                },
                _sum: { amount: true },
                _count: true,
            }),
        ])

        const totalIncome = incomeTransactions._sum.amount || 0
        const totalExpenses = expenseTransactions._sum.amount || 0
        const totalTransfers = transferTransactions._sum.amount || 0
        const balance = totalIncome - totalExpenses
        const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0

        // Calculate history for the last 6 months
        const history = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(date)
            d.setMonth(d.getMonth() - i)
            const { start: mStart, end: mEnd } = getMonthRange(d)
            
            const [mInc, mExp] = await Promise.all([
                prisma.transaction.aggregate({
                    where: { userId, type: 'income', date: { gte: mStart, lte: mEnd } },
                    _sum: { amount: true }
                }),
                prisma.transaction.aggregate({
                    where: { userId, type: 'expense', date: { gte: mStart, lte: mEnd } },
                    _sum: { amount: true }
                })
            ])
            history.push({
                month: d.toLocaleString('id-ID', { month: 'short' }),
                income: mInc._sum.amount || 0,
                expense: mExp._sum.amount || 0
            })
        }

        // Calculate expenses by category
        const expensesByCategoryRaw = await prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                userId,
                type: 'expense',
                date: { gte: start, lte: end },
                categoryId: { not: null }
            },
            _sum: { amount: true }
        })

        const categories = await prisma.category.findMany({
            where: { id: { in: expensesByCategoryRaw.map(e => e.categoryId as string) } }
        })

        const expensesByCategory = expensesByCategoryRaw.map(expense => {
            const category = categories.find(c => c.id === expense.categoryId)
            return {
                categoryId: expense.categoryId,
                name: category?.name || 'Lainnya',
                amount: expense._sum.amount || 0,
                color: category?.color || '#8884d8'
            }
        }).sort((a, b) => b.amount - a.amount)

        // Fetch detailed transactions for the month
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: { gte: start, lte: end },
                type: { in: ['income', 'expense'] }
            },
            include: {
                category: true,
                wallet: true
            },
            orderBy: {
                date: 'desc'
            }
        })

        return NextResponse.json({
            summary: {
                month: start,
                totalIncome,
                totalExpenses,
                totalTransfers,
                balance,
                savingsRate,
                transactionCount: {
                    income: incomeTransactions._count,
                    expense: expenseTransactions._count,
                    transfer: transferTransactions._count,
                },
            },
            history,
            expensesByCategory,
            transactions
        })
    } catch (error) {
        console.error('Error generating monthly summary:', error)
        return NextResponse.json(
            { error: 'Gagal membuat ringkasan bulanan' },
            { status: 500 }
        )
    }
}