import os

# 1. Update /api/debts/route.ts
filepath = 'src/app/api/debts/route.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Replace POST method body
old_post = """
        const body = await request.json()
        const { name, type, debtType, totalAmount, remainingAmount, monthlyPayment, interestRate, dueDate } = body

        if (!name || !type || !totalAmount || !remainingAmount || !monthlyPayment) {
            return NextResponse.json(
                { error: 'Nama, tipe, jumlah total, sisa utang, dan cicilan bulanan harus diisi' },
                { status: 400 }
            )
        }

        const debt = await prisma.debt.create({
            data: {
                userId,
                name,
                type,
                debtType: debtType || 'debt',
                totalAmount: parseFloat(totalAmount),
                remainingAmount: parseFloat(remainingAmount),
                monthlyPayment: parseFloat(monthlyPayment),
                interestRate: interestRate ? parseFloat(interestRate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        })

        return NextResponse.json({ debt }, { status: 201 })
"""

new_post = """
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
"""

content = content.replace(old_post.strip(), new_post.strip())

with open(filepath, 'w') as f:
    f.write(content)

# 2. Create /api/debts/[id]/pay/route.ts
pay_route = """import { NextResponse } from 'next/server'
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
"""

os.makedirs('src/app/api/debts/[id]/pay', exist_ok=True)
with open('src/app/api/debts/[id]/pay/route.ts', 'w') as f:
    f.write(pay_route)

print("API updated successfully.")
