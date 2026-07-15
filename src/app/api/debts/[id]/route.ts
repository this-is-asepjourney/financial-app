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
        const { name, type, totalAmount, remainingAmount, monthlyPayment, interestRate, dueDate } = body

        const debt = await prisma.debt.update({
            where: { id },
            data: {
                name,
                type,
                totalAmount: parseFloat(totalAmount),
                remainingAmount: parseFloat(remainingAmount),
                monthlyPayment: parseFloat(monthlyPayment),
                interestRate: interestRate ? parseFloat(interestRate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        })

        return NextResponse.json({ debt })
    } catch (error) {
        console.error('Error updating debt:', error)
        return NextResponse.json({ error: 'Gagal mengupdate utang' }, { status: 500 })
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
        await prisma.debt.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting debt:', error)
        return NextResponse.json({ error: 'Gagal menghapus utang' }, { status: 500 })
    }
}
