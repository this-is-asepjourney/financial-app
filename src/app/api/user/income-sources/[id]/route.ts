import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const { id } = await params
        const userId = session.user.id

        // Verify ownership
        const source = await prisma.incomeSource.findUnique({ where: { id } })
        if (!source || source.userId !== userId) {
            return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
        }

        await prisma.incomeSource.delete({
            where: { id }
        })

        await updateMonthlyIncomeCache(userId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete income source:', error)
        return NextResponse.json({ error: 'Failed to delete income source' }, { status: 500 })
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
        else if (source.frequency === 'irregular') totalMonthly += source.amount / 12
    }

    await prisma.user.update({
        where: { id: userId },
        data: { monthlyIncome: totalMonthly }
    })
}
