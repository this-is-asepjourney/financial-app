import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { walletSchema } from '@/lib/validation'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 })
        }

        const wallets = await prisma.wallet.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
            include: {
                transactions: {
                    where: { date: { gt: new Date() } },
                    select: { amount: true, type: true }
                }
            }
        })

        const processedWallets = wallets.map(wallet => {
            let futureNet = 0
            wallet.transactions.forEach(t => {
                if (t.type === 'income') futureNet += t.amount
                if (t.type === 'expense') futureNet -= t.amount
            })
            const { transactions, ...walletData } = wallet
            return {
                ...walletData,
                balance: walletData.balance - futureNet,
                projectedBalance: walletData.balance
            }
        })

        return NextResponse.json({ wallets: processedWallets })
    } catch (error) {
        console.error('Error fetching wallets:', error)
        return NextResponse.json(
            { error: 'Gagal mengambil data dompet' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validation = walletSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { name, type, balance } = validation.data
        const userId = body.userId

        if (!userId) {
            return NextResponse.json({ error: 'User ID diperlukan' }, { status: 400 })
        }

        const wallet = await prisma.wallet.create({
            data: {
                userId,
                name,
                type,
                balance: balance || 0,
            },
        })

        return NextResponse.json({ wallet }, { status: 201 })
    } catch (error) {
        console.error('Error creating wallet:', error)
        return NextResponse.json(
            { error: 'Gagal membuat dompet' },
            { status: 500 }
        )
    }
}
