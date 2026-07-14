import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const type = searchParams.get('type')

        if (!userId) {
            return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 })
        }

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
            const { transactions: _unused, ...rest } = cat
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
        const body = await request.json()
        const { userId, name, type, icon, color, budget } = body

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