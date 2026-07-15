import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const { name, type, amount, currentValue, returns, startDate, notes } = body

        const investment = await prisma.investment.update({
            where: { id },
            data: {
                name,
                type,
                amount: parseFloat(amount),
                currentValue: currentValue ? parseFloat(currentValue) : null,
                returns: returns ? parseFloat(returns) : null,
                startDate: new Date(startDate),
                notes: notes || null,
            },
        })

        return NextResponse.json({ investment })
    } catch (error) {
        console.error('Error updating investment:', error)
        return NextResponse.json({ error: 'Gagal mengupdate investasi' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        await prisma.investment.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting investment:', error)
        return NextResponse.json({ error: 'Gagal menghapus investasi' }, { status: 500 })
    }
}
