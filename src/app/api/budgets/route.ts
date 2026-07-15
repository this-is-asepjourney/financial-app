import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

    export async function GET(request: Request) {
        try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month')
        const where: { userId: string; month?: Date } = { userId }
        if (month) {
            where.month = new Date(month)
        }

        let budgets = await prisma.budget.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        color: true,
                    },
                },
            },
            orderBy: { category: { name: 'asc' } },
        })

        if (month) {
            const currentMonth = new Date(month)
            
            // Auto-forwarding logic for recurring budgets
            const pastRecurringBudgets = await prisma.budget.findMany({
                where: {
                    userId,
                    isRecurring: true,
                    month: { lt: currentMonth }
                },
                orderBy: { month: 'desc' }
            })

            if (pastRecurringBudgets.length > 0) {
                // Group by categoryId to get the latest one
                const latestRecurring = new Map()
                for (const b of pastRecurringBudgets) {
                    if (!latestRecurring.has(b.categoryId)) {
                        latestRecurring.set(b.categoryId, b)
                    }
                }

                const currentCategoryIds = new Set(budgets.map((b) => b.categoryId))
                const newBudgetsToCreate = []

                for (const [categoryId, pastBudget] of latestRecurring.entries()) {
                    if (!currentCategoryIds.has(categoryId)) {
                        let newDueDate = null
                        if (pastBudget.dueDate) {
                            newDueDate = new Date(pastBudget.dueDate)
                            newDueDate.setFullYear(currentMonth.getFullYear(), currentMonth.getMonth())
                        }

                        newBudgetsToCreate.push({
                            userId,
                            categoryId,
                            amount: pastBudget.amount,
                            month: currentMonth,
                            dueDate: newDueDate,
                            isRecurring: true,
                            spent: 0
                        })
                    }
                }

                if (newBudgetsToCreate.length > 0) {
                    await prisma.budget.createMany({
                        data: newBudgetsToCreate
                    })
                    
                    // Re-fetch to include the newly created budgets
                    budgets = await prisma.budget.findMany({
                        where,
                        include: {
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                    icon: true,
                                    color: true,
                                },
                            },
                        },
                        orderBy: { category: { name: 'asc' } },
                    })
                }
            }

            // Sync 'spent' with actual transactions for the month
            const startOfMonth = new Date(month)
            const endOfMonth = new Date(startOfMonth)
            endOfMonth.setMonth(endOfMonth.getMonth() + 1)
            
            const expenses = await prisma.transaction.groupBy({
                by: ['categoryId'],
                where: {
                    userId,
                    type: 'expense',
                    date: {
                        gte: startOfMonth,
                        lt: endOfMonth,
                    },
                    categoryId: {
                        in: budgets.map((b) => b.categoryId)
                    }
                },
                _sum: {
                    amount: true
                }
            })
            
            const spentMap = new Map(expenses.map(e => [e.categoryId, e._sum.amount || 0]))
            
            for (const budget of budgets) {
                const actualSpent = spentMap.get(budget.categoryId) || 0;
                if (budget.spent !== actualSpent) {
                    await prisma.budget.update({
                        where: { id: budget.id },
                        data: { spent: actualSpent }
                    })
                    budget.spent = actualSpent
                }
            }
        }

        return NextResponse.json({ budgets })
    } catch (error) {
        console.error('Error fetching budgets:', error)
        return NextResponse.json(
            { error: 'Gagal mengambil budget' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
        try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const body = await request.json()
        const { categoryId, amount, month, dueDate, isRecurring } = body

        if (!categoryId || !amount || !month) {
            return NextResponse.json(
                { error: 'Data tidak lengkap' },
                { status: 400 }
            )
        }

        // Check if budget already exists for this month
        const existingBudget = await prisma.budget.findFirst({
            where: {
                userId,
                categoryId,
                month: new Date(month),
            },
        })

        if (existingBudget) {
            return NextResponse.json(
                { error: 'Budget untuk kategori ini pada bulan tersebut sudah ada' },
                { status: 400 }
            )
        }

        // Calculate initial spent from existing transactions for this month and category
        const startOfMonth = new Date(month)
        const endOfMonth = new Date(startOfMonth)
        endOfMonth.setMonth(endOfMonth.getMonth() + 1)

        const expenses = await prisma.transaction.aggregate({
            where: {
                userId,
                categoryId,
                type: 'expense',
                date: {
                    gte: startOfMonth,
                    lt: endOfMonth,
                }
            },
            _sum: {
                amount: true
            }
        })
        const initialSpent = expenses._sum.amount || 0;

        const budget = await prisma.budget.create({
            data: {
                userId,
                categoryId,
                amount,
                month: new Date(month),
                dueDate: dueDate ? new Date(dueDate) : null,
                isRecurring: isRecurring || false,
                spent: initialSpent,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        color: true,
                    },
                },
            },
        })

        return NextResponse.json({ budget }, { status: 201 })
    } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Budget untuk kategori ini sudah ada' },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Gagal membuat budget' },
            { status: 500 }
        )
    }
}