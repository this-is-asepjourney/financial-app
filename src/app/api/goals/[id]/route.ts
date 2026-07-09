import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { goalSchema } from '@/lib/validation'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const validation = goalSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { name, targetAmount, currentAmount, deadline, priority } = validation.data
        const { walletId } = body

        // Get old goal to calculate top up amount
        const oldGoal = await prisma.financialGoal.findUnique({
            where: { id }
        })

        if (!oldGoal) {
             return NextResponse.json({ error: 'Goal tidak ditemukan' }, { status: 404 })
        }

        // Check if goal is completed
        let status = body.status || 'active'
        if (currentAmount >= targetAmount && status !== 'cancelled') {
            status = 'completed'
        }

        const goal = await prisma.financialGoal.update({
            where: { id },
            data: {
                name,
                targetAmount,
                currentAmount,
                deadline: deadline ? new Date(deadline) : null,
                priority,
                status,
            },
        })

        // Deduct from wallet if walletId is provided and it's a top up
        const topUpAmount = currentAmount - oldGoal.currentAmount
        if (walletId && topUpAmount > 0) {
            await prisma.wallet.update({
                where: { id: walletId },
                data: {
                    balance: { decrement: topUpAmount }
                }
            })
        }

        return NextResponse.json({ goal })
    } catch (error) {
        console.error('Error updating goal:', error)
        return NextResponse.json(
            { error: 'Gagal mengupdate goal' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.financialGoal.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Error deleting goal:', err)
        return NextResponse.json(
            { error: 'Gagal menghapus goal' },
            { status: 500 }
        )
    }
}