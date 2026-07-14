import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { transactionSchema } from '@/lib/validation'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
        try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const { id } = await params
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        color: true,
                    },
                },
                wallet: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    }
                }
            },
        })

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaksi tidak ditemukan' },
                { status: 404 }
            )
        }

        return NextResponse.json({ transaction })
    } catch {
        return NextResponse.json(
            { error: 'Gagal mengambil transaksi' },
            { status: 500 }
        )
    }
}

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
        const validation = transactionSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: validation.error.issues },
                { status: 400 }
            )
        }

        // Get old transaction for budget adjustment
        const oldTransaction = await prisma.transaction.findUnique({
            where: { id },
        })

        if (!oldTransaction) {
            return NextResponse.json(
                { error: 'Transaksi tidak ditemukan' },
                { status: 404 }
            )
        }

        const { amount, type, categoryId, walletId, description, date, isRecurring, recurringType } = validation.data

        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                amount,
                type,
                categoryId: categoryId || null,
                walletId: walletId || null,
                description,
                date: new Date(date),
                isRecurring,
                recurringType: isRecurring ? recurringType : null,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        color: true,
                    },
                },
                wallet: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    }
                }
            },
        })

        // Revert old wallet balance
        if (oldTransaction.walletId) {
            await prisma.wallet.update({
                where: { id: oldTransaction.walletId },
                data: {
                    balance: oldTransaction.type === 'income' 
                        ? { decrement: oldTransaction.amount } 
                        : { increment: oldTransaction.amount }
                }
            })
        }

        // Apply new wallet balance
        if (walletId) {
            await prisma.wallet.update({
                where: { id: walletId },
                data: {
                    balance: type === 'income' 
                        ? { increment: amount } 
                        : { decrement: amount }
                }
            })
        }

        // Adjust budget spent
        if (oldTransaction.type === 'expense' && oldTransaction.categoryId) {
            const oldMonthStart = new Date(
                oldTransaction.date.getFullYear(),
                oldTransaction.date.getMonth(),
                1
            )
            await prisma.budget.updateMany({
                where: {
                    userId: oldTransaction.userId,
                    categoryId: oldTransaction.categoryId,
                    month: oldMonthStart,
                },
                data: {
                    spent: { decrement: oldTransaction.amount },
                },
            })
        }

        if (type === 'expense' && categoryId) {
            const newMonthStart = new Date(date.getFullYear(), date.getMonth(), 1)
            await prisma.budget.upsert({
                where: {
                    userId_categoryId_month: {
                        userId: oldTransaction.userId,
                        categoryId,
                        month: newMonthStart,
                    },
                },
                create: {
                    userId: oldTransaction.userId,
                    categoryId,
                    month: newMonthStart,
                    amount: 0,
                    spent: amount,
                },
                update: {
                    spent: { increment: amount },
                },
            })
        }

        return NextResponse.json({ transaction })
    } catch (error) {
        console.error('Error updating transaction:', error)
        return NextResponse.json(
            { error: 'Gagal mengupdate transaksi' },
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
        const transaction = await prisma.transaction.findUnique({
            where: { id },
        })

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaksi tidak ditemukan' },
                { status: 404 }
            )
        }

        // Adjust budget if expense
        if (transaction.type === 'expense' && transaction.categoryId) {
            const monthStart = new Date(
                transaction.date.getFullYear(),
                transaction.date.getMonth(),
                1
            )
            await prisma.budget.updateMany({
                where: {
                    userId: transaction.userId,
                    categoryId: transaction.categoryId,
                    month: monthStart,
                },
                data: {
                    spent: { decrement: transaction.amount },
                },
            })
        }

        // Revert wallet balance if exists
        if (transaction.walletId) {
            await prisma.wallet.update({
                where: { id: transaction.walletId },
                data: {
                    balance: transaction.type === 'income' 
                        ? { decrement: transaction.amount } 
                        : { increment: transaction.amount }
                }
            })
        }

        await prisma.transaction.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting transaction:', error)
        return NextResponse.json(
            { error: 'Gagal menghapus transaksi' },
            { status: 500 }
        )
    }
}