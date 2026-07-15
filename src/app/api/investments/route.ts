import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const investments = await prisma.investment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        })

        const summary = {
            totalCurrentValue: investments.reduce((s, i) => s + (i.currentValue ?? i.amount), 0),
            totalCost: investments.reduce((s, i) => s + i.amount, 0),
            count: investments.length,
        }

        return NextResponse.json({ investments, summary })
    } catch (error) {
        console.error('Error fetching investments:', error)
        return NextResponse.json({ error: 'Gagal mengambil data investasi' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const userId = session.user.id

        const body = await request.json()
        const { name, type, amount, currentValue, returns, startDate, notes } = body

        if (!name || !type || !amount || !startDate) {
            return NextResponse.json(
                { error: 'Nama, tipe, modal awal, dan tanggal mulai harus diisi' },
                { status: 400 }
            )
        }

        const investment = await prisma.investment.create({
            data: {
                userId,
                name,
                type,
                amount: parseFloat(amount),
                currentValue: currentValue ? parseFloat(currentValue) : null,
                returns: returns ? parseFloat(returns) : null,
                startDate: new Date(startDate),
                notes: notes || null,
            },
        })

        return NextResponse.json({ investment }, { status: 201 })
    } catch (error) {
        console.error('Error creating investment:', error)
        return NextResponse.json({ error: 'Gagal menambahkan investasi' }, { status: 500 })
    }
}
