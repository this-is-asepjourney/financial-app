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
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { amount, walletId } = body

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Nominal cicilan tidak valid' }, { status: 400 })
        }

        if (!walletId) {
            return NextResponse.json({ error: 'Pilih dompet sumber/tujuan dana' }, { status: 400 })
        }

        const debt = await prisma.debt.findUnique({ where: { id } })
        if (!debt || debt.userId !== session.user.id) {
            return NextResponse.json({ error: 'Utang/piutang tidak ditemukan' }, { status: 404 })
        }

        const wallet = await prisma.wallet.findUnique({ where: { id: walletId } })
        if (!wallet || wallet.userId !== session.user.id) {
            return NextResponse.json({ error: 'Dompet tidak ditemukan' }, { status: 404 })
        }

        const paymentAmount = parseFloat(amount.toString())

        if (paymentAmount > debt.remainingAmount) {
            return NextResponse.json({ error: 'Nominal melebihi sisa utang/piutang' }, { status: 400 })
        }

        // Calculate new balances
        const newDebtBalance = debt.remainingAmount - paymentAmount
        
        let newWalletBalance = wallet.balance
        let transactionType = ''
        let description = ''

        if (debt.debtType === 'receivable') {
            // Cicilan Piutang: We receive money
            newWalletBalance += paymentAmount
            transactionType = 'income'
            description = `Terima Cicilan Piutang: ${debt.name}`
        } else {
            // Cicilan Utang: We pay money
            if (wallet.balance < paymentAmount) {
                return NextResponse.json({ error: 'Saldo dompet tidak mencukupi' }, { status: 400 })
            }
            newWalletBalance -= paymentAmount
            transactionType = 'expense'
            description = `Bayar Cicilan Utang: ${debt.name}`
        }

        // Execute transaction
        await prisma.$transaction([
            prisma.debt.update({
                where: { id },
                data: { remainingAmount: newDebtBalance }
            }),
            prisma.transaction.create({
                data: {
                    userId: session.user.id,
                    walletId: wallet.id,
                    amount: paymentAmount,
                    type: transactionType,
                    description,
                    date: new Date(),
                }
            }),
            prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: newWalletBalance }
            })
        ])

        return NextResponse.json({ success: true, newDebtBalance, newWalletBalance })
    } catch (error) {
        console.error('Error paying installment:', error)
        return NextResponse.json({ error: 'Gagal memproses cicilan' }, { status: 500 })
    }
}
