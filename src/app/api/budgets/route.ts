import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const month = searchParams.get('month')

        if (!userId) {
            return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 })
        }

        const where: any = { userId }
        if (month) {
            where.month = new Date(month)
        }

        const budgets = await prisma.budget.findMany({
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

                const currentCategoryIds = new Set(budgets.map((b: any) => b.categoryId))
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
                    const updatedBudgets = await prisma.budget.findMany({
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
                    return NextResponse.json({ budgets: updatedBudgets })
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
        const body = await request.json()
        const { userId, categoryId, amount, month, dueDate, isRecurring } = body

        if (!userId || !categoryId || !amount || !month) {
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

        const budget = await prisma.budget.create({
            data: {
                userId,
                categoryId,
                amount,
                month: new Date(month),
                dueDate: dueDate ? new Date(dueDate) : null,
                isRecurring: isRecurring || false,
                spent: 0,
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
    } catch (error: any) {
        if (error.code === 'P2002') {
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