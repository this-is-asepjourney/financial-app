import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const { id } = await params
        const body = await request.json()
        const { walletId } = body

        const debt = await prisma.debt.findUnique({ where: { id } })
        if (!debt || debt.userId !== userId) {
            return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
        }

        if (walletId) {
            await prisma.$transaction(async (tx) => {
                await tx.debt.update({
                    where: { id },
                    data: { remainingAmount: 0 }
                })

                // If piutang is returned, it's income. If utang is paid, it's expense.
                const txType = debt.debtType === 'receivable' ? 'income' : 'expense'
                const amount = debt.remainingAmount

                await tx.transaction.create({
                    data: {
                        userId,
                        amount,
                        type: txType,
                        walletId,
                        description: `Pelunasan ${debt.debtType === 'receivable' ? 'Piutang' : 'Utang'}: ${debt.name}`,
                        date: new Date(),
                    }
                })

                await tx.wallet.update({
                    where: { id: walletId },
                    data: {
                        balance: txType === 'income' 
                            ? { increment: amount }
                            : { decrement: amount }
                    }
                })
            })
        } else {
            await prisma.debt.update({
                where: { id },
                data: { remainingAmount: 0 }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error paying debt:', error)
        return NextResponse.json({ error: 'Gagal memproses pelunasan' }, { status: 500 })
    }
}
