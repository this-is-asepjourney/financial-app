import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { walletSchema } from '@/lib/validation'

export async function GET(request: Request) {
        try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const { searchParams } = new URL(request.url)
        const wallets = await prisma.wallet.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
            include: {
                transactionsFrom: {
                    where: { date: { gt: new Date() } },
                    select: { amount: true, type: true }
                },
                transactionsTo: {
                    where: { date: { gt: new Date() } },
                    select: { amount: true, type: true }
                }
            }
        })

        const processedWallets = wallets.map(wallet => {
            let futureNet = 0
            wallet.transactionsFrom.forEach(t => {
                if (t.type === 'income') futureNet += t.amount
                if (t.type === 'expense' || t.type === 'transfer') futureNet -= t.amount
            })
            wallet.transactionsTo.forEach(t => {
                if (t.type === 'transfer') futureNet += t.amount
            })
            const { transactionsFrom, transactionsTo, ...walletData } = wallet
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
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const body = await request.json()
        const validation = walletSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validasi gagal', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { name, type, balance } = validation.data
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
