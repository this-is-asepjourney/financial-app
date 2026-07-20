import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const incomeSources = await prisma.incomeSource.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(incomeSources)
    } catch (error) {
        console.error('Failed to fetch income sources:', error)
        return NextResponse.json({ error: 'Failed to fetch income sources' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const body = await request.json()
        const { name, amount, frequency, type } = body

        if (!name || !amount || !frequency || !type) {
            return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
        }

        const incomeSource = await prisma.incomeSource.create({
            data: {
                userId,
                name,
                amount: parseFloat(amount),
                frequency,
                type
            }
        })

        await updateMonthlyIncomeCache(userId)

        return NextResponse.json(incomeSource)
    } catch (error) {
        console.error('Failed to create income source:', error)
        return NextResponse.json({ error: 'Failed to create income source' }, { status: 500 })
    }
}

async function updateMonthlyIncomeCache(userId: string) {
    const sources = await prisma.incomeSource.findMany({ where: { userId } })
    let totalMonthly = 0
    
    for (const source of sources) {
        if (source.frequency === 'daily') totalMonthly += source.amount * 30
        else if (source.frequency === 'weekly') totalMonthly += source.amount * 4
        else if (source.frequency === 'monthly') totalMonthly += source.amount
        else if (source.frequency === 'yearly') totalMonthly += source.amount / 12
        else if (source.frequency === 'irregular') totalMonthly += source.amount / 12 // Asumsikan rata-rata bulanan
    }

    await prisma.user.update({
        where: { id: userId },
        data: { monthlyIncome: totalMonthly }
    })
}
