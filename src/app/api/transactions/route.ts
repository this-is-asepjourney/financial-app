import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { transactionSchema } from '@/lib/validation'
import { getMonthRange } from '@/lib/utils'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const month = searchParams.get('month')
        const type = searchParams.get('type')
        const categoryId = searchParams.get('categoryId')
        const search = searchParams.get('search')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        if (!userId) {
            return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { userId }

        if (month) {
            const date = new Date(month)
            const { start, end } = getMonthRange(date)
            where.date = { gte: start, lte: end }
        }

        if (type) where.type = type
        if (categoryId) where.categoryId = categoryId

        if (search) {
            where.OR = [
                { description: { contains: search } },
                { category: { name: { contains: search } } },
            ]
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
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
                    },
                    toWallet: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        }
                    }
                },
                orderBy: { date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.transaction.count({ where }),
        ])

        return NextResponse.json({
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json(
            { error: 'Gagal mengambil transaksi' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validation = transactionSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { amount, type, categoryId, walletId, toWalletId, description, date, isRecurring, recurringType } = validation.data
        const userId = body.userId

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                amount,
                type,
                categoryId: categoryId || null,
                walletId: walletId || null,
                toWalletId: toWalletId || null,
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

        // Update Wallet Balance
        if (type === 'transfer' && walletId && toWalletId) {
            await prisma.wallet.update({
                where: { id: walletId },
                data: { balance: { decrement: amount } }
            })
            await prisma.wallet.update({
                where: { id: toWalletId },
                data: { balance: { increment: amount } }
            })
        } else if (walletId) {
            await prisma.wallet.update({
                where: { id: walletId },
                data: {
                    balance: type === 'income' ? { increment: amount } : { decrement: amount }
                }
            })
        }

        // Update budget spent if expense
        if (type === 'expense' && categoryId) {
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
            await prisma.budget.upsert({
                where: {
                    userId_categoryId_month: {
                        userId,
                        categoryId,
                        month: monthStart,
                    },
                },
                create: {
                    userId,
                    categoryId,
                    month: monthStart,
                    amount: 0,
                    spent: amount,
                },
                update: {
                    spent: { increment: amount },
                },
            })
        }

        return NextResponse.json({ transaction }, { status: 201 })
    } catch (error) {
        console.error('Error creating transaction:', error)
        return NextResponse.json(
            { error: 'Gagal membuat transaksi' },
            { status: 500 }
        )
    }
}