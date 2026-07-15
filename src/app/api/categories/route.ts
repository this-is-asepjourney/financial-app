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
        const type = searchParams.get('type')
        const where: { userId: string; type?: string } = { userId }
        if (type) where.type = type

        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const categoriesData = await prisma.category.findMany({
            where,
            include: {
                _count: {
                    select: { transactions: true },
                },
                transactions: {
                    where: {
                        date: {
                            gte: firstDayOfMonth
                        }
                    },
                    select: {
                        amount: true
                    }
                }
            },
            orderBy: { name: 'asc' },
        })

        const categories = categoriesData.map(cat => {
            const currentMonthTotal = cat.transactions.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { transactions, ...rest } = cat
            return {
                ...rest,
                currentMonthTotal
            }
        })

        return NextResponse.json({ categories })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: 'Gagal mengambil kategori' },
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
        const { name, type, icon, color, budget, isDebtPayment } = body

        if (!name || !type) {
            return NextResponse.json(
                { error: 'Nama dan tipe kategori harus diisi' },
                { status: 400 }
            )
        }

        const category = await prisma.category.create({
            data: {
                userId,
                name,
                type,
                icon: icon || 'folder',
                color: color || '#6366F1',
                budget: budget || null,
                isDebtPayment: isDebtPayment === true,
            },
        })

        return NextResponse.json({ category }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: 'Gagal membuat kategori' },
            { status: 500 }
        )
    }
}