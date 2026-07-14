import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { goalSchema } from '@/lib/validation'

export async function GET(request: Request) {
        try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
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
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const body = await request.json()
        const validation = goalSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { name, targetAmount, currentAmount, deadline, priority } = validation.data
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