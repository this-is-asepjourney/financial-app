import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { walletSchema } from '@/lib/validation'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
        try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const { id } = await params
        const body = await request.json()
        
        // Allow partial updates for balance only, or full update for editing wallet
        if (body.balance !== undefined && !body.name) {
            // Check current balance to reconcile
            const currentWallet = await prisma.wallet.findUnique({ where: { id } })
            
            // Partial update for balance syncing
            const wallet = await prisma.wallet.update({
                where: { id },
                data: { balance: body.balance }
            })

            // Auto-create adjustment if balance is forced to change (not from a normal transaction route which already handled it)
            if (currentWallet && currentWallet.balance !== body.balance) {
                const diff = body.balance - currentWallet.balance
                await prisma.transaction.create({
                    data: {
                        userId,
                        amount: Math.abs(diff),
                        type: diff > 0 ? 'income' : 'expense',
                        description: 'Penyesuaian Saldo',
                        date: new Date(),
                        walletId: id,
                    }
                })
            }

            return NextResponse.json({ wallet })
        }

        const validation = walletSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { name, type, balance, purpose } = validation.data as { name: string; type: string; balance?: number; purpose?: string }
        
        const currentWallet = await prisma.wallet.findUnique({ where: { id } })

        const wallet = await prisma.wallet.update({
            where: { id },
            data: { name, type, balance: balance !== undefined ? balance : currentWallet?.balance, purpose: purpose || 'operasional' },
        })

        if (currentWallet && balance !== undefined && currentWallet.balance !== balance) {
            const diff = balance - currentWallet.balance
            await prisma.transaction.create({
                data: {
                    userId,
                    amount: Math.abs(diff),
                    type: diff > 0 ? 'income' : 'expense',
                    description: 'Penyesuaian Saldo',
                    date: new Date(),
                    walletId: id,
                }
            })
        }

        return NextResponse.json({ wallet })
    } catch (error) {
        console.error('Error updating wallet:', error)
        return NextResponse.json(
            { error: 'Gagal mengupdate dompet' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
        try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const { id } = await params
        await prisma.wallet.delete({
            where: { id },
        })
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Error deleting wallet:', err)
        return NextResponse.json(
            { error: 'Gagal menghapus dompet' },
            { status: 500 }
        )
    }
}
