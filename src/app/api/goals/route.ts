import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { goalSchema } from '@/lib/validation'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const status = searchParams.get('status')

        if (!userId) {
            return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 })
        }
        const where: { userId: string; status?: string } = { userId }
        if (status && status !== 'all') where.status = status

        const goals = await prisma.financialGoal.findMany({
            where,
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        })

        return NextResponse.json({ goals })
    } catch (error) {
        console.error('Error fetching goals:', error)
        return NextResponse.json(
            { error: 'Gagal mengambil goals' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validation = goalSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { name, targetAmount, currentAmount, deadline, priority } = validation.data
        const userId = body.userId

        const goal = await prisma.financialGoal.create({
            data: {
                userId,
                name,
                targetAmount,
                currentAmount: currentAmount || 0,
                deadline: deadline ? new Date(deadline) : null,
                priority,
                status: 'active',
            },
        })

        return NextResponse.json({ goal }, { status: 201 })
    } catch (error) {
        console.error('Error creating goal:', error)
        return NextResponse.json(
            { error: 'Gagal membuat goal' },
            { status: 500 }
        )
    }
}