import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const debts = await prisma.debt.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        })

        const debtsOnly = debts.filter(d => d.debtType === 'debt')
        const receivablesOnly = debts.filter(d => d.debtType === 'receivable')

        const summary = {
            totalRemainingAmount: debtsOnly.reduce((s, d) => s + d.remainingAmount, 0),
            totalMonthlyPayment: debtsOnly.reduce((s, d) => s + d.monthlyPayment, 0),
            totalOriginalAmount: debtsOnly.reduce((s, d) => s + d.totalAmount, 0),
            count: debtsOnly.length,
        }

        const receivableSummary = {
            totalRemainingAmount: receivablesOnly.reduce((s, d) => s + d.remainingAmount, 0),
            totalMonthlyPayment: receivablesOnly.reduce((s, d) => s + d.monthlyPayment, 0),
            totalOriginalAmount: receivablesOnly.reduce((s, d) => s + d.totalAmount, 0),
            count: receivablesOnly.length,
        }

        return NextResponse.json({ debts, summary, receivableSummary })
    } catch (error) {
        console.error('Error fetching debts:', error)
        return NextResponse.json({ error: 'Gagal mengambil data utang' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const body = await request.json()
        const { name, type, debtType, totalAmount, remainingAmount, monthlyPayment, interestRate, dueDate, walletId } = body

        if (!name || !type || !totalAmount || !remainingAmount || !monthlyPayment) {
            return NextResponse.json(
                { error: 'Nama, tipe, jumlah total, sisa utang, dan cicilan bulanan harus diisi' },
                { status: 400 }
            )
        }

        const parsedTotal = parseFloat(totalAmount);
        const actualDebtType = debtType || 'debt';

        let debt;

        if (walletId) {
            // Perform in transaction if wallet is involved
            debt = await prisma.$transaction(async (tx) => {
                const newDebt = await tx.debt.create({
                    data: {
                        userId,
                        name,
                        type,
                        debtType: actualDebtType,
                        totalAmount: parsedTotal,
                        remainingAmount: parseFloat(remainingAmount),
                        monthlyPayment: parseFloat(monthlyPayment),
                        interestRate: interestRate ? parseFloat(interestRate) : null,
                        dueDate: dueDate ? new Date(dueDate) : null,
                    },
                })

                // Create transaction and update wallet
                await tx.transaction.create({
                    data: {
                        userId,
                        amount: parsedTotal,
                        type: actualDebtType === 'receivable' ? 'expense' : 'income',
                        walletId,
                        description: `${actualDebtType === 'receivable' ? 'Piutang' : 'Utang'}: ${name}`,
                        date: new Date(),
                    }
                })

                await tx.wallet.update({
                    where: { id: walletId },
                    data: {
                        balance: actualDebtType === 'receivable' 
                            ? { decrement: parsedTotal }
                            : { increment: parsedTotal }
                    }
                })

                return newDebt;
            })
        } else {
            debt = await prisma.debt.create({
                data: {
                    userId,
                    name,
                    type,
                    debtType: actualDebtType,
                    totalAmount: parsedTotal,
                    remainingAmount: parseFloat(remainingAmount),
                    monthlyPayment: parseFloat(monthlyPayment),
                    interestRate: interestRate ? parseFloat(interestRate) : null,
                    dueDate: dueDate ? new Date(dueDate) : null,
                },
            })
        }

        return NextResponse.json({ debt }, { status: 201 })
    } catch (error) {
        console.error('Error creating debt:', error)
        return NextResponse.json({ error: 'Gagal menambahkan utang' }, { status: 500 })
    }
}
